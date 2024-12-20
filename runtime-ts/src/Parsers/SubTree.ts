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
import { AST } from '../AST'
import { int } from '../BaseTypes'
import { TableElemRef } from '../TableElemRef'
import { TreeAction } from '../TreeAction'
import { ArrayCopy, Pool } from '../Utils'

/// <summary>
/// Represents a sub-tree in an AST
/// </summary>
/// <remarks>
/// A sub-tree is composed of a root with its children.
/// The children may also have children.
/// The maximum depth of a sub-tree is 2 (root, children and children's children), in which case the root is always a replaceable node.
/// The internal representation of a sub-tree is based on arrays.
/// The organization is that a node's children are immediately following it in the array.
/// For example, the tree A(B(CD)E(FG)) is represented as [ABCDEFG].
/// </remarks>
export class SubTree {
  /// <summary>
  /// The pool containing this object
  /// </summary>
  private readonly pool: Pool<SubTree> | null
  /// <summary>
  /// The nodes in this buffer
  /// </summary>
  private nodes: AST.Node[]
  /// <summary>
  /// The tree actions for the nodes
  /// </summary>
  private actions: TreeAction[]

  /// <summary>
  /// Gets the label of the node at the given index
  /// </summary>
  /// <param name="index">The index within the buffer</param>
  /// <returns>The label in the buffer</returns>
  GetLabelAt(index: int): TableElemRef {
    return this.nodes[index]!.label
  }

  /// <summary>
  /// Gets the tree action applied onto the node at the given index
  /// </summary>
  /// <param name="index">The index within the buffer</param>
  /// <returns>The tree action in the buffer</returns>
  GetActionAt(index: int): TreeAction {
    return this.actions[index]!
  }

  /// <summary>
  /// Sets the tree action applied onto the node at the given index
  /// </summary>
  /// <param name="index">The index within the buffer</param>
  /// <param name="action">The tree action to apply</param>
  SetActionAt(index: int, action: TreeAction): void {
    this.actions[index] = action
  }

  /// <summary>
  /// Gets the number of children of the node at the given index
  /// </summary>
  /// <param name="index">The index within the buffer</param>
  /// <returns>The number of children</returns>
  GetChildrenCountAt(index: int): int {
    return this.nodes[index]!.count
  }

  /// <summary>
  /// Sets the number of children of the node at the given index
  /// </summary>
  /// <param name="index">The index within the buffer</param>
  /// <param name="count">The number of children</param>
  SetChildrenCountAt(index: int, count: int): void {
    this.nodes[index]!.count = count
  }

  /// <summary>
  /// Gets the total number of nodes in this sub-tree
  /// </summary>
  /// <returns>The total number of nodes in this sub-tree</returns>
  GetSize(): int {
    if (this.actions[0] !== TreeAction.ReplaceByChildren) {
      return this.nodes[0]!.count + 1
    }
    let size = 1
    for (let i = 0; i < this.nodes[0]!.count; ++i) {
      size += this.nodes[size]!.count + 1
    }
    return size
  }

  /// <summary>
  /// Instantiates a new sub-tree attached to the given pool, with the given capacity
  /// </summary>
  /// <param name="pool">The pool to which this sub-tree is attached</param>
  /// <param name="capacity">The capacity of the internal buffer of this sub-tree</param>
  constructor(pool: Pool<SubTree> | null, capacity: int) {
    this.pool = pool
    this.nodes = new Array<AST.Node>(capacity)
    this.actions = new Array<TreeAction>(capacity)
  }

  /// <summary>
  /// Clones this sub-tree
  /// </summary>
  /// <returns>The clone</returns>
  Clone(): SubTree {
    const result = this.pool != null ? this.pool.Acquire() : new SubTree(null, this.nodes.length)
    const size = this.GetSize()
    ArrayCopy(this.nodes, 0, result.nodes, 0, size)
    ArrayCopy(this.actions, 0, result.actions, 0, size)
    return result
  }

