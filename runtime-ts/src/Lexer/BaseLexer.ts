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
import { ParseError } from "../ParseError"
import { Text } from "../Text"
import { Token } from "../Token"
import { TokenRepository } from "../TokenRepository"
import { UnexpectedCharError } from "../UnexpectedCharError"
import { ROList } from "../Utils/ROList"
import { Automaton } from "./Automaton"
import { BaseText } from "./BaseText"
import { FuzzyMatcher } from "./FuzzyMatcher"
import { IContextProvider } from "./IContextProvider"
import { PrefetchedText } from "./PrefetchedText"
import { TokenKernel } from "./TokenKernel"
import { TokenMatch } from "./TokenMatch"


/// <summary>
/// Handler for lexical errors
/// </summary>
/// <param name="error">The new error</param>
export interface AddLexicalError {
	(error: ParseError): void
}

class DefaultContextProvider implements IContextProvider {
	GetContextPriority(context: int, _: int): int {
		return context == Automaton.DEFAULT_CONTEXT ? Number.MAX_SAFE_INTEGER : 0
	}
}

/// <summary>
/// Represents a base lexer
/// </summary>
export abstract class BaseLexer {
	/// <summary>
	/// The default maximum Levenshtein distance to go to for the recovery of a matching failure
	/// </summary>
	protected static readonly DEFAULT_RECOVERY_MATCHING_DISTANCE: int = 3

	/// <summary>
	/// The default context provider
	/// </summary>
	private static readonly DEFAULT_CONTEXT_PROVIDER = new DefaultContextProvider()

	/// <summary>
	/// This lexer's automaton
	/// </summary>
	protected readonly automaton: Automaton
	/// <summary>
	/// The terminals matched by this lexer
	/// </summary>
	protected readonly symTerminals: ROList<GSymbol>
	/// <summary>
	/// Symbol ID of the SEPARATOR terminal
	/// </summary>
	protected readonly separatorID: int
	/// <summary>
	/// The input text
	/// </summary>
	readonly text: BaseText
	/// <summary>
	/// The token repository
	/// </summary>
	readonly tokens: TokenRepository

	/// <summary>
	/// Gets the terminals matched by this lexer
	/// </summary>
	get Terminals(): ROList<GSymbol> { return this.symTerminals }

	/// <summary>
	/// Gets the lexer's input text
	/// </summary>
	get Input(): Text { return this.text }

	/// <summary>
	/// Gets the lexer's output stream of tokens
	/// </summary>
	get Output(): Iterable<Token> { return this.tokens }

	/// <summary>
	/// Gets or sets the maximum Levenshtein distance to go to for the recovery of a matching failure.
	/// A distance of 0 indicates no recovery.
	/// </summary>
	RecoveryDistance: int

	/// <summary>
	/// Events for lexical errors
	/// </summary>
	// AddLexicalError
	OnError(error: ParseError): void { throw error }

	/// <summary>
	/// Initializes a new instance of the Lexer class with the given input
	/// </summary>
	/// <param name="automaton">DFA automaton for this lexer</param>
	/// <param name="terminals">Terminals recognized by this lexer</param>
	/// <param name="separator">SID of the separator token</param>
	/// <param name="input">Input to this lexer</param>
	protected constructor(automaton: Automaton, terminals: GSymbol[], separator: int, input: string) {
		this.automaton = automaton
		this.symTerminals = new ROList<GSymbol>(Array.from(terminals))
		this.separatorID = separator
		this.text = new PrefetchedText(input)
		this.tokens = new TokenRepository(this.symTerminals, this.text)
		this.RecoveryDistance = BaseLexer.DEFAULT_RECOVERY_MATCHING_DISTANCE
	}

	/// <summary>
	/// Initializes a new instance of the Lexer class with the given input
	/// </summary>
	/// <param name="automaton">DFA automaton for this lexer</param>
	/// <param name="terminals">Terminals recognized by this lexer</param>
	/// <param name="separator">SID of the separator token</param>
	/// <param name="input">Input to this lexer</param>
	// protected BaseLexer(Automaton automaton, Symbol[] terminals, int separator, TextReader input) {
	// 	this.automaton = automaton
	// 	symTerminals = new ROList<Symbol>(new List<Symbol>(terminals))
	// 	separatorID = separator
	// 	text = new StreamingText(input)
	// 	tokens = new TokenRepository(symTerminals, text)
	// 	RecoveryDistance = DEFAULT_RECOVERY_MATCHING_DISTANCE
	// }

	/// <summary>
	/// Gets the next token in the input
	/// </summary>
	/// <returns>The next token in the input</returns>
	GetNextToken(): Token {
		return this.tokens[this.GetNextTokenWithContext(BaseLexer.DEFAULT_CONTEXT_PROVIDER).Index]!
	}

	/// <summary>
	/// Runs the lexer's DFA to match a terminal in the input ahead
	/// </summary>
	/// <param name="index">The current start index in the input text</param>
	/// <returns>The matching DFA state and length</returns>
	RunDFA(index: int): TokenMatch {
		if (this.text.IsEnd(index)) {
			// At the end of input
			// The only terminal matched at state index 0 is $
			return new TokenMatch(0, 0)
		}

		let result = TokenMatch.FailingMatch(0)
		let state = 0
		let i = index

		while (state != Automaton.DEAD_STATE) {
			const stateData = this.automaton.GetState(state)
			// Is this state a matching state ?
			if (stateData.TerminalsCount != 0) { result = new TokenMatch(state, i - index) }

			// No further transition => exit
			if (stateData.IsDeadEnd) { break }

			// At the end of the buffer
			if (this.text.IsEnd(i)) { break }

			const current = this.text.GetChar(i)
			i++
			// Try to find a transition from this state with the read character
			state = stateData.GetTargetBy(current)
		}
		return result
	}

	/// <summary>
	/// When an error was encountered, runs the lexer's DFA to match a terminal in the input ahead
	/// </summary>
	/// <param name="originIndex">The current start index in the input text</param>
	/// <returns>The matching DFA state and length</returns>
	RunDFAOnError(originIndex: int): TokenMatch {
		if (this.RecoveryDistance <= 0) {
			this.OnError(new UnexpectedCharError(this.text.GetChar(originIndex).toString(), this.text.GetPositionAt(originIndex)))
			return TokenMatch.FailingMatch(1)
		}
		else {
			let index = -1
			// index of the separator terminal, if any
			for (let i = 0; i < this.symTerminals.Count; ++i) {
				if (this.symTerminals[i]!.ID == this.separatorID) {
					index = i
					break
				}
			}
			const handler = new FuzzyMatcher(this.automaton, index, this.text, this.OnError, this.RecoveryDistance, originIndex)
			return handler.Run()
		}
	}

	/// <summary>
	/// Gets the next token in the input
	/// </summary>
	/// <param name="contexts">The current applicable contexts</param>
	/// <returns>The next token in the input</returns>
	abstract GetNextTokenWithContext(contexts: IContextProvider): TokenKernel
}

