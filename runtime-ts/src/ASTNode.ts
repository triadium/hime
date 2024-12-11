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
import { AST } from "./AST";
import { ASTFamily } from "./ASTFamily";
import { int } from "./BaseTypes";
import { GSymbol } from "./GSymbol";
import { GSymbolType } from "./GSymbolType";
import { SemanticElement } from "./SemanticElement";
import { TextContext } from "./TextContext";
import { TextPosition } from "./TextPosition";
import { TextSpan } from "./TextSpan";


/// <summary>
/// Represents a node in an Abstract Syntax Tree
/// </summary>
export class ASTNode implements SemanticElement {
	/// <summary>
	/// The parent parse tree
	/// </summary>
	private readonly tree: AST
	/// <summary>
	/// The index of this node in the parse tree
	/// </summary>
	private readonly index: int

	/// <summary>
	/// Gets the parent node, if any
	/// </summary>
	get Parent(): ASTNode | null { return this.tree.FindParentOf(this.index) }

	/// <summary>
	/// Gets the type of symbol this element represents
	/// </summary>
	get SymbolType(): GSymbolType { return this.tree.GetSymbolType(this.index) }

	/// <summary>
	/// Gets the children of this node
	/// </summary>
	get Children(): ASTFamily { return new ASTFamily(this.tree, this.index) }

	/// <summary>
	/// Gets the position in the input text of this node
	/// </summary>
	get Position(): TextPosition { return this.tree.GetPosition(this.index) }

	/// <summary>
	/// Gets the span in the input text of this node
	/// </summary>
	get Span(): TextSpan { return this.tree.GetSpan(this.index) }

	/// <summary>
	/// Gets the context of this node in the input
	/// </summary>
	get Context(): TextContext { return this.tree.GetContext(this.index) }

	/// <summary>
	/// Gets the grammar symbol associated to this node
	/// </summary>
	get Symbol(): GSymbol { return this.tree.GetSymbol(this.index) }

	/// <summary>
	/// Gets the value of this node
	/// </summary>
	get Value(): string { return this.tree.GetValue(this.index) ?? "" /* null */ }

	/// <summary>
	/// Initializes this node
	/// </summary>
	/// <param name="tree">The parent parse tree</param>
	/// <param name="index">The index of this node in the parse tree</param>
	constructor(tree: AST, index: int) {
		this.tree = tree
		this.index = index
	}

	/// <summary>
	/// Gets a string representation of this node
	/// </summary>
	/// <returns>The string representation of this node</returns>
	toString(): string {
		const name = this.tree.GetSymbol(this.index).Name
		const value = this.tree.GetValue(this.index)
		if (value != null) {
			return `${name} = ${value}`
		}
		return name
	}
}

