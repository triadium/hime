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
	/// Represents the context description of a position in a piece of text.
	/// A context is composed of two pieces of text, the line content and the pointer.
	/// For example, given the piece of text:
	/// "public Struct Context"
	/// A context pointing to the second word will look like:
	/// content = "public Struct Context"
	/// pointer = "       ^"
	/// </summary>
	export class TextContext {
		/// <summary>
		/// The text content being represented
		/// </summary>
		private readonly content: string
		/// <summary>
		/// The pointer textual representation
		/// </summary>
		private readonly pointer: string

		/// <summary>
		/// Gets the text content being represented
		/// </summary>
		/// <value>The text content being represented</value>
		get Content(): string { return this.content }

		/// <summary>
		/// Gets the pointer textual representation
		/// </summary>
		/// <value>The pointer textual representation</value>
		get Pointer(): string { return this.pointer }

		/// <summary>
		/// Initializes this context
		/// </summary>
		/// <param name="content">The text being begin represented</param>
		/// <param name="pointer">The pointer textual representation</param>
		constructor(content: string, pointer: string) {
			this.content = content;
			this.pointer = pointer;
		}
	}
}