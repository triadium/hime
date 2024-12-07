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

namespace Hime.Redist {
	/// <summary>
	/// Represents an unexpected character error in the input stream of a lexer
	/// </summary>
	export class UnexpectedCharError extends ParseError {
		/// <summary>
		/// The unexpected character
		/// </summary>
		private readonly unexpected: string

		/// <summary>
		/// Gets the error's type
		/// </summary>
		get Type(): ParseErrorType { return ParseErrorType.UnexpectedChar }

		/// <summary>
		/// Gets the error's length in the input (in number of characters)
		/// </summary>
		get Length(): int { return this.unexpected.length }

		/// <summary>
		/// Gets the error's message
		/// </summary>
		get Message(): string { return this.BuildMessage() }

		/// <summary>
		/// Gets the unexpected char
		/// </summary>
		get UnexpectedChar(): string { return this.unexpected }

		/// <summary>
		/// Initializes this error
		/// </summary>
		/// <param name="unexpected">The errorneous character (as a string)</param>
		/// <param name="position">Error's position in the input</param>
		constructor(unexpected: string, position: TextPosition) {
			super(position)
			this.unexpected = unexpected
		}

		/// <summary>
		/// Builds the message for this error
		/// </summary>
		/// <returns>The message for this error</returns>
		private BuildMessage(): string {
			const builder = ["Unexpected character '"]
			builder.push(this.unexpected)
			builder.push("' (U+")
			if (this.unexpected.length === 1) {
				builder.push(this.unexpected.charCodeAt(0).toString(16))
			}
			else {
				const lead = this.unexpected.charCodeAt(0)
				const trail = this.unexpected.charCodeAt(1)
				const cp = ((trail - 0xDC00) | ((lead - 0xD800) << 10)) + 0x10000
				builder.push(cp.toString(16))
			}
			builder.push(")")
			return builder.join("")
		}
	}
}