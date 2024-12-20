/*******************************************************************************
 * Copyright (c) 2024 Triadium (triadium.ru)
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General
 * Public License along with this program.
 * If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
import { int } from '../BaseTypes'
import { GSymbol } from '../GSymbol'
import { Automaton, BaseLexer, IContextProvider, TokenKernel } from '../Lexer'
import { ParseError } from '../ParseError'
import { ParseResult } from '../ParseResult'
import { SemanticAction } from '../SemanticAction'
import { TableElemRef } from '../TableElemRef'
import { TableType } from '../TableType'
import { UnexpectedTokenError } from '../UnexpectedTokenError'
import { ArrayCopy, Queue, ROList } from '../Utils'

import { BaseLRParser } from './BaseLRParser'
import { GSS } from './GSS'
import { GSSPath } from './GSSPath'
import { LRActionCode } from './LRActionCode'
import { LROpCodeBase } from './LROpCodeBase'
import { LRProduction } from './LRProduction'
import { RNGLRAutomaton } from './RNGLRAutomaton'
import { SPPF } from './SPPF'
import { SPPFBuilder } from './SPPFBuilder'

/// <summary>
/// Represents a base for all RNGLR parsers
/// </summary>
export class RNGLRParser extends BaseLRParser implements IContextProvider {
  /// <summary>
  /// The parser automaton
  /// </summary>
  private readonly parserAutomaton: RNGLRAutomaton
  /// <summary>
  /// The GSS for this parser
  /// </summary>
  private readonly gss: GSS
  /// <summary>
  /// The SPPF being built
  /// </summary>
  private readonly sppf: SPPFBuilder
  /// <summary>
  /// The sub-trees for the constant nullable variables
  /// </summary>
  private readonly nullables: int[]
  /// <summary>
  /// The next token
  /// </summary>
  private nextToken!: TokenKernel
  /// <summary>
  /// The queue of reduction operations
  /// </summary>
  private reductions!: Queue<RNGLRParser.Reduction>
  /// <summary>
  /// The queue of shift operations
  /// </summary>
  private shifts!: Queue<RNGLRParser.Shift>

  /// <summary>
  /// Initializes a new instance of the LRkParser class with the given lexer
  /// </summary>
  /// <param name="automaton">The parser's automaton</param>
  /// <param name="variables">The parser's variables</param>
  /// <param name="virtuals">The parser's virtuals</param>
  /// <param name="actions">The parser's actions</param>
  /// <param name="lexer">The input lexer</param>
  constructor(
    automaton: RNGLRAutomaton,
    variables: GSymbol[],
    virtuals: GSymbol[],
    actions: SemanticAction[],
    lexer: BaseLexer,
  ) {
    super(variables, virtuals, actions, lexer)

    this.parserAutomaton = automaton
    this.gss = new GSS()
    this.sppf = new SPPFBuilder(lexer.tokens, this.symVariables, this.symVirtuals)
    this.nullables = new Array<int>(variables.length)
    this.BuildNullables(variables.length)
    this.sppf.ClearHistory()
  }

  /// <summary>
  /// Gets the priority of the specified context required by the specified terminal
  /// The priority is a positive integer. The lesser the value the higher the priority.
  /// A value of -1 represents the unavailability of the required context.
  /// </summary>
  /// <param name="context">A context</param>
  /// <param name="onTerminalID">The identifier of the terminal requiring the context</param>
  /// <returns>The context priority, or -1 if the context is unavailable</returns>
  GetContextPriority(context: int, onTerminalID: int): int {
    // the default context is always active
    if (context === Automaton.DEFAULT_CONTEXT) {
      return Number.MAX_SAFE_INTEGER
    }

    if (this.lexer.tokens.Size === 0) {
      // this is the first token, does it open the context?
      return this.parserAutomaton.GetContexts(0).Opens(onTerminalID, context) ? 0 : -1
    }
    // try to only look at stack heads that expect the terminal
    const queue = new Array<int>()
    const productions = new Array<LRProduction | null>()
    const distances = new Array<int>()
    let foundOnPreviousShift = false
    for (const shift of this.shifts) {
      const count = this.parserAutomaton.GetActionsCount(shift.to, onTerminalID)
      if (count === 0) {
        continue
      }

      for (let i = 0; i < count; ++i) {
        const action = this.parserAutomaton.GetAction(shift.to, onTerminalID, i)
        if (action.Code === LRActionCode.Shift) {
          // does the context opens with the terminal?
          if (this.parserAutomaton.GetContexts(shift.to).Opens(onTerminalID, context)) {
            return 0
          }
          // looking at the immediate history, does the context opens from the shift just before?
          if (
            this.parserAutomaton
              .GetContexts(this.gss.GetRepresentedState(shift.from))
              .Opens(this.nextToken.TerminalID, context)
          ) {
            foundOnPreviousShift = true
            break
          }
          // no, enqueue
          if (!queue.includes(shift.from)) {
            queue.push(shift.from)
            productions.push(null)
            distances.push(2)
          }
        } else {
          // this is reduction
          const production = this.parserAutomaton.GetProduction(action.Data)
          // looking at the immediate history, does the context opens from the shift just before?
          if (
            this.parserAutomaton
              .GetContexts(this.gss.GetRepresentedState(shift.from))
              .Opens(this.nextToken.TerminalID, context)
          ) {
            if (production.ReductionLength < 1) {
              // the reduction does not close the context
              foundOnPreviousShift = true
              break
            }
          }
          // no, enqueue
          if (!queue.includes(shift.from)) {
            queue.push(shift.from)
            productions.push(production)
            distances.push(2)
          }
        }
      }
    }
    if (foundOnPreviousShift) {
      // found the context opening on the previous shift (and was not immediately closed by a reduction)
      return 1
    }
    if (queue.length === 0) {
      // the track is empty, the terminal is unexpected
      return -1
    }
    // explore the current GSS to find the specified context
    for (let i = 0; i < queue.length; ++i) {
      const refs = { count: 0 }
      const paths = this.gss.GetPaths(queue[i]!, 1, refs)
      for (let p = 0; p < refs.count; ++p) {
        const from = paths[p]!.Last
        const symbolID = this.sppf.GetSymbolOn(paths[p]![0]!).ID
        const distance = distances[i]!
        const production = productions[i]!
        // was the context opened on this transition?
        if (this.parserAutomaton.GetContexts(this.gss.GetRepresentedState(from)).Opens(symbolID, context)) {
          if (production == null || production.ReductionLength < distance) {
            return distance
          }
        }
        // no, enqueue
        if (!queue.includes(from)) {
          queue.push(from)
          productions.push(production)
          distances.push(distance + 1)
        }
      }
    }
    // at this point, the requested context is not yet open
    // can it be open by a token with the specified terminal ID?
    // queue of GLR states to inspect:
    const queueGSSHead = new Array<int>() // the related GSS head
    const queueVStack = new Array<int[]>() // the virtual stack
    // first reduction
    for (const shift of this.shifts) {
      const count = this.parserAutomaton.GetActionsCount(shift.to, onTerminalID)
      if (count > 0) {
        // enqueue the info, top GSS stack node and target GLR state
        queueGSSHead.push(shift.from)
        queueVStack.push([shift.to])
      }
    }
    // now, close the queue
    for (let i = 0; i < queueGSSHead.length; ++i) {
      const head = queueVStack[i]![queueVStack[i]!.length - 1]!
      const count = this.parserAutomaton.GetActionsCount(head, onTerminalID)
      if (count === 0) {
        continue
      }
      for (let j = 0; j < count; ++j) {
        const action = this.parserAutomaton.GetAction(head, onTerminalID, j)
        if (action.Code !== LRActionCode.Reduce) {
          continue
        }
        // execute the reduction
        const production = this.parserAutomaton.GetProduction(action.Data)
        if (production.ReductionLength === 0) {
          // 0-length reduction => start from the current head
          const virtualStack = new Array<int>(queueVStack[i]!.length + 1)
          ArrayCopy(queueVStack[i]!, 0, virtualStack, 0, queueVStack[i]!.length)
          const next = this.GetNextByVar(head, this.symVariables[production.Head]!.ID)
          virtualStack[virtualStack.length - 1] = next
          // enqueue
          queueGSSHead.push(queueGSSHead[i]!)
          queueVStack.push(virtualStack)
        } else if (production.ReductionLength < queueVStack[i]!.length) {
          // we are still the virtual stack
          const virtualStack = new Array<int>(queueVStack[i]!.length - production.ReductionLength + 1)
          ArrayCopy(queueVStack[i]!, 0, virtualStack, 0, virtualStack.length - 1)
          const next = this.GetNextByVar(virtualStack[virtualStack.length - 2]!, this.symVariables[production.Head]!.ID)
          virtualStack[virtualStack.length - 1] = next
          // enqueue
          queueGSSHead.push(queueGSSHead[i]!)
          queueVStack.push(virtualStack)
        } else {
          // we reach the GSS
          const refs = { count: 0 }
          const paths = this.gss.GetPaths(queueGSSHead[i]!, production.ReductionLength - queueVStack[i]!.length, refs)
          for (let k = 0; k < refs.count; ++k) {
            const path = paths[k]!
            // get the target GLR state
            const next = this.GetNextByVar(
              this.gss.GetRepresentedState(path.Last),
              this.symVariables[production.Head]!.ID,
            )
            // enqueue the info, top GSS stack node and target GLR state
            queueGSSHead.push(path.Last)
            queueVStack.push([next])
          }
        }
      }
    }
    for (const vstack of queueVStack) {
      const state = vstack[vstack.length - 1]!
      const count = this.parserAutomaton.GetActionsCount(state, onTerminalID)
      for (let i = 0; i < count; ++i) {
        const action = this.parserAutomaton.GetAction(state, onTerminalID, i)
        if (
          action.Code === LRActionCode.Shift &&
          this.parserAutomaton.GetContexts(state).Opens(onTerminalID, context)
        ) {
          // the context opens here
          return 0
        }
      }
    }
    // the context is still unavailable
    return -1
  }

  /// <summary>
  /// Builds the constant sub-trees of nullable variables
  /// </summary>
  /// <param name="varCount">The total number of variables</param>
  private BuildNullables(varCount: int): void {
    // Get the dependency table
    const dependencies = this.BuildNullableDependencies(varCount)
    // Solve and build
    let remaining = 1
    while (remaining > 0) {
      remaining = 0
      let solved = 0
      for (let i = 0; i < varCount; ++i) {
        const dep = dependencies[i]
        if (dep != null) {
          let ok = true
          for (const r of dep) {
            ok = ok && dependencies[r] == null
          }
          if (ok) {
            const prod = this.parserAutomaton.GetNullableProduction(i)!
            this.nullables[i] = this.BuildSPPF(0, prod, SPPF.EPSILON, null)
            dependencies[i] = null
            solved++
          } else {
            remaining++
          }
        }
      }
      if (solved === 0 && remaining > 0) {
        // There is dependency cycle ...
        // That should not be possible ...
        throw new Error('Failed to initialize the parser, found a cycle in the nullable variables')
      }
    }
  }

  /// <summary>
  /// Builds the dependency table between nullable variables
  /// </summary>
  /// <param name="varCount">The total number of variables</param>
  /// <returns>The dependency table</returns>
  private BuildNullableDependencies(varCount: int): Array<int[] | null> {
    const result = new Array<int[]>(varCount)
    for (let i = 0; i < varCount; ++i) {
      const prod = this.parserAutomaton.GetNullableProduction(i)
      if (prod != null) {
        result[i] = RNGLRParser.GetNullableDependencies(prod)
      }
    }
    return result
  }

  /// <summary>
  /// Gets the dependencies on nullable variables
  /// </summary>
  /// <param name="production">The production of a nullable variable</param>
  /// <returns>The list of the nullable variables' indices that this production depends on</returns>
  private static GetNullableDependencies(production: LRProduction): Array<int> {
    const result = new Array<int>()
    for (let i = 0; i < production.BytecodeLength; ++i) {
      const op = production[i]!
      switch (op.Base) {
        case LROpCodeBase.SemanticAction: {
          i++
          break
        }
        case LROpCodeBase.AddVirtual: {
          i++
          break
        }
        case LROpCodeBase.AddNullVariable: {
          result.push(production[i + 1]!.DataValue)
          i++
          break
        }
        default:
          break
      }
    }
    return result
  }

  /// <summary>
  /// Raises an error on an unexepcted token
  /// </summary>
  /// <param name="stem">The size of the generation's stem</param>
  private OnUnexpectedToken(stem: int): void {
    // build the list of expected terminals
    const expected = new Array<GSymbol>()
    const genData = this.gss.GetCurrentGeneration()
    for (let i = 0; i < genData.Count; ++i) {
      const expectedOnHead = this.parserAutomaton.GetExpected(
        this.gss.GetRepresentedState(i + genData.Start),
        this.lexer.Terminals,
      )
      // register the terminals for shift actions
      for (const terminal of expectedOnHead.Shifts) {
        if (!expected.includes(terminal)) {
          expected.push(terminal)
        }
      }
      if (i < stem) {
        // the state was in the stem, also look for reductions
        for (const terminal of expectedOnHead.Reductions) {
          if (!expected.includes(terminal) && this.CheckIsExpected(i + genData.Start, terminal)) {
            expected.push(terminal)
          }
        }
      }
    }
    // register the error
    const error = new UnexpectedTokenError(this.lexer.tokens[this.nextToken.Index]!, new ROList<GSymbol>(expected))
    this.allErrors.push(error)

    if (this.ModeDebug) {
      console.log('==== RNGLR parsing error:')
      const context = this.lexer.Input.GetContext(error.Position)
      console.log(`\t${error}\n\t${context.Content}\n\t${context.Pointer}`)
      this.gss.Print()
    }
  }

  /// <summary>
  /// Checks whether the specified terminal is indeed expected for a reduction
  /// </summary>
  /// <param name="gssNode">The GSS node from which to reduce</param>
  /// <param name="terminal">The terminal to check</param>
  /// <returns><code>true</code> if the terminal is really expected</returns>
  /// <remarks>
  /// This check is required because in the case of a base LALR graph,
  /// some terminals expected for reduction in the automaton are coming from other paths.
  /// </remarks>
  private CheckIsExpected(gssNode: int, terminal: GSymbol): boolean {
    // queue of GLR states to inspect:
    const queueGSSHead = new Array<int>() // the related GSS head
    const queueVStack = new Array<int[]>() // the virtual stack

    // first reduction
    {
      const count = this.parserAutomaton.GetActionsCount(this.gss.GetRepresentedState(gssNode), terminal.ID)
      for (let j = 0; j < count; ++j) {
        const action = this.parserAutomaton.GetAction(this.gss.GetRepresentedState(gssNode), terminal.ID, j)
        if (action.Code === LRActionCode.Reduce) {
          // execute the reduction
          const production = this.parserAutomaton.GetProduction(action.Data)
          const refs = { count: 0 }
          const paths = this.gss.GetPaths(gssNode, production.ReductionLength, refs)
          for (let k = 0; k < refs.count; ++k) {
            const path = paths[k]!
            // get the target GLR state
            const next = this.GetNextByVar(
              this.gss.GetRepresentedState(path.Last),
              this.symVariables[production.Head]!.ID,
            )
            // enqueue the info, top GSS stack node and target GLR state
            queueGSSHead.push(path.Last)
            queueVStack.push([next])
          }
        }
      }
    }

    // now, close the queue
    for (let i = 0; i < queueGSSHead.length; ++i) {
      const head = queueVStack[i]![queueVStack[i]!.length - 1]!
      const count = this.parserAutomaton.GetActionsCount(head, terminal.ID)
      if (count === 0) {
        continue
      }
      for (let j = 0; j < count; ++j) {
        const action = this.parserAutomaton.GetAction(head, terminal.ID, j)
        if (action.Code === LRActionCode.Shift) {
          // yep, the terminal was expected
          return true
        }
        if (action.Code === LRActionCode.Reduce) {
          // execute the reduction
          const production = this.parserAutomaton.GetProduction(action.Data)
          if (production.ReductionLength === 0) {
            // 0-length reduction => start from the current head
            const virtualStack = new Array<int>(queueVStack[i]!.length + 1)
            ArrayCopy(queueVStack[i]!, 0, virtualStack, 0, queueVStack[i]!.length)
            virtualStack[virtualStack.length - 1] = this.GetNextByVar(head, this.symVariables[production.Head]!.ID)
            // enqueue
            queueGSSHead.push(queueGSSHead[i]!)
            queueVStack.push(virtualStack)
          } else if (production.ReductionLength < queueVStack[i]!.length) {
            // we are still the virtual stack
            const virtualStack = new Array<int>(queueVStack[i]!.length - production.ReductionLength + 1)
            ArrayCopy(queueVStack[i]!, 0, virtualStack, 0, virtualStack.length - 1)
            virtualStack[virtualStack.length - 1] = this.GetNextByVar(
              virtualStack[virtualStack.length - 2]!,
              this.symVariables[production.Head]!.ID,
            )
            // enqueue
            queueGSSHead.push(queueGSSHead[i]!)
            queueVStack.push(virtualStack)
          } else {
            // we reach the GSS
            const refs = { count: 0 }
            const paths = this.gss.GetPaths(queueGSSHead[i]!, production.ReductionLength - queueVStack[i]!.length, refs)
            for (let k = 0; k < refs.count; ++k) {
              const path = paths[k]!
              // get the target GLR state
              const next = this.GetNextByVar(
                this.gss.GetRepresentedState(path.Last),
                this.symVariables[production.Head]!.ID,
              )
              // enqueue the info, top GSS stack node and target GLR state
              queueGSSHead.push(path.Last)
              queueVStack.push([next])
            }
          }
        }
      }
    }

    // nope, that was a pathological case in a LALR graph
    return false
  }

  /// <summary>
  /// Builds the SPPF
  /// </summary>
  /// <param name="generation">The current GSS generation</param>
  /// <param name="production">The LR production</param>
  /// <param name="first">The first label of the path</param>
  /// <param name="path">The reduction path</param>
  /// <returns>The identifier of the corresponding SPPF node</returns>
  private BuildSPPF(generation: int, production: LRProduction, first: int, path: GSSPath | null): int {
    const variable = this.symVariables[production.Head]!
    this.sppf.ReductionPrepare(first, path, production.ReductionLength)
    for (let i = 0; i < production.BytecodeLength; ++i) {
      const op = production[i]!
      switch (op.Base) {
        case LROpCodeBase.SemanticAction: {
          const action = this.symActions[production[i + 1]!.DataValue]!
          i++
          action(variable, this.sppf)
          break
        }
        case LROpCodeBase.AddVirtual: {
          const index = production[i + 1]!.DataValue
          this.sppf.ReductionAddVirtual(index, op.TreeAction)
          i++
          break
        }
        case LROpCodeBase.AddNullVariable: {
          const index = production[i + 1]!.DataValue
          this.sppf.ReductionAddNullable(this.nullables[index]!, op.TreeAction)
          i++
          break
        }
        default:
          this.sppf.ReductionPop(op.TreeAction)
          break
      }
    }
    return this.sppf.Reduce(generation, production.Head, production.HeadAction)
  }

  /// <summary>
  /// Parses the input and returns the produced AST
  /// </summary>
  /// <returns>AST produced by the parser representing the input, or null if unrecoverable errors were encountered</returns>
  Parse(): ParseResult {
    this.reductions = new Queue<RNGLRParser.Reduction>()
    this.shifts = new Queue<RNGLRParser.Shift>()
    let Ui = this.gss.CreateGeneration()
    const v0 = this.gss.CreateNode(0)
    this.nextToken = this.lexer.GetNextTokenWithContext(this)

    // bootstrap the shifts and reductions queues
    const count = this.parserAutomaton.GetActionsCount(0, this.nextToken.TerminalID)
    for (let i = 0; i < count; ++i) {
      const action = this.parserAutomaton.GetAction(0, this.nextToken.TerminalID, i)
      if (action.Code === LRActionCode.Shift) {
        this.shifts.Enqueue(new RNGLRParser.Shift(v0, action.Data))
      } else if (action.Code === LRActionCode.Reduce) {
        this.reductions.Enqueue(
          new RNGLRParser.Reduction(v0, this.parserAutomaton.GetProduction(action.Data), SPPF.EPSILON),
        )
      }
    }

    while (this.nextToken.TerminalID !== GSymbol.SID_EPSILON) {
      // Wait for ε token
      // the stem length (initial number of nodes in the generation before reductions)
      const stem = this.gss.GetGeneration(Ui).Count
      // apply all reduction actions
      this.Reducer(Ui)
      // no scheduled shift actions?
      if (this.shifts.Count === 0) {
        // the next token was not expected
        this.OnUnexpectedToken(stem)
        return new ParseResult(new ROList<ParseError>(this.allErrors), this.lexer.Input)
      }
      // look for the next next-token
      const oldtoken = this.nextToken
      this.nextToken = this.lexer.GetNextTokenWithContext(this)
      // apply the scheduled shift actions
      Ui = this.Shifter(oldtoken)
    }

    const genData = this.gss.GetGeneration(Ui)
    for (let i = genData.Start; i < genData.Start + genData.Count; ++i) {
      const state = this.gss.GetRepresentedState(i)
      if (this.parserAutomaton.IsAcceptingState(state)) {
        // Has reduction _Axiom_ -> axiom $ . on ε
        const paths = this.gss.GetPaths(i, 2, { count: 0 })
        return new ParseResult(
          new ROList<ParseError>(this.allErrors),
          this.lexer.Input,
          this.sppf.GetTree(paths[0]![1]!),
        )
      }
    }
    // At end of input but was still waiting for tokens
    return new ParseResult(new ROList<ParseError>(this.allErrors), this.lexer.Input)
  }

  /// <summary>
  /// Executes the reduction operations from the given GSS generation
  /// </summary>
  /// <param name="generation">The current GSS generation</param>
  private Reducer(generation: int): void {
    this.sppf.ClearHistory()
    while (this.reductions.Count !== 0) {
      this.ExecuteReduction(generation, this.reductions.Dequeue()!)
    }
  }

  /// <summary>
  /// Executes a reduction operation for all found path
  /// </summary>
  /// <param name="generation">The current GSS generation</param>
  /// <param name="reduction">The reduction operation</param>
  private ExecuteReduction(generation: int, reduction: RNGLRParser.Reduction): void {
    // Get all path from the reduction node
    const refs = { count: 0 }
    let paths
    if (reduction.prod.ReductionLength === 0) {
      paths = this.gss.GetPaths(reduction.node, 0, refs)
    } else {
      // The given GSS node is the second on the path, so start from it with length - 1
      paths = this.gss.GetPaths(reduction.node, reduction.prod.ReductionLength - 1, refs)
    }

    // Execute the reduction on all paths
    for (let i = 0; i < refs.count; ++i) {
      this.ExecuteReductionWithPath(generation, reduction, paths[i]!)
    }
  }

  /// <summary>
  /// Executes a reduction operation for a given path
  /// </summary>
  /// <param name="generation">The current GSS generation</param>
  /// <param name="reduction">The reduction operation</param>
  /// <param name="path">The GSS path to use for the reduction</param>
  private ExecuteReductionWithPath(generation: int, reduction: RNGLRParser.Reduction, path: GSSPath): void {
    // Get the rule's head
    const head = this.symVariables[reduction.prod.Head]!
    // Resolve the sub-root
    let label = this.sppf.GetLabelFor(path.Generation, new TableElemRef(TableType.Variable, reduction.prod.Head))
    if (label === SPPF.EPSILON) {
      // not in history, build the SPPF here
      label = this.BuildSPPF(generation, reduction.prod, reduction.first, path)
    }

    // Get the target state by transition on the rule's head
    const to = this.GetNextByVar(this.gss.GetRepresentedState(path.Last), head.ID)
    // Find a node for the target state in the GSS
    let w = this.gss.FindNode(generation, to)
    if (w !== -1) {
      // A node for the target state is already in the GSS
      if (!this.gss.HasEdge(generation, w, path.Last)) {
        // But the new edge does not exist
        this.gss.CreateEdge(w, path.Last, label)
        // Look for the new reductions at this state
        if (reduction.prod.ReductionLength != 0) {
          const count = this.parserAutomaton.GetActionsCount(to, this.nextToken.TerminalID)
          for (let i = 0; i < count; ++i) {
            const action = this.parserAutomaton.GetAction(to, this.nextToken.TerminalID, i)
            if (action.Code == LRActionCode.Reduce) {
              const prod = this.parserAutomaton.GetProduction(action.Data)
              // length 0 reduction are not considered here because they already exist at this point
              if (prod.ReductionLength != 0) {
                this.reductions.Enqueue(new RNGLRParser.Reduction(path.Last, prod, label))
              }
            }
          }
        }
      }
    } else {
      // Create the new corresponding node in the GSS
      w = this.gss.CreateNode(to)
      this.gss.CreateEdge(w, path.Last, label)
      // Look for all the reductions and shifts at this state
      const count = this.parserAutomaton.GetActionsCount(to, this.nextToken.TerminalID)
      for (let i = 0; i < count; ++i) {
        const action = this.parserAutomaton.GetAction(to, this.nextToken.TerminalID, i)
        if (action.Code === LRActionCode.Shift) {
          this.shifts.Enqueue(new RNGLRParser.Shift(w, action.Data))
        } else if (action.Code == LRActionCode.Reduce) {
          const prod = this.parserAutomaton.GetProduction(action.Data)
          if (prod.ReductionLength === 0) {
            this.reductions.Enqueue(new RNGLRParser.Reduction(w, prod, SPPF.EPSILON))
          } else if (reduction.prod.ReductionLength != 0) {
            this.reductions.Enqueue(new RNGLRParser.Reduction(path.Last, prod, label))
          }
        }
      }
    }
  }

  /// <summary>
  /// Executes the shift operations for the given token
  /// </summary>
  /// <param name="oldtoken">A token</param>
  /// <returns>The next generation</returns>
  private Shifter(oldtoken: TokenKernel): int {
    // Create next generation
    const gen = this.gss.CreateGeneration()

    // Create the GSS label to be used for the transitions
    const sym = new TableElemRef(TableType.Token, oldtoken.Index)
    const label = this.sppf.GetSingleNode(sym)

    // Execute all shifts in the queue at this point
    const count = this.shifts.Count
    for (let i = 0; i < count; ++i) {
      this.ExecuteShift(gen, label, this.shifts.Dequeue()!)
    }
    return gen
  }

  /// <summary>
  /// Executes a shift operation
  /// </summary>
  /// <param name="gen">The GSS generation to start from</param>
  /// <param name="label">The GSS label to use for the new GSS edges</param>
  /// <param name="shift">The shift operation</param>
  private ExecuteShift(gen: int, label: int, shift: RNGLRParser.Shift): void {
    let w = this.gss.FindNode(gen, shift.to)
    if (w != -1) {
      // A node for the target state is already in the GSS
      this.gss.CreateEdge(w, shift.from, label)
      // Look for the new reductions at this state
      const count = this.parserAutomaton.GetActionsCount(shift.to, this.nextToken.TerminalID)
      for (let i = 0; i < count; ++i) {
        const action = this.parserAutomaton.GetAction(shift.to, this.nextToken.TerminalID, i)
        if (action.Code === LRActionCode.Reduce) {
          const prod = this.parserAutomaton.GetProduction(action.Data)
          // length 0 reduction are not considered here because they already exist at this point
          if (prod.ReductionLength !== 0) {
            this.reductions.Enqueue(new RNGLRParser.Reduction(shift.from, prod, label))
          }
        }
      }
    } else {
      // Create the new corresponding node in the GSS
      w = this.gss.CreateNode(shift.to)
      this.gss.CreateEdge(w, shift.from, label)
      // Look for all the reductions and shifts at this state
      const count = this.parserAutomaton.GetActionsCount(shift.to, this.nextToken.TerminalID)
      for (let i = 0; i < count; ++i) {
        const action = this.parserAutomaton.GetAction(shift.to, this.nextToken.TerminalID, i)
        if (action.Code === LRActionCode.Shift) {
          this.shifts.Enqueue(new RNGLRParser.Shift(w, action.Data))
        } else if (action.Code === LRActionCode.Reduce) {
          const prod = this.parserAutomaton.GetProduction(action.Data)
          if (prod.ReductionLength === 0) {
            // Length 0 => reduce from the head
            this.reductions.Enqueue(new RNGLRParser.Reduction(w, prod, SPPF.EPSILON))
          } else {
            // reduce from the second node on the path
            this.reductions.Enqueue(new RNGLRParser.Reduction(shift.from, prod, label))
          }
        }
      }
    }
  }

  /// <summary>
  /// Gets the next RNGLR state by a shift with the given variable ID
  /// </summary>
  /// <param name="state">A RNGLR state</param>
  /// <param name="var">A variable ID</param>
  /// <returns>The next RNGLR state, or 0xFFFF if no transition is found</returns>
  private GetNextByVar(state: int, vari: int): int {
    const ac = this.parserAutomaton.GetActionsCount(state, vari)
    for (let i = 0; i < ac; ++i) {
      const action = this.parserAutomaton.GetAction(state, vari, i)
      if (action.Code === LRActionCode.Shift) {
        return action.Data
      }
    }
    return 0xffff
  }
}

export namespace RNGLRParser {
  /// <summary>
  /// Represents a reduction operation to be performed
  /// </summary>
  /// <remarks>
  /// For reduction of length 0, the node is the GSS node on which it is applied, the first label then is epsilon
  /// For others, the node is the SECOND GSS node on the path, not the head. The first label is then the label on the transition from the head
  /// </remarks>
  export class Reduction {
    /// <summary>
    /// The GSS node to reduce from
    /// </summary>
    readonly node: int
    /// <summary>
    /// The LR production for the reduction
    /// </summary>
    readonly prod: LRProduction
    /// <summary>
    /// The first label in the GSS
    /// </summary>
    readonly first: int

    /// <summary>
    /// Initializes this operation
    /// </summary>
    /// <param name="node">The GSS node to reduce from</param>
    /// <param name="prod">The LR production for the reduction</param>
    /// <param name="first">The first label in the GSS</param>
    constructor(node: int, prod: LRProduction, first: int) {
      this.node = node
      this.prod = prod
      this.first = first
    }
  }

  /// <summary>
  /// Represents a shift operation to be performed
  /// </summary>
  export class Shift {
    /// <summary>
    /// GSS node to shift from
    /// </summary>
    readonly from: int
    /// <summary>
    /// The target RNGLR state
    /// </summary>
    readonly to: int

    /// <summary>
    /// Initializes this operation
    /// </summary>
    /// <param name="from">The GSS node to shift from</param>
    /// <param name="to">The target RNGLR state</param>
    constructor(from: int, to: int) {
      this.from = from
      this.to = to
    }
  }
}
