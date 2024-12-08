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
	/// Represents a grammar symbol (terminal, variable or virtual)
	/// </summary>
	export class GSymbol {
		/// <summary>
		/// Symbol ID for inexistant symbol
		/// </summary>
		static readonly SID_NOTHING: int = Int.from(0)

		/// <summary>
		/// Symbol ID of the Epsilon terminal
		/// </summary>
		static readonly SID_EPSILON: int = Int.from(1)

		/// <summary>
		/// Symbol ID of the Dollar terminal
		/// </summary>
		static readonly SID_DOLLAR: int = Int.from(2)

		/// <summary>
		/// The symbol's unique identifier
		/// </summary>
		private readonly id: int
		/// <summary>
		/// The symbol's name
		/// </summary>
		private readonly name: string

		/// <summary>
		/// Gets the symbol's unique identifier
		/// </summary>
		get ID(): int { return this.id }

		/// <summary>
		/// Gets the symbol's name
		/// </summary>
		get Name(): string { return this.name }

		/// <summary>
		/// Initializes this symbol
		/// </summary>
		/// <param name="id">The id</param>
		/// <param name="name">The symbol's name</param>
		constructor(id: number, name: string) {
			this.id = Int.from(id)
			this.name = name
		}

		/// <summary>
		/// Gets a string representation of this symbol
		/// </summary>
		/// <returns>The value of this symbol</returns>
		toString(): string {
			return this.name
		}
	}
}