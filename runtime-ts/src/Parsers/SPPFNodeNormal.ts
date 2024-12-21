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

import { SPPFNode } from './SPPFNode'
import { SPPFNodeRef } from './SPPFNodeRef'
import { SPPFNodeVersion } from './SPPFNodeVersion'

/// <summary>
/// Represents a node in a Shared-Packed Parse Forest
/// A node can have multiple versions
/// </summary>
export class SPPFNodeNormal extends SPPFNode {
  /// <summary>
  /// The size of the version buffer
  /// </summary>
  private static readonly VERSION_COUNT = 4

  /// <summary>
  /// The label of this node
  /// </summary>
  private readonly original: TableElemRef
  /// <summary>
  /// The different versions of this node
  /// </summary>
  private versions: SPPFNodeVersion[]
  /// <summary>
  /// The number of versions of this node
  /// </summary>
  private versionsCount: int

  /// <summary>
  /// Gets whether this node must be replaced by its children
  /// </summary>
  override get IsReplaceable(): boolean {
    return false
  }

  /// <summary>
  /// Gets the original symbol for this node
  /// </summary>
  override get OriginalSymbol(): TableElemRef {
    return this.original
  }

  /// <summary>
  /// Gets the default version of this node
  /// </summary>
  get DefaultVersion(): SPPFNodeVersion {
    return this.versions[0]!
  }

  /// <summary>
  /// Gets a specific version of this node
  /// </summary>
  /// <param name="version">The version number</param>
  /// <returns>The requested version</returns>
  GetVersion(version: int): SPPFNodeVersion {
    return this.versions[version]!
  }

  /// <summary>
  /// Initializes this node
  /// </summary>
  /// <param name="identifier">The identifier of this node</param>
  /// <param name="original">The original symbol of this node</param>
  /// <param name="label">The label on the first version of this node</param>
  /// <param name="childrenBuffer">A buffer for the children</param>
  /// <param name="childrenCount">The number of children</param>
  constructor(
    identifier: int,
    original: TableElemRef,
    label: TableElemRef | null = null,
    childrenBuffer: SPPFNodeRef[] | null = null,
    childrenCount: int = 0,
  ) {
    super(identifier)

    this.original = original
    this.versions = new Array<SPPFNodeVersion>(SPPFNodeNormal.VERSION_COUNT)
    this.versions[0] = new SPPFNodeVersion(label ?? original, childrenBuffer, childrenCount)
    this.versionsCount = 1
  }

  /// <summary>
  /// Adds a new version to this node
  /// </summary>
  /// <param name="label">The label for this version of the node</param>
  /// <param name="children">A buffer of children for this version of the node</param>
  /// <param name="childrenCount">The number of children</param>
  /// <returns>The reference to this new version</returns>
  NewVersion(label: TableElemRef, children: SPPFNodeRef[], childrenCount: int): SPPFNodeRef {
    if (this.versionsCount === this.versions.length) {
      this.versions.length = this.versions.length + SPPFNodeNormal.VERSION_COUNT
    }
    this.versions[this.versionsCount] = new SPPFNodeVersion(label, children, childrenCount)
    const result = new SPPFNodeRef(this.identifier, this.versionsCount)
    this.versionsCount++
    return result
  }
}
