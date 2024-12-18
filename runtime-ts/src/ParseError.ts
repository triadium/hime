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
import { ParseErrorType } from "./ParseErrorType"
import { TextPosition } from "./TextPosition"


/// <summary>
/// Represents an error in a parser
/// </summary>
export abstract class ParseError {
	/// <summary>
	/// The error's position in the input text
	/// </summary>
	private readonly position: TextPosition

	/// <summary>
	/// Gets the error's type
	/// </summary>
	abstract Type: ParseErrorType

	/// <summary>
	/// Gets the error's position in the input
	/// </summary>
	get Position(): TextPosition { return this.position }

	/// <summary>
	/// Gets the error's length in the input (in number of characters)
	/// </summary>
	abstract Length: int

	/// <summary>
	/// Gets the error's message
	/// </summary>
	abstract Message: string

	/// <summary>
	/// Initializes this error
	/// </summary>
	/// <param name="position">Error's position in the input</param>
	protected constructor(position: TextPosition) {
		this.position = position
	}

	/// <summary>
	/// Returns the string representation of this error
	/// </summary>
	/// <returns>The string representation of this error</returns>
	toString(): string {
		return `@${this.position} ${this.Message}`
	}
}
