/*******************************************************************************
 * Copyright (c) 2017 Association Cénotélie (cenotelie.fr)
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
import { AST } from "./AST"
import { ASTNode } from "./ASTNode"
import { int } from "./BaseTypes"


/// <summary>
/// Represents a family of children for an ASTNode
/// </summary>
export class ASTFamily implements Iterable<ASTNode> {
	/// <summary>
	/// The original parse tree
	/// </summary>
	private readonly tree: AST
	/// <summary>
	/// The index of the parent node in the parse tree
	/// </summary>
	private readonly parent: int

	/// <summary>
	/// Gets the number of children
	/// </summary>
	get Count(): int { return this.tree.GetChildrenCount(this.parent) }

	/// <summary>
	/// Gets the i-th child
	/// </summary>
	/// <param name="index">The index of the child</param>
	/// <returns>The child at the given index</returns>
	[index: int]: ASTNode

	/// <summary>
	/// Initializes this family
	/// </summary>
	/// <param name="tree">The parent parse tree</param>
	/// <param name="parent">The index of the parent node in the parse tree</param>
	constructor(tree: AST, parent: int) {
		const self = this

		this.tree = tree
		this.parent = parent

		return new Proxy(this, {
			get(target, prop) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					return self.tree.GetChild(self.parent, index)
				}
				return (target as unknown as any)[prop]
			}
		})
	}

	[Symbol.iterator]() {
		return this.tree.GetChildren(this.parent)[Symbol.iterator]()
	}
}

