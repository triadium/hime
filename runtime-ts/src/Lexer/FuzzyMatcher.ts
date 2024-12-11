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
import { ArgumentException } from "../ArgumentException"
import { char, int } from "../BaseTypes"
import { IncorrectEncodingSequence } from "../IncorrectEncodingSequence"
import { ParseError } from "../ParseError"
import { ParseErrorType } from "../ParseErrorType"
import { UnexpectedCharError } from "../UnexpectedCharError"
import { UnexpectedEndOfInput } from "../UnexpectedEndOfInput"
import { ArrayCopy } from "../Utils"
import { Automaton } from "./Automaton"
import { AutomatonState } from "./AutomatonState"
import { AddLexicalError } from "./BaseLexer"
import { BaseText } from "./BaseText"
import { TokenMatch } from "./TokenMatch"


/// <summary>
/// A fuzzy DFA matcher
/// This matcher uses the Levenshtein distance to match the input ahead against the current DFA automaton.
/// The matcher favors solutions that are the closest to the original input.
/// When multiple solutions are at the same Levenshtein distance to the input, the longest one is preferred.
/// </summary>
export class FuzzyMatcher {
	/// <summary>
	/// This lexer's automaton
	/// </summary>
	private readonly automaton: Automaton
	/// <summary>
	/// Terminal index of the SEPARATOR terminal
	/// </summary>
	private readonly separator: int
	/// <summary>
	/// The input text
	/// </summary>
	private readonly text: BaseText
	/// <summary>
	/// Delegate for raising errors
	/// </summary>
	private readonly errors: AddLexicalError = (error: ParseError): void => { throw error }
	/// <summary>
	/// The maximum Levenshtein distance between the input and the DFA
	/// </summary>
	private readonly maxDistance: int
	/// <summary>
	/// The index in the input from wich the error was raised
	/// </summary>
	private readonly originIndex: int
	/// <summary>
	/// The current heads
	/// </summary>
	private heads!: FuzzyMatcherNested.Head[]
	/// <summary>
	/// Buffer of DFA states for the computation of character insertions
	/// </summary>
	private insertions!: int[]
	/// <summary>
	/// The current number of insertions in the buffer
	/// </summary>
	private insertionsCount!: int
	/// <summary>
	/// The current matching head, if any
	/// </summary>
	private matchHead!: FuzzyMatcherNested.Head
	/// <summary>
	/// The current matching length
	/// </summary>
	private matchLength!: int

	/// <summary>
	/// Initializes this matcher
	/// </summary>
	/// <param name="automaton">This lexer's automaton</param>
	/// <param name="separator">Terminal index of the SEPARATOR terminal</param>
	/// <param name="text">The input text</param>
	/// <param name="errors">Delegate for raising errors</param>
	/// <param name="maxDistance">The maximum Levenshtein distance between the input and the DFA</param>
	/// <param name="index">The index in the input from wich the error was raised</param>
	constructor(automaton: Automaton, separator: int, text: BaseText, errors: AddLexicalError, maxDistance: int, index: int) {
		this.automaton = automaton
		this.separator = separator
		this.text = text
		this.errors = errors
		this.maxDistance = maxDistance
		this.originIndex = index
	}

	/// <summary>
	/// Runs this matcher
	/// </summary>
	/// <returns>The solution</returns>
	Run(): TokenMatch {
		this.heads = new Array<FuzzyMatcherNested.Head>()
		this.insertions = new Array(16)
		this.insertionsCount = 0
		this.matchHead = FuzzyMatcherNested.Head.FromZeroDistance(0)
		this.matchLength = 0
		let offset = 0
		let atEnd = this.text.IsEnd(this.originIndex + offset)
		let current = atEnd ? '\0'.charCodeAt(0) : this.text.GetChar(this.originIndex + offset)
		if (atEnd) {
			this.InspectAtEnd(this.matchHead, offset)
		}
		else {
			this.Inspect(this.matchHead, offset, current)
		}
		while (this.heads.length !== 0) {
			offset++
			atEnd = this.text.IsEnd(this.originIndex + offset)
			current = atEnd ? '\0'.charCodeAt(0) : this.text.GetChar(this.originIndex + offset)
			const temp = [...this.heads]
			this.heads.length = 0
			for (const head of temp) {
				if (atEnd) {
					this.InspectAtEnd(head, offset)
				}
				else {
					this.Inspect(head, offset, current)
				}
			}
		}
		return this.matchLength === 0 ? this.OnFailure() : this.OnSuccess()
	}

	/// <summary>
	/// Constructs the solution when succeeded to fix the error
	/// </summary>
	/// <returns>The constructed solution</returns>
	private OnSuccess(): TokenMatch {
		let lastErrorIndex = -1
		for (let i = 0; i < this.matchHead.Distance; ++i) {
			const errorIndex = this.originIndex + this.matchHead.GetError(i)
			if (errorIndex != lastErrorIndex) {
				this.OnError(errorIndex)
			}
			lastErrorIndex = errorIndex
		}
		return new TokenMatch(this.matchHead.State, this.matchLength)
	}

