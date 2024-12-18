import { readFile } from 'fs/promises'
import { Automaton, BaseLexer, ContextFreeLexer, IContextProvider } from '../src/Lexer'
import { BinaryReader, GSymbol, int, SemanticAction } from '../src'
// import { UnexpectedCharError } from '../src'
import { RNGLRAutomaton, RNGLRParser } from '../src/Parsers'
import { SemanticBody } from '../src/SemanticBody'
import { ASTNode } from '../src/ASTNode'
import { ParseResult } from '../src/ParseResult'
import { ArrayCopy } from '../src/Utils'

// class DefaultContextProvider implements IContextProvider {
//   GetContextPriority(context: int, _: int): int {
//     return context == Automaton.DEFAULT_CONTEXT ? Number.MAX_SAFE_INTEGER : 0
//   }
// }

export class FCTestLexer extends ContextFreeLexer {

  private static readonly terminals = [
    new GSymbol(0x0001, "ε"),
    new GSymbol(0x0002, "$"),
    new GSymbol(0x0004, "SEPARATOR"),
    new GSymbol(0x0007, "NUMBER"),
    new GSymbol(0x0008, "SYMBOL"),
    new GSymbol(0x0009, "GET"),
    new GSymbol(0x0010, "("),
    new GSymbol(0x0011, ")"),
    new GSymbol(0x0012, "*"),
    new GSymbol(0x0014, "/"),
    new GSymbol(0x0016, "+"),
    new GSymbol(0x0018, "-"),
  ]

  collectTerminals(context: IContextProvider): int[] {
    const terminals: int[] = []
    let terminalID = this.GetNextTokenWithContext(context).TerminalID
    terminals.push(terminalID)
    while (terminalID !== GSymbol.SID_DOLLAR) {
      terminalID = this.GetNextTokenWithContext(context).TerminalID
      terminals.push(terminalID)
    }
    return terminals
  }

  static async fromString(input: string) {
    const buffer = await readFile('./test/data/MathExpLexer.bin')
    const automaton = new Automaton(BinaryReader.Create(buffer))
    return new FCTestLexer(automaton, this.terminals, 0x0004, input)
  }
}

export namespace FCTestLexer {
  export enum ID {
    /// <summary>
    /// The unique identifier for terminal SEPARATOR
    /// </summary>
    TerminalSeparator = 0x0004,
    /// <summary>
    /// The unique identifier for terminal NUMBER
    /// </summary>
    TerminalNumber = 0x0007,
    /// <summary>
    /// The unique identifier for terminal SYMBOL
    /// </summary>
    TerminalSymbol = 0x0008,
    /// <summary>
    /// The unique identifier for terminal GET
    /// </summary>
    TerminalGet = 0x0009,
  }
}

export class RNGLRTestParser extends RNGLRParser {

  /// <summary>
  /// The collection of variables matched by this parser
  /// </summary>
  /// <remarks>
  /// The variables are in an order consistent with the automaton,
  /// so that variable indices in the automaton can be used to retrieve the variables in this table
  /// </remarks>
  static readonly variables: GSymbol[] = [
    new GSymbol(0x000A, "exp_atom"),
    new GSymbol(0x000B, "exp_factor"),
    new GSymbol(0x000C, "exp_term"),
    new GSymbol(0x000D, "exp"),
    new GSymbol(0x000F, "__V15"),
    new GSymbol(0x001A, "__VAxiom")
  ]