  /// <summary>
  /// Initializes the root of this sub-tree
  /// </summary>
  /// <param name="symbol">The root's symbol</param>
  /// <param name="action">The tree action applied on the root</param>
  SetupRoot(symbol: TableElemRef, action: TreeAction): void {
    this.nodes[0] = new AST.Node(symbol)
    this.actions[0] = action
  }

  /// <summary>
  /// Copy the content of this sub-tree to the given sub-tree's buffer beginning at the given index
  /// </summary>
  /// <param name="destination">The sub-tree to copy to</param>
  /// <param name="index">The starting index in the destination's buffer</param>
  /// <remarks>
  /// This methods only applies in the case of a depth 1 sub-tree (only a root and its children).
  /// The results of this method in the case of a depth 2 sub-tree is undetermined.
  /// </remarks>
  CopyTo(destination: SubTree, index: int): void {
    if (this.nodes[0]!.count === 0) {
      destination.nodes[index] = this.nodes[0]!
      destination.actions[index] = this.actions[0]!
    } else {
      const size = this.nodes[0]!.count + 1
      ArrayCopy(this.nodes, 0, destination.nodes, index, size)
      ArrayCopy(this.actions, 0, destination.actions, index, size)
    }
  }

  /// <summary>
  /// Copy the root's children of this sub-tree to the given sub-tree's buffer beginning at the given index
  /// </summary>
  /// <param name="destination">The sub-tree to copy to</param>
  /// <param name="index">The starting index in the destination's buffer</param>
  /// <remarks>
  /// This methods only applies in the case of a depth 1 sub-tree (only a root and its children).
  /// The results of this method in the case of a depth 2 sub-tree is undetermined.
  /// </remarks>
  CopyChildrenTo(destination: SubTree, index: int): void {
    if (this.nodes[0]!.count === 0) {
      return
    }
    const size = this.GetSize() - 1
    ArrayCopy(this.nodes, 1, destination.nodes, index, size)
    ArrayCopy(this.actions, 1, destination.actions, index, size)
  }

  /// <summary>
  /// Commits the children of a sub-tree in this buffer to the final ast
  /// </summary>
  /// <param name="index">The starting index of the sub-tree</param>
  /// <param name="ast">The ast to commit to</param>
  /// <remarks>
  /// If the index is 0, the root's children are committed, assuming this is a depth-1 sub-tree.
  /// If not, the children of the child at the given index are committed.
  /// </remarks>
  CommitChildrenOf(index: int, ast: AST): void {
    if (this.nodes[index]!.count !== 0) {
      this.nodes[index]!.first = ast.Store(this.nodes, index + 1, this.nodes[index]!.count)
    }
  }

  /// <summary>
  /// Commits this buffer to the final ast
  /// </summary>
  /// <param name="ast">The ast to commit to</param>
  Commit(ast: AST): void {
    this.CommitChildrenOf(0, ast)
    ast.StoreRoot(this.nodes[0]!)
  }

  /// <summary>
  /// Sets the content of the i-th item
  /// </summary>
  /// <param name="index">The index of the item to set</param>
  /// <param name="symbol">The symbol</param>
  /// <param name="action">The tree action</param>
  SetAt(index: int, symbol: TableElemRef, action: TreeAction): void {
    this.nodes[index] = new AST.Node(symbol)
    this.actions[index] = action
  }

  /// <summary>
  /// Moves an item within the buffer
  /// </summary>
  /// <param name="from">The index of the item to move</param>
  /// <param name="to">The destination index for the item</param>
  Move(from: int, to: int): void {
    this.nodes[to] = this.nodes[from]!
  }

  /// <summary>
  /// Moves a range of items within the buffer
  /// </summary>
  /// <param name="from">The starting index of the items to move</param>
  /// <param name="to">The destination index for the items</param>
  /// <param name="length">The number of items to move</param>
  MoveRange(from: int, to: int, length: int): void {
    if (length !== 0) {
      ArrayCopy(this.nodes, from, this.nodes, to, length)
      ArrayCopy(this.actions, from, this.actions, to, length)
    }
  }

  /// <summary>
  /// Releases this sub-tree to the pool
  /// </summary>
  Free(): void {
    if (this.pool != null) {
      this.pool.Return(this)
    }
  }
}