	/// <summary>
	/// Reports on the lexical error at the specified index
	/// </summary>
	/// <param name="index">The index in the input where the error occurs</param>
	private OnError(index: int): void {
		let errorType = ParseErrorType.UnexpectedChar
		const atEnd = this.text.IsEnd(index)
		let value = ""
		if (atEnd) {
			// the end of input was not expected
			// there is necessarily some input before because an empty input would have matched the $
			const c = this.text.GetChar(index - 1)
			if (c >= 0xD800 && c <= 0xDBFF) {
				// a trailing UTF-16 high surrogate
				index--
				errorType = ParseErrorType.IncorrectUTF16NoLowSurrogate
			}
			else {
				errorType = ParseErrorType.UnexpectedEndOfInput
			}
		}
		else {
			const c = this.text.GetChar(index)
			if (c >= 0xD800 && c <= 0xDBFF && !this.text.IsEnd(index + 1)) {
				// a UTF-16 high surrogate
				// if next next character is a low surrogate, also get it
				const c2 = this.text.GetChar(index + 1)
				if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
					value = String.fromCharCode(c, c2)
				}
				else {
					errorType = ParseErrorType.IncorrectUTF16NoLowSurrogate
				}
			}
			else if (c >= 0xDC00 && c <= 0xDFFF && index > 0) {
				// a UTF-16 low surrogate
				// if the previous character is a high surrogate, also get it
				const c2 = this.text.GetChar(index - 1)
				if (c2 >= 0xD800 && c2 <= 0xDBFF) {
					index--
					value = String.fromCharCode(c2, c)
				}
				else {
					errorType = ParseErrorType.IncorrectUTF16NoHighSurrogate
				}
			}
			if (value.length === 0) {
				value = String.fromCharCode(c)
			}
		}
		switch (errorType) {
			case ParseErrorType.UnexpectedEndOfInput:
				this.errors(new UnexpectedEndOfInput(this.text.GetPositionAt(index)))
				break
			case ParseErrorType.UnexpectedChar:
				this.errors(new UnexpectedCharError(value, this.text.GetPositionAt(index)))
				break
			case ParseErrorType.IncorrectUTF16NoHighSurrogate:
			case ParseErrorType.IncorrectUTF16NoLowSurrogate:
				this.errors(new IncorrectEncodingSequence(this.text.GetPositionAt(index), this.text.GetChar(index), errorType))
				break
			default:
				break
		}
	}

	/// <summary>
	/// Constructs the solution when failed to fix the error
	/// </summary>
	private OnFailure(): TokenMatch {
		this.errors(new UnexpectedCharError(String.fromCharCode(this.text.GetChar(this.originIndex)), this.text.GetPositionAt(this.originIndex)))
		return TokenMatch.FailingMatch(1)
	}

	/// <summary>
	/// Pushes a new head onto the the queue
	/// </summary>
	/// <param name="previous">The previous head</param>
	/// <param name="state">The associated DFA state</param>
	private PushHead(previous: FuzzyMatcherNested.Head, state: int): void {
		this.PushHeadWithDistance(previous, state, -1, previous.Distance)
	}

	/// <summary>
	/// Pushes a new head onto the the queue
	/// </summary>
	/// <param name="previous">The previous head</param>
	/// <param name="state">The associated DFA state</param>
	/// <param name="offset">The offset of the error from the original index</param>
	private PushHeadWithOffset(previous: FuzzyMatcherNested.Head, state: int, offset: int): void {
		this.PushHeadWithDistance(previous, state, offset, previous.Distance + 1)
	}

	/// <summary>
	/// Pushes a new head onto the the queue
	/// </summary>
	/// <param name="previous">The previous head</param>
	/// <param name="state">The associated DFA state</param>
	/// <param name="offset">The offset of the error from the original index</param>
	/// <param name="distance">The distance to reach</param>
	private PushHeadWithDistance(previous: FuzzyMatcherNested.Head, state: int, offset: int, distance: int): void {
		for (let i = this.heads.length - 1; i > -1; --i) {
			if (this.heads[i]!.State == state && this.heads[i]!.Distance <= distance) {
				return
			}
		}
		if (offset == -1) {
			this.heads.push(FuzzyMatcherNested.Head.FromPrevious(previous, state))
		}
		else {
			this.heads.push(FuzzyMatcherNested.Head.FromPreviousWithOffset(previous, state, offset, distance))
		}
	}

	/// <summary>
	/// Inspects a head while at the end of the input
	/// </summary>
	/// <param name="head">The head to inspect</param>
	/// <param name="offset">The current offset from the original index</param>
	private InspectAtEnd(head: FuzzyMatcherNested.Head, offset: int): void {
		const stateData = this.automaton.GetState(head.State)
		// is it a matching state
		if (stateData.TerminalsCount !== 0 && stateData.GetTerminal(0).Index !== this.separator) {
			this.OnMatchingHead(head, offset)
		}
		if (head.Distance >= this.maxDistance || stateData.IsDeadEnd) {
			// cannot stray further
			return
		}
		// lookup the transitions
		this.ExploreTransitions(head, stateData, offset, true)
		this.ExploreInsertions(head, offset, true, '\0'.charCodeAt(0))
	}

	/// <summary>
	/// Inspects a head with a specified character ahead
	/// </summary>
	/// <param name="head">The head to inspect</param>
	/// <param name="offset">The current offset from the original index</param>
	/// <param name="current">The leading character in the input</param>
	private Inspect(head: FuzzyMatcherNested.Head, offset: int, current: char): void {
		const stateData = this.automaton.GetState(head.State)
		// is it a matching state
		if (stateData.TerminalsCount !== 0 && stateData.GetTerminal(0).Index !== this.separator) {
			this.OnMatchingHead(head, offset)
		}
		if (head.Distance >= this.maxDistance || stateData.IsDeadEnd) {
			// cannot stray further
			return
		}
		// could be a straight match
		const target = stateData.GetTargetBy(current)
		if (target !== Automaton.DEAD_STATE) {
			// it is!
			this.PushHead(head, target)
		}
		// could try a drop
		this.PushHeadWithOffset(head, head.State, offset)
		// lookup the transitions
		this.ExploreTransitions(head, stateData, offset, false)
		this.ExploreInsertions(head, offset, false, current)
	}

	/// <summary>
	/// Explores a state transition
	/// </summary>
	/// <param name="head">The current head</param>
	/// <param name="stateData">The data of the DFA state</param>
	/// <param name="offset">The current offset from the original index</param>
	/// <param name="atEnd">Whether the current index is at the end of the input</param>
	private ExploreTransitions(head: FuzzyMatcherNested.Head, stateData: AutomatonState, offset: int, atEnd: boolean): void {
		for (let i = 0; i < 256; ++i) {
			const target = stateData.GetCachedTransition(i)
			if (target === Automaton.DEAD_STATE) {
				continue
			}
			this.ExploreTransitionToTarget(head, target, offset, atEnd)
		}
		for (let i = 0; i < stateData.BulkTransitionsCount; ++i) {
			this.ExploreTransitionToTarget(head, stateData.GetBulkTransition(i).Target, offset, atEnd)
		}
	}

	/// <summary>
	/// Explores a state transition
	/// </summary>
	/// <param name="head">The current head</param>
	/// <param name="target">The target DFA state</param>
	/// <param name="offset">The current offset from the original index</param>
	/// <param name="atEnd">Whether the current index is at the end of the input</param>
	private ExploreTransitionToTarget(head: FuzzyMatcherNested.Head, target: int, offset: int, atEnd: boolean): void {
		if (!atEnd) {
			// try replace
			this.PushHeadWithOffset(head, target, offset)
		}
		// try to insert
		let found = false
		for (let i = this.insertionsCount - 1; i > -1; --i) {
			if (this.insertions[i] === target) {
				found = true
				break
			}
		}
		if (!found) {
			// if (this.insertionsCount == this.insertions.length) {
			// 	Array.Resize(ref insertions, insertions.Length * 2)
			// }
			this.insertions[this.insertionsCount++] = target
		}
	}

	/// <summary>
	/// Explores the current insertions
	/// </summary>
	/// <param name="head">The head to inspect</param>
	/// <param name="offset">The current offset from the original index</param>
	/// <param name="atEnd">Whether the current index is at the end of the input</param>
	/// <param name="current">The leading character in the input</param>
	private ExploreInsertions(head: FuzzyMatcherNested.Head, offset: int, atEnd: boolean, current: char): void {
		// setup the first round
		let distance = head.Distance + 1
		let end = this.insertionsCount
		let start = 0
		// while there are insertions to examine in a round
		while (start != this.insertionsCount) {
			for (let i = start; i < end; ++i) {
				// examine insertion i
				this.ExploreInsertionWithDistance(head, offset, atEnd, current, this.insertions[i]!, distance)
			}
			// prepare next round
			distance++
			start = end
			end = this.insertionsCount
		}
		// reset the insertions data
		this.insertionsCount = 0
	}

	/// <summary>
	/// Explores an insertion
	/// </summary>
	/// <param name="head">The head to inspect</param>
	/// <param name="offset">The current offset from the original index</param>
	/// <param name="atEnd">Whether the current index is at the end of the input</param>
	/// <param name="current">The leading character in the input</param>
	/// <param name="state">The DFA state for the insertion</param>
	/// <param name="distance">The distance associated to this insertion</param>
	private ExploreInsertionWithDistance(head: FuzzyMatcherNested.Head, offset: int, atEnd: boolean, current: char, state: int, distance: int): void {
		const stateData = this.automaton.GetState(state)
		if (stateData.TerminalsCount !== 0 && stateData.GetTerminal(0).Index !== this.separator) {
			this.OnMatchingInsertion(head, offset, state, distance)
		}
		if (!atEnd) {
			const target = stateData.GetTargetBy(current)
			if (target !== Automaton.DEAD_STATE) {
				this.PushHeadWithDistance(head, target, offset, distance)
			}
		}
		if (distance >= this.maxDistance) {
			return
		}
		// continue insertion
		this.ExploreTransitions(head, stateData, offset, true)
	}

	/// <summary>
	/// When a matching head is encountered
	/// </summary>
	/// <param name="head">The matching head</param>
	/// <param name="offset">The current offset from the original index</param>
	private OnMatchingHead(head: FuzzyMatcherNested.Head, offset: int): void {
		const clCurrent = FuzzyMatcher.GetComparableLength(this.matchHead, this.matchLength)
		const clCandidate = FuzzyMatcher.GetComparableLength(head, offset)
		if (this.matchLength == 0 || clCandidate > clCurrent) {
			this.matchHead = head
			this.matchLength = offset
		}
	}

	/// <summary>
	/// When a matching insertion is encountered
	/// </summary>
	/// <param name="previous">The previous head</param>
	/// <param name="offset">The current offset from the original index</param>
	/// <param name="target">The DFA state for the insertion</param>
	/// <param name="distance">The distance associated to this insertion</param>
	private OnMatchingInsertion(previous: FuzzyMatcherNested.Head, offset: int, target: int, distance: int): void {
		const d = distance - previous.Distance
		const clCurrent = FuzzyMatcher.GetComparableLength(this.matchHead, this.matchLength)
		const clCandidate = FuzzyMatcher.GetComparableLength(previous, offset - d)
		if (this.matchLength === 0 || clCandidate > clCurrent) {
			this.matchHead = FuzzyMatcherNested.Head.FromPreviousWithOffset(previous, target, offset, distance)
			this.matchLength = offset
		}
	}

	/// <summary>
	/// Computes the comparable length of the specified match
	/// </summary>
	/// <param name="head">The matching head</param>
	/// <param name="length">The matching length in the input</param>
	/// <returns>The comparable length</returns>
	private static GetComparableLength(head: FuzzyMatcherNested.Head, length: int): int {
		return length - head.Distance
	}
}