  /// <summary>
  /// The collection of virtuals matched by this parser
  /// </summary>
  /// <remarks>
  /// The virtuals are in an order consistent with the automaton,
  /// so that virtual indices in the automaton can be used to retrieve the virtuals in this table
  /// </remarks>
  private static readonly virtuals: GSymbol[] = []
  /// <summary>
  /// Gets the set of semantic actions in the form a table consistent with the automaton
  /// </summary>
  /// <param name="input">A set of semantic actions</param>
  /// <returns>A table of semantic actions</returns>
  private static GetUserActions(input: RNGLRTestParser.Actions): SemanticAction[] {
    const result = new Array<SemanticAction>(5)
    result[0] = input.OnNumber
    result[1] = input.OnMult
    result[2] = input.OnDiv
    result[3] = input.OnPlus
    result[4] = input.OnMinus
    return result;
  }
  /// <summary>
  /// Gets the set of semantic actions in the form a table consistent with the automaton
  /// </summary>
  /// <param name="input">A set of semantic actions</param>
  /// <returns>A table of semantic actions</returns>
  private static GetUserActionsFromMap(input: Record<string, SemanticAction>): SemanticAction[] {
    const result = new Array<SemanticAction>(5)
    result[0] = input["OnNumber"]!
    result[1] = input["OnMult"]!
    result[2] = input["OnDiv"]!
    result[3] = input["OnPlus"]!
    result[4] = input["OnMinus"]!
    return result
  }

  /// <summary>
  /// Walk the AST of a result using a visitor
  /// <param name="result">The parse result</param>
  /// <param name="visitor">The visitor to use</param>
  /// </summary>
  static Visit(result: ParseResult, visitor: RNGLRTestParser.Visitor): void {
    this.VisitASTNode(result.Root, visitor)
  }

  /// <summary>
  /// Walk the sub-AST from the specified node using a visitor
  /// </summary>
  /// <param name="node">The AST node to start from</param>
  /// <param name="visitor">The visitor to use</param>
  static VisitASTNode(node: ASTNode, visitor: RNGLRTestParser.Visitor): void {
    for (let i = 0; i < node.Children.Count; ++i) {
      this.VisitASTNode(node.Children[i]!, visitor)
    }
    switch (node.Symbol.ID) {
      case 0x0004: visitor.OnTerminalSeparator(node); break;
      case 0x0007: visitor.OnTerminalNumber(node); break;
      case 0x0008: visitor.OnTerminalSymbol(node); break;
      case 0x0009: visitor.OnTerminalGet(node); break;
      case 0x000A: visitor.OnVariableExpAtom(node); break;
      case 0x000B: visitor.OnVariableExpFactor(node); break;
      case 0x000C: visitor.OnVariableExpTerm(node); break;
      case 0x000D: visitor.OnVariableExp(node); break;
    }
  }

  constructor(automaton: RNGLRAutomaton, actions: SemanticAction[], lexer: BaseLexer) {
    super(automaton, RNGLRTestParser.variables, RNGLRTestParser.virtuals, actions, lexer)
  }

  static async fromString(input: string) {
    const lexer = await FCTestLexer.fromString(input)
    const buffer = await readFile('./test/data/MathExpParser.bin')
    const automaton = new RNGLRAutomaton(BinaryReader.Create(buffer))
    // Represents a set of empty semantic actions (do nothing)    
    return new RNGLRTestParser(automaton, this.GetUserActions(new RNGLRTestParser.Actions()), lexer)
  }
  static async fromStringWithActions(input: string, actions: RNGLRTestParser.Actions) {
    const lexer = await FCTestLexer.fromString(input)
    const buffer = await readFile('./test/data/MathExpParser.bin')
    const automaton = new RNGLRAutomaton(BinaryReader.Create(buffer))
    // Represents a set of empty semantic actions (do nothing)    
    return new RNGLRTestParser(automaton, this.GetUserActions(actions), lexer)
  }
  static async fromStringWithActionMap(input: string, actions: Record<string, SemanticAction>) {
    const lexer = await FCTestLexer.fromString(input)
    const buffer = await readFile('./test/data/MathExpParser.bin')
    const automaton = new RNGLRAutomaton(BinaryReader.Create(buffer))
    // Represents a set of empty semantic actions (do nothing)    
    return new RNGLRTestParser(automaton, this.GetUserActionsFromMap(actions), lexer)
  }

