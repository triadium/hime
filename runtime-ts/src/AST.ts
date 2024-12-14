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
import { ASTLabel } from "./ASTLabel"
import { ASTNode } from "./ASTNode"
import { int } from "./BaseTypes"
import { GSymbol } from "./GSymbol"
import { GSymbolType } from "./GSymbolType"
import { SemanticElement } from "./SemanticElement"
import { TableElemRef } from "./TableElemRef"
import { TableType } from "./TableType"
import { TextContext } from "./TextContext"
import { TextPosition } from "./TextPosition"
import { TextSpan } from "./TextSpan"
import { Token } from "./Token"
import { TokenRepository } from "./TokenRepository"
import { BigList, ROList } from "./Utils"

/// <summary>
/// Represents a simple AST with a tree structure
/// </summary>
/// <remarks>
/// The nodes are stored in sequential arrays where the children of a node are an inner sequence.
/// The linkage is represented by each node storing its number of children and the index of its first child.
/// </remarks>
export class AST {
	/// <summary>
	/// The table of tokens
	/// </summary>
	private readonly tableTokens: TokenRepository
	/// <summary>
	/// The table of variables
	/// </summary>
	private readonly tableVariables: ROList<GSymbol>
	/// <summary>
	/// The table of virtuals
	/// </summary>
	private readonly tableVirtuals: ROList<GSymbol>
	/// <summary>
	/// The nodes' labels
	/// </summary>
	public readonly nodes: BigList<AST.Node>
	/// <summary>
	/// The index of the tree's root node
	/// </summary>
	private root: int


	/// <summary>
	/// Initializes this AST
	/// </summary>
	/// <param name="tokens">The table of tokens</param>
	/// <param name="variables">The table of variables</param>
	/// <param name="virtuals">The table of virtuals</param>
	constructor(tokens: TokenRepository, variables: ROList<GSymbol>, virtuals: ROList<GSymbol>) {
		this.tableTokens = tokens
		this.tableVariables = variables
		this.tableVirtuals = virtuals
		this.nodes = new BigList<AST.Node>()
		this.root = -1
	}

	/// <summary>
	/// Gets the root node of this tree
	/// </summary>
	get Root(): ASTNode { return new ASTNode(this, this.root) }

	/// <summary>
	/// Gets the number of children of the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The node's number of children</returns>
	GetChildrenCount(node: int): int {
		return this.nodes[node]!.count
	}

	/// <summary>
	/// Gets the i-th child of the given node
	/// </summary>
	/// <param name="parent">A node</param>
	/// <param name="i">The child's number</param>
	/// <returns>The i-th child</returns>
	GetChild(parent: int, i: int): ASTNode {
		return new ASTNode(this, this.nodes[parent]!.first + i)
	}

	/// <summary>
	/// Gets an enumerator for the children of the given node
	/// </summary>
	/// <param name="parent">A node</param>
	/// <returns>An enumerator for the children</returns>
	GetChildren(parent: int) {
		return new AST.ChildEnumerator(this, parent)
	}

	/// <summary>
	/// Gets the type of symbol for the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The type of symbol for the node</returns>
	GetSymbolType(node: int): GSymbolType {
		return this.nodes[node]!.label.Type as unknown as GSymbolType
	}

	/// <summary>
	/// Gets the position in the input text of the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The position in the text</returns>
	GetPosition(node: int): TextPosition {
		const sym = this.nodes[node]!.label
		return sym.Type === TableType.Token ? this.tableTokens.GetPosition(sym.Index) : new TextPosition(0, 0)
	}

	/// <summary>
	/// Gets the span in the input text of the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The span in the text</returns>
	GetSpan(node: int): TextSpan {
		const sym = this.nodes[node]!.label
		return sym.Type === TableType.Token ? this.tableTokens.GetSpan(sym.Index) : new TextSpan(0, 0)
	}

	/// <summary>
	/// Gets the context in the input of the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The context</returns>
	GetContext(node: int): TextContext {
		const sym = this.nodes[node]!.label
		return sym.Type === TableType.Token ? this.tableTokens.GetContext(sym.Index) : new TextContext()
	}

	/// <summary>
	/// Gets the grammar symbol associated to the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The associated symbol</returns>
	GetSymbol(node: int): GSymbol {
		return this.GetSymbolFor(this.nodes[node]!.label)
	}

	/// <summary>
	/// Gets the value of the given node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The associated value</returns>
	GetValue(node: int): string | null {
		const sym = this.nodes[node]!.label
		return sym.Type === TableType.Token ? this.tableTokens.GetValue(sym.Index) : null
	}

