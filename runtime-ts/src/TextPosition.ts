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

namespace Hime.Redist {
	/// <summary>
	/// Represents a position in term of line and column in a text input
	/// </summary>
	export class TextPosition {
		/// <summary>
		/// The line number
		/// </summary>
		private readonly line: int
		/// <summary>
		/// The column number
		/// </summary>
		private readonly column: int

		/// <summary>
		/// Gets the line number
		/// </summary>
		get Line(): int { return this.line }

		/// <summary>
		/// Gets the column number
		/// </summary>
		get Column(): int { return this.column }

		/// <summary>
		/// Initializes this position with the given line and column numbers
		/// </summary>
		/// <param name="line">The line number</param>
		/// <param name="column">The column number</param>
		constructor(line: number, column: number) {
			this.line = Int.from(line)
			this.column = Int.from(column)
		}

		/// <summary>
		/// Gets a string representation of this position
		/// </summary>
		/// <returns></returns>
		toString(): string {
			return `(${this.line}, ${this.column})`
		}
	}
}
