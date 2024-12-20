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
import { char, int } from './BaseTypes'
import { ParseError } from './ParseError'
import { ParseErrorType } from './ParseErrorType'
import { TextPosition } from './TextPosition'

/// <summary>
/// Represents an incorrect encoding sequence error in the input of a lexer
/// </summary>
export class IncorrectEncodingSequence extends ParseError {
  /// <summary>
  /// The incorrect sequence
  /// </summary>
  private readonly sequence: char
  /// <summary>
  /// The precise error type
  /// </summary>
  private readonly type: ParseErrorType

  /// <summary>
  /// Gets the error's type
  /// </summary>
  get Type(): ParseErrorType {
    return this.type
  }

  /// <summary>
  /// Gets the error's length in the input (in number of characters)
  /// </summary>
  get Length(): int {
    return 1
  }

  /// <summary>
  /// Gets the error's message
  /// </summary>
  get Message(): string {
    return this.BuildMessage()
  }

  /// <summary>
  /// Gets the incorrect sequence
  /// </summary>
  get Sequence(): char {
    return this.sequence
  }

  /// <summary>
  /// Initializes this error
  /// </summary>
  /// <param name="position">Error's position in the input</param>
  /// <param name="sequence">The incorrect sequence</param>
  /// <param name="errorType">The precise error type</param>
  constructor(position: TextPosition, sequence: char, errorType: ParseErrorType) {
    super(position)
    this.sequence = sequence
    this.type = errorType
  }

  /// <summary>
  /// Builds the message for this error
  /// </summary>
  /// <returns>The message for this error</returns>
  private BuildMessage(): string {
    const builder = ['Incorrect encoding sequence: [']
    switch (this.type) {
      case ParseErrorType.IncorrectUTF16NoHighSurrogate:
        builder.push('<missing> ')
        builder.push('0x')
        builder.push(this.sequence.toString(16))
        break
      case ParseErrorType.IncorrectUTF16NoLowSurrogate:
        builder.push('0x')
        builder.push(this.sequence.toString(16))
        builder.push(' <missing>')
        break
      default:
        break
    }
    builder.push(']')
    return builder.join('')
  }
}