	/// <summary>
	/// Gets the symbol corresponding to the specified label
	/// </summary>
	/// <param name="label">A node label</param>
	/// <returns>The corresponding symbol</returns>
	GetSymbolFor(label: TableElemRef): GSymbol {
		switch (label.Type) {
			case TableType.Token:
				return this.tableTokens.GetSymbol(label.Index)
			case TableType.Variable:
				return this.tableVariables[label.Index]!
			case TableType.Virtual:
				return this.tableVirtuals[label.Index]!
			case TableType.None:
				return this.tableTokens.Terminals[0]! // terminal epsilon
		}
		// This cannot happen
		return new GSymbol(0, "")
	}

	/// <summary>
	/// Gets the semantic element corresponding to the specified node
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The corresponding semantic element</returns>
	GetSemanticElementForNode(node: int): SemanticElement {
		return this.GetSemanticElementForLabel(this.nodes[node]!.label)
	}

	/// <summary>
	/// Gets the semantic element corresponding to the specified label
	/// </summary>
	/// <param name="label">The label of an AST node</param>
	/// <returns>The corresponding semantic element</returns>
	GetSemanticElementForLabel(label: TableElemRef): SemanticElement {
		switch (label.Type) {
			case TableType.Token:
				return this.tableTokens[label.Index]!
			case TableType.Variable:
				return new ASTLabel(this.tableVariables[label.Index]!, GSymbolType.Variable)
			case TableType.Virtual:
				return new ASTLabel(this.tableVirtuals[label.Index]!, GSymbolType.Virtual)
			case TableType.None:
				return new ASTLabel(this.tableTokens.Terminals[0]!, GSymbolType.Terminal)
		}
		// This cannot happen
		// return null;
	}

	/// <summary>
	/// Gets the token (if any) that contains the specified index in the input text
	/// </summary>
	/// <param name="index">An index within the input text</param>
	/// <returns>The token, if any</returns>
	FindTokenAt(index: int): Token | null {
		return this.tableTokens.FindTokenAt(index)
	}

	/// <summary>
	/// Gets the AST node (if any) that has the specified token as label
	/// </summary>
	/// <param name="token">The token to look for</param>
	/// <returns>The AST node, if any</returns>
	FindNodeFor(token: Token): ASTNode | null {
		for (let i = 0; i < this.nodes.Size; ++i) {
			const node = this.nodes[i]!
			if (node.label.Type === TableType.Token && node.label.Index === token.index) {
				return new ASTNode(this, i)
			}
		}
		return null
	}

	/// <summary>
	/// Gets the parent of the specified node, if any
	/// </summary>
	/// <param name="node">A node</param>
	/// <returns>The parent node, if any</returns>
	FindParentOf(node: int): ASTNode | null {
		if (node == this.root) {
			return null
		}

		for (let i = 0; i < this.nodes.Size; ++i) {
			const candidate = this.nodes[i]!
			if (candidate.count > 0 && node >= candidate.first && node < candidate.first + candidate.count) {
				return new ASTNode(this, i)
			}
		}
		return null
	}

	/// <summary>
	/// Stores some children nodes in this AST
	/// </summary>
	/// <param name="nodes">The nodes to store</param>
	/// <param name="index">The starting index of the nodes in the data to store</param>
	/// <param name="count">The number of nodes to store</param>
	/// <returns>The index of the first inserted node in this tree</returns>
	Store(nodes: AST.Node[], index: int, count: int): int {
		return this.nodes.Push(nodes, index, count)
	}

	/// <summary>
	/// Stores the root of this tree
	/// </summary>
	/// <param name="node">The root</param>
	StoreRoot(node: AST.Node): void {
		this.root = this.nodes.Add(node)
	}
}

export namespace AST {
	/// <summary>
	/// Represents a node in this AST
	/// </summary>
	export class Node {
		/// <summary>
		/// The node's label
		/// </summary>
		label: TableElemRef
		/// <summary>
		/// The number of children
		/// </summary>
		count: int
		/// <summary>
		/// The index of the first child
		/// </summary>
		first: int

		/// <summary>
		/// Initializes this node
		/// </summary>
		/// <param name="label">The node's label</param>
		/// <param name="count">The number of children</param>
		/// <param name="first">The index of the first child</param>
		constructor(label: TableElemRef, count?: int, first?: int) {
			this.label = label;
			this.count = count ?? 0
			this.first = first ?? -1
		}
	}

	/// <summary>
	/// Represents and iterator for adjacents in this graph
	/// </summary>
	export class ChildEnumerator implements Iterable<ASTNode> {
		private ast: AST
		private first: int
		private end: int

		constructor(ast: AST, node: int) {
			this.ast = ast
			const n = ast.nodes[node]!
			this.first = n.first
			this.end = this.first + n.count
		}

		*[Symbol.iterator]() {
			for (let i = this.first - 1; i < this.end; ++i) {
				yield new ASTNode(this.ast, i)
			}
		}
	}
}

