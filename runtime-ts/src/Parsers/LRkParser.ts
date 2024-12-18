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
import { ArrayCopy, ROList } from "../Utils"
import { Automaton, BaseLexer, IContextProvider, TokenKernel } from "../Lexer"
import { BaseLRParser } from "./BaseLRParser"
import { GSymbol } from "../GSymbol"
import { int } from "../BaseTypes"
import { LRActionCode } from "./LRActionCode"
import { LRkASTBuilder } from "./LRkASTBuilder"
import { LRkAutomaton } from "./LRkAutomaton"
import { LROpCodeBase } from "./LROpCodeBase"
import { LRProduction } from "./LRProduction"
import { ParseError } from "../ParseError"
import { ParseResult } from "../ParseResult"
import { SemanticAction } from "../SemanticAction"
import { UnexpectedTokenError } from "../UnexpectedTokenError"


/// <summary>
/// Represents a base for all LR(k) parsers
/// </summary>
export abstract class LRkParser extends BaseLRParser implements IContextProvider {
	/// <summary>
	/// Initial size of the stack
	/// </summary>
	static readonly INIT_STACK_SIZE: int = 128

	/// <summary>
	/// The parser's automaton
	/// </summary>
	protected readonly automaton: LRkAutomaton

	/// <summary>
	/// The parser's stack
	/// </summary>
	private stack: int[]
	/// <summary>
	/// The identifiers of the items on the stack
	/// </summary>
	private stackIDs: int[]
	/// <summary>
	/// Index of the stack's head
	/// </summary>
	private head: int
	/// <summary>
	/// The AST builder
	/// </summary>
	private readonly builder: LRkASTBuilder

