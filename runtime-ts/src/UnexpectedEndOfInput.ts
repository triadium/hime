﻿/*******************************************************************************
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
	/// Represents the unexpected of the input text while more characters were expected
	/// </summary>
	export class UnexpectedEndOfInput extends ParseError {
		/// <summary>
		/// Gets the error's type
		/// </summary>
		get Type(): ParseErrorType { return ParseErrorType.UnexpectedEndOfInput }

		/// <summary>
		/// Gets the error's length in the input (in number of characters)
		/// </summary>
		get Length(): int { return 0 }

		/// <summary>
		/// Gets the error's message
		/// </summary>
		get Message(): string { return "Unexpected end of input" }

		/// <summary>
		/// Initializes this error
		/// </summary>
		/// <param name="position">Error's position in the input</param>
		constructor(position: TextPosition) {
			super(position)
		}
	}
}