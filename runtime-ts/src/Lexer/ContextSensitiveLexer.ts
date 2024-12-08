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

namespace Hime.Redist.Lexer {
	/// <summary>
	/// Represents a context-free lexer (lexing rules do not depend on the context)
	/// </summary>
	export class ContextSensitiveLexer extends BaseLexer {
		/// <summary>
		/// The current index in the input
		/// </summary>
		private inputIndex: int
		/// <summary>
		/// Whether the end-of-input dollar marker has already been emitted
		/// </summary>
		private isDollarEmitted: boolean

		/// <summary>
		/// Initializes a new instance of the Lexer class with the given input
		/// </summary>
		/// <param name="automaton">DFA automaton for this lexer</param>
		/// <param name="terminals">Terminals recognized by this lexer</param>
		/// <param name="separator">SID of the separator token</param>
		/// <param name="input">Input to this lexer</param>
		protected constructor(automaton: Automaton, terminals: GSymbol[], separator: int, input: string) {
			super(automaton, terminals, separator, input)
			this.isDollarEmitted = false
			this.inputIndex = 0
		}

		/// <summary>
		/// Initializes a new instance of the Lexer class with the given input
		/// </summary>
		/// <param name="automaton">DFA automaton for this lexer</param>
		/// <param name="terminals">Terminals recognized by this lexer</param>
		/// <param name="separator">SID of the separator token</param>
		/// <param name="input">Input to this lexer</param>
		// protected ContextSensitiveLexer(Automaton automaton, Symbol[] terminals, int separator, TextReader input)
		// 	: base(automaton, terminals, separator, input)
		// {
		// 	inputIndex = 0;
		// }

		/// <summary>
		/// Gets the next token in the input
		/// </summary>
		/// <param name="contexts">The current applicable contexts</param>
		/// <returns>The next token in the input</returns>
		GetNextTokenWithContext(contexts: IContextProvider): TokenKernel {
			if (this.isDollarEmitted) {
				return new TokenKernel(GSymbol.SID_EPSILON, -1)
			}

			while (true) {
				let match = this.RunDFA(this.inputIndex)
				if (!match.IsSuccess) {
					// failed to match, retry with error handling
					match = this.RunDFAOnError(this.inputIndex)
				}
				if (match.IsSuccess) {
					if (match.state === 0) {
						// this is the dollar terminal, at the end of the input
						// the index of the $ symbol is always 1
						this.isDollarEmitted = true;
						return new TokenKernel(GSymbol.SID_DOLLAR, this.tokens.Add(1, this.inputIndex, 0))
					}
					else {
						// matched something
						const tIndex = this.GetTerminalFor(match.state, contexts)
						const tID = this.symTerminals[tIndex]!.ID
						if (tID === this.separatorID) {
							this.inputIndex += match.length
							continue
						}
						else {
							const token = new TokenKernel(tID, this.tokens.Add(tIndex, this.inputIndex, match.length))
							this.inputIndex += match.length
							return token
						}
					}
				}
				else {
					this.inputIndex += match.length
				}
			}
		}

		/// <summary>
		/// Gets the index of the terminal with the highest priority that is possible in the contexts
		/// </summary>
		/// <param name="state">The DFA state</param>
		/// <param name="provider">The current applicable contexts</param>
		/// <returns>The index of the terminal</returns>
		private GetTerminalFor(state: int, provider: IContextProvider): int {
			const stateData = this.automaton.GetState(state)
			let mt = stateData.GetTerminal(0)
			let id = this.symTerminals[mt.Index]!.ID
			let currentResult = mt.Index
			if (id === this.separatorID) {
				// the separator trumps all
				return currentResult
			}
			let currentPriority = provider.GetContextPriority(mt.Context, id)
			for (let i = 1; i < stateData.TerminalsCount; ++i) {
				mt = stateData.GetTerminal(i)
				id = this.symTerminals[mt.Index]!.ID
				if (id === this.separatorID) {
					// the separator trumps all
					return mt.Index
				}
				const priority = provider.GetContextPriority(mt.Context, id)
				if (currentPriority < 0 || (priority >= 0 && priority < currentPriority)) {
					currentResult = mt.Index
					currentPriority = priority
				}
			}
			return currentResult
		}
	}
}