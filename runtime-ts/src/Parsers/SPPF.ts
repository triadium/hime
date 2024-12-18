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
import { TreeAction } from "../TreeAction"
import { BigList } from "../Utils"
import { SPPFNode } from "./SPPFNode"
import { SPPFNodeNormal } from "./SPPFNodeNormal"
import { SPPFNodeRef } from "./SPPFNodeRef"
import { SPPFNodeReplaceable } from "./SPPFNodeReplaceable"


/// <summary>
/// Represents a Shared-Packed Parse Forest
/// </summary>
export class SPPF {
	/// <summary>
	/// Represents the epsilon node
	/// </summary>
	public static readonly EPSILON = -1


	/// <summary>
	/// The nodes in the SPPF
	/// </summary>
	private readonly nodes: BigList<SPPFNode>

	/// <summary>
	/// Initializes this SPPF
	/// </summary>
	constructor() {
		this.nodes = new BigList<SPPFNode>()
	}

	/// <summary>
	/// Gets the SPPF node for the specified identifier
	/// </summary>
	/// <param name="identifier">The identifier of an SPPF node</param>
	/// <returns>The SPPF node</returns>
	GetNode(identifier: int): SPPFNode {
		return this.nodes[identifier]!
	}

	/// <summary>
	/// Creates a new single node in the SPPF
	/// </summary>
	/// <param name="original">The original symbol of this node</param>
	/// <param name="label">The label on the first version of this node</param>
	/// <param name="childrenBuffer">A buffer for the children</param>
	/// <param name="childrenCount">The number of children</param>
	/// <returns>The identifier of the new node</returns>
	NewNode(original: TableElemRef, label: TableElemRef | null = null, childrenBuffer: SPPFNodeRef[] | null = null, childrenCount: int = 0): int {
		return this.nodes.Add(new SPPFNodeNormal(this.nodes.Size, original, label, childrenBuffer, childrenCount))
	}

	/// <summary>
	/// Creates a new replaceable node in the SPPF
	/// </summary>
	/// <param name="label">The label of this node</param>
	/// <param name="childrenBuffer">A buffer for the children</param>
	/// <param name="actionsBuffer">A buffer for the actions on the children</param>
	/// <param name="childrenCount">The number of children</param>
	/// <returns>The identifier of the new node</returns>
	NewReplaceableNode(label: TableElemRef, childrenBuffer: SPPFNodeRef[], actionsBuffer: TreeAction[], childrenCount: int): int {
		return this.nodes.Add(new SPPFNodeReplaceable(this.nodes.Size, label, childrenBuffer, actionsBuffer, childrenCount))
	}
}
