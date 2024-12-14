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
import { int, ushort } from "../BaseTypes"
import { IBinaryReader } from "../BinaryReader"


/// <summary>
/// Represents the contexts opening by transitions from a state
/// </summary>
export class LRContexts {
	/// <summary>
	/// The contexts
	/// </summary>
	private readonly content: ushort[] | null

	/// <summary>
	/// Gets the number of contexts
	/// </summary>
	get Count(): int { return this.content == null ? 0 : this.content.length }

	/// <summary>
	/// Loads the contexts from the specified input
	/// </summary>
	/// <param name="input">An input</param>
	constructor(input: IBinaryReader) {
		const count = input.ReadUInt16()
		if (count > 0) {
			this.content = new Array(count * 2)
			for (let i = 0; i < count * 2; ++i) {
				this.content[i] = input.ReadUInt16()
			}
		}
		else {
			this.content = null
		}
	}

	/// <summary>
	/// Gets whether the specified context opens by a transition using the specified terminal ID
	/// </summary>
	/// <param name="terminalID">The identifier of a terminal</param>
	/// <param name="context">A context</param>
	/// <returns><c>true</c> if the specified context is opened</returns>
	Opens(terminalID: int, context: int): boolean {
		if (this.content == null) {
			return false
		}
		let index = 0
		while (index < this.content.length && this.content[index] !== terminalID) {
			index += 2
		}
		if (index === this.content.length) {
			// not found
			return false
		}
		while (index < this.content.length && this.content[index] === terminalID) {
			if (this.content[index + 1] === context) {
				return true
			}
			index += 2
		}
		return false;
	}
}