namespace FuzzyMatcherNested {
	/// <summary>
	/// Represents a DFA stack head
	/// </summary>
	export class Head {
		/// <summary>
		/// The data representing this head
		/// </summary>
		private readonly data: int[]

		/// <summary>
		/// Gets the associated DFA state
		/// </summary>
		get State(): int { return this.data[0]! }

		/// <summary>
		/// Gets the Levenshtein distance of this head form the input
		/// </summary>
		get Distance(): int { return this.data.length - 1 }

		private constructor(data: int[], state: int) {
			this.data = data
			this.data[0] = state
		}

		/// <summary>
		/// Initializes this head with a state and a 0 distance
		/// </summary>
		/// <param name="state">The associated DFA state</param>
		static FromZeroDistance(state: int) {
			return new Head(new Array(1), state)
		}

		/// <summary>
		/// Initializes this head from a previous one
		/// </summary>
		/// <param name="previous">The previous head</param>
		/// <param name="state">The associated DFA state</param>
		static FromPrevious(previous: Head, state: int) {
			return new Head([...previous.data], state)
		}

		/// <summary>
		/// Initializes this head from a previous one
		/// </summary>
		/// <param name="previous">The previous head</param>
		/// <param name="state">The associated DFA state</param>
		/// <param name="offset">The offset of the error from the original index</param>
		/// <param name="distance">The distance to reach</param>
		static FromPreviousWithOffset(previous: Head, state: int, offset: int, distance: int) {
			if (distance < previous.Distance + 1) {
				throw new ArgumentException("The distance for the new head must be at least one more than the distance of the previous head", "distance")
			}

			const data = new Array(distance + 1)
			data[data.length - 1] = offset
			ArrayCopy(previous.data, 1, data, 1, previous.data.length - 1)
			for (let i = previous.data.length; i < data.length; ++i) {
				data[i] = offset
			}
			return new Head(data, state)
		}

		/// <summary>
		/// Gets the offset in the input of the i-th lexical error on this head
		/// </summary>
		/// <param name="i">Index of the error</param>
		/// <returns>The offset of the i-th error in the input</returns>
		GetError(i: int): int {
			return this.data[i + 1]!
		}
	}
}