  static Print(result: ParseResult): void {
    if (result.IsSuccess) {
      const output: string[] = []
      this.PrintNode(result.Root, new Array<boolean>(), output)
      console.log(output.join(''))
    }
    else {
      for (const err of result.Errors) {
        console.log(err)
      }
    }
  }

  private static PrintNode(node: ASTNode, crossings: boolean[], output: string[]): void {
    const line: string[] = []
    for (let i = 0; i < crossings.length - 1; ++i) {
      line.push(crossings[i] ? "|   " : "    ")
    }
    if (crossings.length > 0) {
      line.push("+-> ")
    }
    line.push(node.toString())
    line.push('\n')
    output.push(line.join(''))
    for (let i = 0; i < node.Children.Count; ++i) {
      const childCrossings = new Array<boolean>(crossings.length + 1)
      ArrayCopy(crossings, 0, childCrossings, 0, crossings.length)
      childCrossings[childCrossings.length - 1] = (i < node.Children.Count - 1)
      this.PrintNode(node.Children[i]!, childCrossings, output)
    }
  }
}

export namespace RNGLRTestParser {
  /// <summary>
  /// Contains the constant IDs for the variables and virtuals in this parser
  /// </summary>
  export enum ID {
    /// <summary>
    /// The unique identifier for variable exp_atom
    /// </summary>
    VariableExpAtom = 0x000A,
    /// <summary>
    /// The unique identifier for variable exp_factor
    /// </summary>
    VariableExpFactor = 0x000B,
    /// <summary>
    /// The unique identifier for variable exp_term
    /// </summary>
    VariableExpTerm = 0x000C,
    /// <summary>
    /// The unique identifier for variable exp
    /// </summary>
    VariableExp = 0x000D,
  }

  /// <summary>
  /// Represents a set of semantic actions in this parser
  /// </summary>
  export class Actions {
    /// <summary>
    /// The OnNumber semantic action
    /// </summary>
    OnNumber(_: GSymbol, __: SemanticBody): void { }
    /// <summary>
    /// The OnMult semantic action
    /// </summary>
    OnMult(_: GSymbol, __: SemanticBody): void { }
    /// <summary>
    /// The OnDiv semantic action
    /// </summary>
    OnDiv(_: GSymbol, __: SemanticBody): void { }
    /// <summary>
    /// The OnPlus semantic action
    /// </summary>
    OnPlus(_: GSymbol, __: SemanticBody): void { }
    /// <summary>
    /// The OnMinus semantic action
    /// </summary>
    OnMinus(_: GSymbol, __: SemanticBody): void { }
  }

  /// <summary>
  /// Visitor interface
  /// </summary>

  export class Visitor {
    OnTerminalSeparator(_: ASTNode): void { }
    OnTerminalNumber(_: ASTNode): void { }
    OnTerminalSymbol(_: ASTNode): void { }
    OnTerminalGet(_: ASTNode): void { }
    OnVariableExpAtom(_: ASTNode): void { }
    OnVariableExpFactor(_: ASTNode): void { }
    OnVariableExpTerm(_: ASTNode): void { }
    OnVariableExp(_: ASTNode): void { }
  }
}

describe('RNGLR Parser', () => {
  test('Correct sequence', async () => {
    const parser = await RNGLRTestParser.fromString('4 * (1 + 1) / 2')
    RNGLRTestParser.Print(parser.Parse())
    // expect(lexer.collectTerminals(new DefaultContextProvider())).toEqual([0x0010, 0x0007, 0x0016, 0x0007, 0x0011, GSymbol.SID_DOLLAR])
  })

  // test('Unexpected char error', async () => {
  //   const lexer = await FCTestLexer.fromString('(1🐛1)')
  //   expect(() => lexer.collectTerminals(new DefaultContextProvider())).toThrow(UnexpectedCharError)
  // })
})
