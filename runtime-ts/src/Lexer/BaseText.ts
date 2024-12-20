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
import { Text } from '../Text'
import { TextContext } from '../TextContext'
import { TextPosition } from '../TextPosition'
import { TextSpan } from '../TextSpan'

/// <summary>
/// Represents the base implementation of Text
/// </summary>
/// <remarks>
/// All line numbers and column numbers are 1-based.
/// Indices in the content are 0-based.
/// </remarks>
export abstract class BaseText extends Text {
  /// <summary>
  /// The initial size of the cache of line start indices
  /// </summary>
  protected static readonly INIT_LINE_COUNT_CACHE_SIZE: int = 10000

  /// <summary>
  /// Cache of the starting indices of each line within the text
  /// </summary>
  protected lines!: int[]
  /// <summary>
  /// Index of the next line
  /// </summary>
  protected line!: int

  /// <summary>
  /// Gets whether the specified index is after the end of the text represented by this object
  /// </summary>
  /// <param name="index">Index from the start</param>
  /// <returns><c>true</c> if the index is after the end of the text</returns>
  public abstract IsEnd(index: int): boolean

  /// <summary>
  /// Finds all the lines in this content
  /// </summary>
  protected abstract FindLines(): void

  /// <summary>
  /// Determines whether [c1, c2] form a line ending sequence
  /// </summary>
  /// <param name="c1">First character</param>
  /// <param name="c2">Second character</param>
  /// <returns><c>true</c> if this is a line ending sequence</returns>
  /// <remarks>
  /// Recognized sequences are:
  /// [U+000D, U+000A] (this is Windows-style \r \n)
  /// [U+????, U+000A] (this is unix style \n)
  /// [U+000D, U+????] (this is MacOS style \r, without \n after)
  /// Others:
  /// [?, U+000B], [?, U+000C], [?, U+0085], [?, U+2028], [?, U+2029]
  /// </remarks>
  protected IsLineEnding(c1: char, c2: char): boolean {
    // other characters
    if (
      c2 === '\u000B'.charCodeAt(0) ||
      c2 === '\u000C'.charCodeAt(0) ||
      c2 === '\u0085'.charCodeAt(0) ||
      c2 === '\u2028'.charCodeAt(0) ||
      c2 === '\u2029'.charCodeAt(0)
    ) {
      return true
    }

    // matches [\r, \n] [\r, ??] and  [??, \n]
    if (c1 === '\u000D'.charCodeAt(0) || c2 === '\u000A'.charCodeAt(0)) {
      return true
    }

    return false
  }

  /// <summary>
  /// Adds a line starting at the specified index
  /// </summary>
  /// <param name="index">An index in the content</param>
  protected AddLine(index: int): void {
    this.lines[this.line] = index
    this.line++
  }

  /// <summary>
  /// Finds the index in the cache of the line at the given input index in the content
  /// </summary>
  /// <param name="index">The index within this content</param>
  /// <returns>The index of the corresponding line in the cache</returns>
  protected FindLineAt(index: int): int {
    if (this.lines == null) {
      this.FindLines()
    }
    for (let i = 1; i < this.line; ++i) {
      if (index < this.lines[i]!) {
        return i - 1
      }
    }
    return this.line - 1
  }

  /// <summary>
  /// Gets the number of lines
  /// </summary>
  get LineCount(): int {
    if (this.lines == null) {
      this.FindLines()
    }
    return this.line
  }

  /// <summary>
  /// Gets the character at the specified index
  /// </summary>
  /// <param name="index">Index from the start</param>
  /// <returns>The character at the specified index</returns>
  abstract GetChar(index: int): char

  /// <summary>
  /// Get the substring corresponding to the specified span
  /// </summary>
  /// <param name="span">A span in this text</param>
  /// <returns>The substring</returns>
  GetValueOfSpan(span: TextSpan): string {
    return this.GetValue(span.Index, span.Length)
  }

  /// <summary>
  /// Gets the starting index of the i-th line
  /// </summary>
  /// <param name="line">The line number</param>
  /// <returns>The starting index of the line</returns>
  /// <remarks>The line numbering is 1-based</remarks>
  GetLineIndex(line: int): int {
    if (this.lines == null) {
      this.FindLines()
    }
    return this.lines[line - 1]!
  }

  /// <summary>
  /// Gets the string content of the i-th line
  /// </summary>
  /// <param name="line">The line number</param>
  /// <returns>The string content of the line</returns>
  /// <remarks>The line numbering is 1-based</remarks>
  GetLineContent(line: int): string {
    return this.GetValue(this.GetLineIndex(line), this.GetLineLength(line))
  }

  /// <summary>
  /// Gets the position at the given index
  /// </summary>
  /// <param name="index">Index from the start</param>
  /// <returns>The position (line and column) at the index</returns>
  GetPositionAt(index: int): TextPosition {
    const l = this.FindLineAt(index)
    return new TextPosition(l + 1, index - this.lines[l]! + 1)
  }

  /// <summary>
  /// Gets the context description for the current text at the specified position
  /// </summary>
  /// <param name="position">The position in this text</param>
  /// <returns>The context description</returns>
  GetContext(position: TextPosition): TextContext {
    return this.GetContextOfElement(position, 1)
  }

  /// <summary>
  /// Gets the context description for the current text at the specified position
  /// </summary>
  /// <param name="position">The position in this text</param>
  /// <param name="length">The length of the element to contextualize</param>
  /// <returns>The context description</returns>
  GetContextOfElement(position: TextPosition, length: int): TextContext {
    const content = this.GetLineContent(position.Line)
    if (content.length === 0) {
      return new TextContext('', '^')
    }

    let end = content.length - 1

    while (
      end !== 1 &&
      (content[end] === '\u000A' ||
        content[end] === '\u000B' ||
        content[end] === '\u000C' ||
        content[end] === '\u000D' ||
        content[end] === '\u0085' ||
        content[end] === '\u2028' ||
        content[end] === '\u2029')
    ) {
      end--
    }

    let start = 0
    while (start < end && /\s/.test(content[start]!)) {
      start++
    }

    if (position.Column - 1 < start) {
      start = 0
    }
    if (position.Column - 1 > end) {
      end = content.length - 1
    }

    const builder = []
    for (let i = start; i < position.Column - 1; ++i) {
      builder.push(content[i] === '\t' ? '\t' : ' ')
    }
    builder.push('^')
    for (let i = 1; i < length; ++i) {
      builder.push('^')
    }

    return new TextContext(content.substring(start, end - start + 1), builder.join(''))
  }

  /// <summary>
  /// Gets the context description for the current text at the specified span
  /// </summary>
  /// <param name="span">The span of text to contextualize</param>
  /// <returns>The context description</returns>
  GetContextOfSpan(span: TextSpan): TextContext {
    const position = this.GetPositionAt(span.Index)
    return this.GetContextOfElement(position, span.Length)
  }
}
