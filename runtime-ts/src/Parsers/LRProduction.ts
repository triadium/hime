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
import { LROpCode } from "./LROpCode"


/// <summary>
/// Represents a rule's production in a LR parser
/// </summary>
/// <remarks>
/// The binary representation of a LR Production is as follow:
/// --- header
/// uint16: head's index
/// uint8: 1=replace, 0=nothing
/// uint8: reduction length
/// uint8: bytecode length in number of op-code
/// --- production's bytecode
/// See LRBytecode
/// </remarks>
export class LRProduction {
	/// <summary>
	/// Index of the rule's head in the parser's array of variables
	/// </summary>
	private readonly head: int
	/// <summary>
	/// Action of the rule's head (replace or not)
	/// </summary>
	private readonly headAction: TreeAction
	/// <summary>
	/// Size of the rule's body by only counting terminals and variables
	/// </summary>
	private readonly reducLength: int
	/// <summary>
	/// Bytecode for the rule's production
	/// </summary>
	private readonly bytecode: LROpCode[]

	/// <summary>
	/// Gets the index of the rule's head in the parser's array of variables
	/// </summary>
	get Head(): int { return this.head }

	/// <summary>
	/// Gets the action of the rule's head (replace or not)
	/// </summary>
	get HeadAction(): TreeAction { return this.headAction }

	/// <summary>
	/// Gets the size of the rule's body by only counting terminals and variables
	/// </summary>
	get ReductionLength(): int { return this.reducLength }

	/// <summary>
	/// Gets the length of the bytecode
	/// </summary>
	get BytecodeLength(): int { return this.bytecode.length }

	[index: int]: LROpCode

	/// <summary>
	/// Loads a new instance of the LRProduction class from a binary representation
	/// </summary>
	/// <param name="reader">The binary reader to read from</param>
	constructor(reader: IBinaryReader) {
		const self = this

		this.head = reader.ReadUInt16();
		this.headAction = reader.ReadUInt8() as TreeAction
		this.reducLength = reader.ReadUInt8()

		this.bytecode = new Array<LROpCode>(reader.ReadUInt8())
		for (let i = 0; i < this.bytecode.length; ++i) {
			this.bytecode[i] = new LROpCode(reader)
		}

		return new Proxy(this, {
			/// <summary>
			/// Gets the op-code at the specified index in the bytecode
			/// </summary>
			/// <param name="index">Index in the bytecode</param>			
			get(target, prop) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					return self.bytecode[index]
				}
				return (target as unknown as any)[prop]
			}
		})
	}
}
