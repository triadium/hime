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
import { IBinaryReader } from "../BinaryReader"
import { LRActionCode } from "./LRActionCode"

/// <summary>
/// Represents a LR action in a LR parse table
/// </summary>
export class LRAction {
	/// <summary>
	/// The LR action code
	/// </summary>
	private readonly code: LRActionCode
	/// <summary>
	/// The data associated with the action
	/// </summary>
	private readonly data: int

	/// <summary>
	/// Gets the action code
	/// </summary>
	get Code(): LRActionCode { return this.code }

	/// <summary>
	/// Gets the data associated with the action
	/// </summary>
	/// <remarks>
	/// If the code is Reduce, it is the index of the LRProduction
	/// If the code is Shift, it is the index of the next state
	/// </remarks>
	get Data(): int { return this.data }

	/// <summary>
	/// Loads this LR Action from the specified input
	/// </summary>
	/// <param name="input">An input</param>
	constructor(input: IBinaryReader) {
		this.code = input.ReadUInt16() as LRActionCode
		this.data = input.ReadUInt16()
	}
}