	/// <summary>
	/// Initializes a new instance of the parser
	/// </summary>
	/// <param name="automaton">The parser's automaton</param>
	/// <param name="variables">The parser's variables</param>
	/// <param name="virtuals">The parser's virtuals</param>
	/// <param name="actions">The parser's actions</param>
	/// <param name="lexer">The input lexer</param>
	protected constructor(automaton: LRkAutomaton, variables: GSymbol[], virtuals: GSymbol[], actions: SemanticAction[], lexer: BaseLexer) {
		super(variables, virtuals, actions, lexer)

		this.automaton = automaton;
		this.stack = new Array<int>(LRkParser.INIT_STACK_SIZE)
		this.stackIDs = new Array<int>(LRkParser.INIT_STACK_SIZE)
		this.head = 0
		this.builder = new LRkASTBuilder(lexer.tokens, this.symVariables, this.symVirtuals)
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
			return this.automaton.GetContexts(0).Opens(onTerminalID, context) ? 0 : -1
		}
		// retrieve the action for this terminal
		let action = this.automaton.GetAction(this.stack[this.head]!, onTerminalID)
		// if the terminal is unexpected, do not validate
		if (action.Code === LRActionCode.None) {
			return -1
		}
		// does the context opens with the terminal?
		if (action.Code === LRActionCode.Shift && this.automaton.GetContexts(this.stack[this.head]!).Opens(onTerminalID, context)) {
			return 0
		}
		let production = (action.Code === LRActionCode.Reduce) ? this.automaton.GetProduction(action.Data) : null
		// look into the stack for the opening of the context
		for (let i = this.head - 1; i > -1; i--) {
			if (this.automaton.GetContexts(this.stack[i]!).Opens(this.stackIDs[i + 1]!, context)) {
				// the context opens here
				// but is it closed by the reduction (if any)?
				if (production == null || i < this.head - production.ReductionLength) {
					// no, we are still in the context
					return this.head - i
				}
			}
		}
		// at this point, the requested context is not yet open or is closed by a reduction
		// now, if the action is something else than a reduction (shift, accept or error), the context can never be produced
		// for the context to open, a new state must be pushed onto the stack
		// this means that the provided terminal must trigger a chain of at least one reduction
		if (action.Code !== LRActionCode.Reduce) {
			return -1
		}
		// there is at least one reduction, simulate
		const myStack = new Array<int>(this.stack.length)
		ArrayCopy(this.stack, 0, myStack, 0, this.head + 1)
		let myHead = this.head
		while (action.Code === LRActionCode.Reduce) {
			// execute the reduction
			production = this.automaton.GetProduction(action.Data)
			myHead -= production.ReductionLength
			// this must be a shift
			action = this.automaton.GetAction(myStack[myHead]!, this.symVariables[production.Head]!.ID)
			myHead++
			if (myHead === myStack.length) {
				myStack.length = myStack.length + LRkParser.INIT_STACK_SIZE
			}
			myStack[myHead] = action.Data;
			// now, get the new action for the terminal
			action = this.automaton.GetAction(action.Data, onTerminalID)
		}
		// is this a shift action that opens the context?
		return ((action.Code === LRActionCode.Shift && this.automaton.GetContexts(myStack[myHead]!).Opens(onTerminalID, context)) ? 0 : -1)
	}

	/// <summary>
	/// Raises an error on an unexpected token
	/// </summary>
	/// <param name="kernel">The unexpected token's kernel</param>
	/// <returns>The next token kernel in the case the error is recovered</returns>
	private OnUnexpectedToken(kernel: TokenKernel): TokenKernel {
		const expectedOnHead = this.automaton.GetExpected(this.stack[this.head]!, this.lexer.Terminals)
		// the terminals for shifts are always expected
		const expected = Array.from(expectedOnHead.Shifts)
		// check the terminals for reductions
		for (const terminal of expectedOnHead.Reductions) {
			if (this.CheckIsExpected(terminal)) {
				expected.push(terminal)
			}
		}
		// register the error
		this.allErrors.push(new UnexpectedTokenError(this.lexer.tokens[kernel.Index]!, new ROList<GSymbol>(expected)))
		// TODO: try to recover, or not
		return new TokenKernel(GSymbol.SID_NOTHING, -1)
	}

	/// <summary>
	/// Checks whether the specified terminal is indeed expected for a reduction
	/// </summary>
	/// <param name="terminal">The terminal to check</param>
	/// <returns><code>true</code> if the terminal is really expected</returns>
	/// <remarks>
	/// This check is required because in the case of a base LALR graph,
	/// some terminals expected for reduction in the automaton are coming from other paths.
	/// </remarks>
	private CheckIsExpected(terminal: GSymbol): boolean {
		// copy the stack to use for the simulation
		const myStack = new Array<int>(this.stack.length)
		ArrayCopy(this.stack, 0, myStack, 0, this.head + 1)
		let myHead = this.head
		// get the action for the stack's head
		let action = this.automaton.GetAction(myStack[myHead]!, terminal.ID)
		while (action.Code !== LRActionCode.None) {
			if (action.Code === LRActionCode.Shift) {
				// yep, the terminal was expected
				return true
			}
			if (action.Code === LRActionCode.Reduce) {
				// execute the reduction
				const production = this.automaton.GetProduction(action.Data)
				myHead -= production.ReductionLength
				// this must be a shift
				action = this.automaton.GetAction(myStack[myHead]!, this.symVariables[production.Head]!.ID)
				myHead++
				if (myHead === myStack.length) {
					myStack.length = myStack.length + LRkParser.INIT_STACK_SIZE
				}
				myStack[myHead] = action.Data
				// now, get the new action for the terminal
				action = this.automaton.GetAction(action.Data, terminal.ID)
			}
		}
		// nope, that was a pathological case in a LALR graph
		return false
	}

	/// <summary>
	/// Parses the input and returns the result
	/// </summary>
	/// <returns>A ParseResult object containing the data about the result</returns>
	Parse(): ParseResult {
		let nextKernel = this.lexer.GetNextTokenWithContext(this)
		while (true) {
			const action = this.ParseOnToken(nextKernel)
			if (action === LRActionCode.Shift) {
				nextKernel = this.lexer.GetNextTokenWithContext(this)
				continue
			}
			if (action === LRActionCode.Accept) {
				return new ParseResult(new ROList<ParseError>(this.allErrors), this.lexer.Input, this.builder.GetTree())
			}
			nextKernel = this.OnUnexpectedToken(nextKernel)
			if (nextKernel.TerminalID === GSymbol.SID_NOTHING || this.allErrors.length >= BaseLRParser.MAX_ERROR_COUNT) {
				return new ParseResult(new ROList<ParseError>(this.allErrors), this.lexer.Input)
			}
		}
	}

	/// <summary>
	/// Parses on the specified token kernel
	/// </summary>
	/// <param name="kernel">The token kernel to parse on</param>
	/// <returns>The LR action that was used</returns>
	private ParseOnToken(kernel: TokenKernel): LRActionCode {
		while (true) {
			let action = this.automaton.GetAction(this.stack[this.head]!, kernel.TerminalID)
			if (action.Code === LRActionCode.Shift) {
				this.head++
				if (this.head === this.stack.length) {
					this.stack.length = this.stack.length + LRkParser.INIT_STACK_SIZE
					this.stackIDs.length = this.stackIDs.length + LRkParser.INIT_STACK_SIZE
				}
				this.stack[this.head] = action.Data
				this.stackIDs[this.head] = kernel.TerminalID
				this.builder.StackPushToken(kernel.Index)
				return action.Code
			}
			if (action.Code === LRActionCode.Reduce) {
				const production = this.automaton.GetProduction(action.Data)
				this.head -= production.ReductionLength
				this.Reduce(production)
				action = this.automaton.GetAction(this.stack[this.head]!, this.symVariables[production.Head]!.ID)
				this.head++
				if (this.head === this.stack.length) {
					this.stack.length = this.stack.length + LRkParser.INIT_STACK_SIZE
					this.stackIDs.length = this.stackIDs.length + LRkParser.INIT_STACK_SIZE
				}
				this.stack[this.head] = action.Data
				this.stackIDs[this.head] = this.symVariables[production.Head]!.ID
				continue
			}
			return action.Code
		}
	}

	/// <summary>
	/// Executes the given LR reduction
	/// </summary>
	/// <param name="production">A LR reduction</param>
	private Reduce(production: LRProduction): void {
		const variable = this.symVariables[production.Head]!
		this.builder.ReductionPrepare(production.Head, production.ReductionLength, production.HeadAction)
		for (let i = 0; i < production.BytecodeLength; ++i) {
			const op = production[i]!
			switch (op.Base) {
				case LROpCodeBase.SemanticAction: {
					const action = this.symActions[production[i + 1]!.DataValue]!
					i++
					action(variable, this.builder)
					break
				}
				case LROpCodeBase.AddVirtual: {
					const index = production[i + 1]!.DataValue
					this.builder.ReductionAddVirtual(index, op.TreeAction)
					i++
					break
				}
				default: {
					this.builder.ReductionPop(op.TreeAction)
					break
				}
			}
		}
		this.builder.Reduce()
	}
}

