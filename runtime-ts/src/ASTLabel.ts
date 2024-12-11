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
import { GSymbol } from "./GSymbol"
import { GSymbolType } from "./GSymbolType"
import { SemanticElement } from "./SemanticElement"
import { TextContext } from "./TextContext"
import { TextPosition } from "./TextPosition"
import { TextSpan } from "./TextSpan"


/// <summary>
/// Represents a label an AST node
/// </summary>
export class ASTLabel implements SemanticElement {
	/// <summary>
	/// The symbol being referenced
	/// </summary>
	private readonly symbol: GSymbol
	/// <summary>
	/// The type of this symbol
	/// </summary>
	private readonly type: GSymbolType

	/// <summary>
	/// Gets the type of symbol this element represents
	/// </summary>
	get SymbolType(): GSymbolType { return this.type }

	/// <summary>
	/// Gets the position in the input text of this element
	/// </summary>
	get Position(): TextPosition { return new TextPosition(0, 0) }

	/// <summary>
	/// Gets the span in the input text of this element
	/// </summary>
	get Span(): TextSpan { return new TextSpan(0, 0) }

	/// <summary>
	/// Gets the context of this element in the input
	/// </summary>
	get Context(): TextContext { return new TextContext() }

	/// <summary>
	/// Gets the grammar symbol associated to this element
	/// </summary>
	get Symbol(): GSymbol { return this.symbol }

	/// <summary>
	/// Gets the value of this element, if any
	/// </summary>
	get Value(): string { return "" /* null? */ }

	/// <summary>
	/// Initializes this reference
	/// </summary>
	/// <param name="symbol">The symbol being referenced</param>
	/// <param name="type">The type of this symbol</param>
	constructor(symbol: GSymbol, type: GSymbolType) {
		this.symbol = symbol
		this.type = type
	}

	/// <summary>
	/// Gets a string representation of this token
	/// </summary>
	/// <returns>The string representation of the token</returns>
	toString(): string {
		return this.symbol.Name
	}
}

