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
import { ArrayCopy } from "../Utils"
import { SPPFNodeRef } from "./SPPFNodeRef"


/// <summary>
/// Represents a version of a node in a Shared-Packed Parse Forest
/// </summary>
export class SPPFNodeVersion {
	/// <summary>
	/// The label of the node for this version
	/// </summary>
	private readonly label: TableElemRef
	/// <summary>
	/// The children of the node for this version
	/// </summary>
	private readonly children: SPPFNodeRef[] | null

	/// <summary>
	/// Gets the label of the node for this version
	/// </summary>
	get Label(): TableElemRef { return this.label }

	/// <summary>
	/// Gets the number of children for this version of the node
	/// </summary>
	get ChildrenCount(): int { return this.children != null ? this.children.length : 0 }

	/// <summary>
	/// Gets the children of the node for this version
	/// </summary>
	get Children(): SPPFNodeRef[] | null { return this.children }

	/// <summary>
	/// Initializes this node version with or without children
	/// </summary>
	/// <param name="label">The label for this version of the node</param>
	/// <param name="children">A buffer of children for this version of the node</param>
	/// <param name="childrenCount">The number of children</param>
	constructor(label: TableElemRef, children: SPPFNodeRef[] | null = null, childrenCount: int = 0) {
		this.label = label
		if (children == null || childrenCount === 0) {
			this.children = null;
		}
		else {
			this.children = new Array<SPPFNodeRef>(childrenCount)
			ArrayCopy(children, 0, this.children, 0, childrenCount)
		}
	}
}
