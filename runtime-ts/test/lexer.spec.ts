import { readFile } from 'fs/promises'
import {
  Automaton,
  BinaryReader,
  ContextFreeLexer,
  GSymbol,
  IContextProvider,
  int,
  UnexpectedCharError
} from '../src'


class DefaultContextProvider implements IContextProvider {
  GetContextPriority(context: int, _: int): int {
    return context == Automaton.DEFAULT_CONTEXT ? Number.MAX_SAFE_INTEGER : 0
  }
}

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
    const buffer = await readFile('./test/data/MathExpLexer.glalr.bin')
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

describe('Free context lexer', () => {
  test('Correct sequence', async () => {
    const lexer = await FCTestLexer.fromString('(1+1)')
    expect(lexer.collectTerminals(new DefaultContextProvider())).toEqual([0x0010, 0x0007, 0x0016, 0x0007, 0x0011, GSymbol.SID_DOLLAR])
  })

  test('Unexpected char error', async () => {
    const lexer = await FCTestLexer.fromString('(1🐛1)')
    expect(() => lexer.collectTerminals(new DefaultContextProvider())).toThrow(UnexpectedCharError)
  })
})
