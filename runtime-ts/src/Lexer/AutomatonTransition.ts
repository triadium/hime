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
	/// Represents a transition in the automaton of a lexer
	/// A transition is matched by a range of UTF-16 code points
	/// Its target is a state in the automaton
	/// </summary>
	export class AutomatonTransition {
		/// <summary>
		/// Start of the range
		/// </summary>
		private readonly start: ushort
		/// <summary>
		/// End of the range
		/// </summary>
		private readonly end: ushort
		/// <summary>
		/// The transition's target
		/// </summary>
		private readonly target: int

		/// <summary>
		/// Gets the start of the UTF-16 code point range
		/// </summary>
		get Start(): int { return this.start }

		/// <summary>
		/// Gets the end of the UTF-16 code point range
		/// </summary>
		get End(): int { return this.end }

		/// <summary>
		/// Gets the target if this transition
		/// </summary>
		get Target(): int { return this.target }

		/// <summary>
		/// Initializes this transition
		/// </summary>
		/// <param name="table">The table containing the transition</param>
		/// <param name="offset">The offset of this transition in the table</param>
		constructor(table: ushort[], offset: int) {
			this.start = table[offset]!
			this.end = table[offset + 1]!
			this.target = table[offset + 2]!
		}
	}
}
