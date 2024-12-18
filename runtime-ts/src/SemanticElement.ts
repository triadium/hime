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
import { GSymbol } from "./GSymbol"
import { GSymbolType } from "./GSymbolType"
import { TextContext } from "./TextContext"
import { TextPosition } from "./TextPosition"
import { TextSpan } from "./TextSpan"


/// <summary>
/// Represents an element of parsing data
/// </summary>
export interface SemanticElement {
	/// <summary>
	/// Gets the type of symbol this element represents
	/// </summary>
	readonly SymbolType: GSymbolType

	/// <summary>
	/// Gets the position in the input text of this element
	/// </summary>
	readonly Position: TextPosition

	/// <summary>
	/// Gets the span in the input text of this element
	/// </summary>
	readonly Span: TextSpan

	/// <summary>
	/// Gets the context of this element in the input
	/// </summary>
	readonly Context: TextContext

	/// <summary>
	/// Gets the grammar symbol associated to this element
	/// </summary>
	readonly Symbol: GSymbol

	/// <summary>
	/// Gets the value of this element, if any
	/// </summary>
	readonly Value: string
}

