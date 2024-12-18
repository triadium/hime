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
import { TreeAction } from "../TreeAction"
import { LROpCodeBase } from "./LROpCodeBase"


/// <summary>
/// Represent an op-code for a LR production
/// An op-code can be either an instruction or raw data
/// </summary>
export class LROpCode {
	/// <summary>
	/// Bit mask for the tree action part of an instruction
	/// </summary>	
	private static readonly MASK_TREE_ACTION = 0x0003
	/// <summary>
	/// Bit mask for the base part of an instruction
	/// </summary>
	private static readonly MASK_BASE = 0xFFFC

	/// <summary>
	/// The op-code value
	/// </summary>
	private readonly code: int

	/// <summary>
	/// Gets the value of the data interpretation of this op-code
	/// </summary>
	get DataValue(): int { return this.code }

	/// <summary>
	/// Gets the tree action included in this code
	/// </summary>
	get TreeAction(): TreeAction { return (this.code & LROpCode.MASK_TREE_ACTION) as TreeAction }

	/// <summary>
	/// Gets the base instruction in this code
	/// </summary>
	get Base(): LROpCodeBase { return (this.code & LROpCode.MASK_BASE) as LROpCodeBase }

	/// <summary>
	/// Loads this op-code from the specified input
	/// </summary>
	/// <param name="input">An input</param>
	constructor(input: IBinaryReader) {
		this.code = input.ReadUInt16()
	}
}

