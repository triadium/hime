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
import { char, int } from '../BaseTypes'

import { BaseText } from './BaseText'

/// <summary>
/// Text provider that fetches and stores the full content of an input lexer
/// </summary>
/// <remarks>
/// All line numbers and column numbers are 1-based.
/// Indices in the content are 0-based.
/// </remarks>
export class PrefetchedText extends BaseText {
  /// <summary>
  /// The full content of the input
  /// </summary>
  private readonly content: string

  /// <summary>
  /// Initializes this text
  /// </summary>
  /// <param name="content">The full lexer's input as a string</param>
  constructor(content: string) {
    super()
    this.content = content
  }

  /// <summary>
  /// Gets the character at the specified index
  /// </summary>
  /// <param name="index">Index from the start</param>
  /// <returns>The character at the specified index</returns>
  override GetChar(index: int): char {
    return this.content.charCodeAt(index)!
  }

  /// <summary>
  /// Gets whether the specified index is after the end of the text represented by this object
  /// </summary>
  /// <param name="index">Index from the start</param>
  /// <returns><c>true</c> if the index is after the end of the text</returns>
  override IsEnd(index: int): boolean {
    return index >= this.content.length
  }

  /// <summary>
  /// Finds all the lines in this content
  /// </summary>
  protected override FindLines(): void {
    this.lines = new Array(BaseText.INIT_LINE_COUNT_CACHE_SIZE)
    this.lines[0] = 0
    this.line = 1
    let c1: char
    let c2: char = '\0'.charCodeAt(0)!
    for (let i = 0; i < this.content.length; ++i) {
      c1 = c2
      c2 = this.content.charCodeAt(i)!
      // is c1 c2 a line ending sequence?
      if (this.IsLineEnding(c1, c2)) {
        // are we late to detect MacOS style?
        if (c1 == '\u000D'.charCodeAt(0) && c2 != '\u000A'.charCodeAt(0)) {
          this.AddLine(i)
        } else {
          this.AddLine(i + 1)
        }
      }
    }
  }

  /// <summary>
  /// Gets the size in number of characters
  /// </summary>
  get Size(): int {
    return this.content.length
  }

  /// <summary>
  /// Gets the substring beginning at the given index with the given length
  /// </summary>
  /// <param name="index">Index of the substring from the start</param>
  /// <param name="length">Length of the substring</param>
  /// <returns>The substring</returns>
  override GetValue(index: int, length: int): string {
    return length === 0 ? '' : this.content.substring(index, index + length)
  }

  /// <summary>
  /// Gets the length of the i-th line
  /// </summary>
  /// <param name="line">The line number</param>
  /// <returns>The length of the line</returns>
  /// <remarks>The line numbering is 1-based</remarks>
  override GetLineLength(line: int): int {
    if (this.lines == null) {
      this.FindLines()
    }
    return line == this.line
      ? this.content.length - this.lines[this.line - 1]!
      : this.lines[line]! - this.lines[line - 1]!
  }
}
