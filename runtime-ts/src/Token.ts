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
import { int } from "./BaseTypes"
import { GSymbol } from "./GSymbol"
import { GSymbolType } from "./GSymbolType"
import { SemanticElement } from "./SemanticElement"
import { TextContext } from "./TextContext"
import { TextPosition } from "./TextPosition"
import { TextSpan } from "./TextSpan"
import { TokenRepository } from "./TokenRepository"


/// <summary>
/// Represents a token as an output element of a lexer
/// </summary>
export class Token implements SemanticElement {
	/// <summary>
	/// The repository containing this token
	/// </summary>
	private readonly repository: TokenRepository
	/// <summary>
	/// The index of this token in the text
	/// </summary>
	readonly index: int

	/// <summary>
	/// Gets the type of symbol this element represents
	/// </summary>
	get SymbolType(): GSymbolType { return GSymbolType.Terminal }

	/// <summary>
	/// Gets the position in the input text of this token
	/// </summary>
	get Position(): TextPosition { return this.repository.GetPosition(this.index) }

	/// <summary>
	/// Gets the span in the input text of this token
	/// </summary>
	get Span(): TextSpan { return this.repository.GetSpan(this.index) }

	/// <summary>
	/// Gets the context of this token in the input
	/// </summary>
	get Context(): TextContext { return this.repository.GetContext(this.index) }

	/// <summary>
	/// Gets the terminal associated to this token
	/// </summary>
	get Symbol(): GSymbol { return this.repository.GetSymbol(this.index) }

	/// <summary>
	/// Gets the value of this token
	/// </summary>
	get Value(): string { return this.repository.GetValue(this.index) }

	/// <summary>
	/// Initializes this token
	/// </summary>
	/// <param name="repository">The repository containing the token</param>
	/// <param name="index">The token's index</param>
	constructor(repository: TokenRepository, index: int) {
		this.repository = repository
		this.index = index
	}

	/// <summary>
	/// Gets a string representation of this token
	/// </summary>
	/// <returns>The string representation of the token</returns>
	toString(): string {
		const name = this.repository.GetSymbol(this.index).Name
		const value = this.repository.GetValue(this.index)
		return `${name} = ${value}`
	}
}

