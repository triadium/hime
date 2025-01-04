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
import { int } from '../BaseTypes'
import { TableElemRef } from '../TableElemRef'
import { TreeAction } from '../TreeAction'
import { ArrayCopy } from '../Utils'

import { SPPFNode } from './SPPFNode'
import { SPPFNodeRef } from './SPPFNodeRef'

/// <summary>
/// Represents a node in a Shared-Packed Parse Forest that can be replaced by its children
/// </summary>
export class SPPFNodeReplaceable extends SPPFNode {
  /// <summary>
  /// The label of this node
  /// </summary>
  private readonly label: TableElemRef
  /// <summary>
  /// The children of this node
  /// </summary>
  private readonly children: SPPFNodeRef[] | null
  /// <summary>
  /// The tree actions on the children of this node
  /// </summary>
  private readonly actions: TreeAction[] | null

  /// <summary>
  /// Gets whether this node must be replaced by its children
  /// </summary>
  override get IsReplaceable(): boolean {
    return true
  }

  /// <summary>
  /// Gets the original symbol for this node
  /// </summary>
  override get OriginalSymbol(): TableElemRef {
    return this.label
  }

  /// <summary>
  /// Gets the number of children of this node
  /// </summary>
  get ChildrenCount(): int {
    return this.children != null ? this.children.length : 0
  }

  /// <summary>
  /// Gets the children of this node
  /// </summary>
  get Children(): SPPFNodeRef[] | null {
    return this.children
  }

  /// <summary>
  /// Gets the tree actions on the children of this node
  /// </summary>
  get Actions(): TreeAction[] | null {
    return this.actions
  }

  /// <summary>
  /// Initializes this node
  /// </summary>
  /// <param name="identifier">The identifier of this node</param>
  /// <param name="label">The label of this node</param>
  /// <param name="childrenBuffer">A buffer for the children</param>
  /// <param name="actionsBuffer">A buffer for the actions on the children</param>
  /// <param name="childrenCount">The number of children</param>
  constructor(
    identifier: int,
    label: TableElemRef,
    childrenBuffer: SPPFNodeRef[],
    actionsBuffer: TreeAction[],
    childrenCount: int,
  ) {
    super(identifier)

    this.label = label
    if (childrenCount > 0) {
      this.children = new Array<SPPFNodeRef>(childrenCount)
      this.actions = new Array<TreeAction>(childrenCount)
      ArrayCopy(childrenBuffer, 0, this.children, 0, childrenCount)
      ArrayCopy(actionsBuffer, 0, this.actions, 0, childrenCount)
    } else {
      this.children = null
      this.actions = null
    }
  }
}
