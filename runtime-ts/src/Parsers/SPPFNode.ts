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
import { TableElemRef } from "../TableElemRef"


/// <summary>
/// Represents a node in a Shared-Packed Parse Forest
/// </summary>
export abstract class SPPFNode {
	/// <summary>
	/// The identifier of this node
	/// </summary>
	protected readonly identifier: int

	/// <summary>
	/// Gets the identifier of this node
	/// </summary>
	get Identifier(): int { return this.identifier }


	/// <summary>
	/// Gets whether this node must be replaced by its children
	/// </summary>
	abstract IsReplaceable: boolean

	/// <summary>
	/// Gets the original symbol for this node
	/// </summary>
	abstract OriginalSymbol: TableElemRef

	/// <summary>
	/// Initializes this node
	/// </summary>
	/// <param name="identifier">The identifier of this node</param>
	constructor(identifier: int) {
		this.identifier = identifier
	}
}
