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
import { int } from "../BaseTypes"
import { GSymbol } from "../GSymbol"
import { Automaton } from "./Automaton"
import { BaseLexer } from "./BaseLexer"
import { IContextProvider } from "./IContextProvider"
import { TokenKernel } from "./TokenKernel"


/// <summary>
/// Represents a context-free lexer (lexing rules do not depend on the context)
/// </summary>
export class ContextFreeLexer extends BaseLexer {
	/// <summary>
	/// Index of the next token
	/// </summary>
	private tokenIndex: int

	/// <summary>
	/// Initializes a new instance of the Lexer class with the given input
	/// </summary>
	/// <param name="automaton">DFA automaton for this lexer</param>
	/// <param name="terminals">Terminals recognized by this lexer</param>
	/// <param name="separator">SID of the separator token</param>
	/// <param name="input">Input to this lexer</param>
	protected constructor(automaton: Automaton, terminals: GSymbol[], separator: int, input: string) {
		super(automaton, terminals, separator, input)
		this.tokenIndex = -1
	}

	/// <summary>
	/// Initializes a new instance of the Lexer class with the given input
	/// </summary>
	/// <param name="automaton">DFA automaton for this lexer</param>
	/// <param name="terminals">Terminals recognized by this lexer</param>
	/// <param name="separator">SID of the separator token</param>
	/// <param name="input">Input to this lexer</param>
	// protected ContextFreeLexer(Automaton automaton, Symbol[] terminals, int separator, TextReader input)
	// 	: base(automaton, terminals, separator, input)
	// {
	// 	tokenIndex = -1;
	// }

	/// <summary>
	/// Gets the next token in the input
	/// </summary>
	/// <param name="contexts">The current applicable contexts</param>
	/// <returns>The next token in the input</returns>
	GetNextTokenWithContext(_: IContextProvider): TokenKernel {
		if (this.tokens.Size === 0) {
			// this is the first call to this method, prefetch the tokens
			this.FindTokens()
			this.tokenIndex = 0
		}
		// no more tokens? return epsilon
		if (this.tokenIndex >= this.tokens.Size) {
			return new TokenKernel(GSymbol.SID_EPSILON, 0)
		}
		const result = new TokenKernel(this.tokens.GetSymbol(this.tokenIndex).ID, this.tokenIndex)
		this.tokenIndex++
		return result
	}

	/// <summary>
	/// Finds all the tokens in the lexer's input
	/// </summary>
	private FindTokens(): void {
		let inputIndex = 0
		while (true) {
			let match = this.RunDFA(inputIndex)
			if (!match.IsSuccess) {
				// failed to match, retry with error handling
				match = this.RunDFAOnError(inputIndex)
			}
			if (match.IsSuccess) {
				if (match.state === 0) {
					// this is the dollar terminal, at the end of the input
					// the index of the $ symbol is always 1
					this.tokens.Add(1, inputIndex, 0)
					return
				}
				else {
					// matched something
					const tIndex = this.automaton.GetState(match.state).GetTerminal(0).Index
					if (this.symTerminals[tIndex]!.ID !== this.separatorID) {
						this.tokens.Add(tIndex, inputIndex, match.length)
					}
					inputIndex += match.length
				}
			}
			else {
				inputIndex += match.length;
			}
		}
	}
}
