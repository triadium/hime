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
import { ROList } from './Utils/ROList'
import { int } from './BaseTypes'
import { GSymbol } from './GSymbol'
import { ParseError } from './ParseError'
import { ParseErrorType } from './ParseErrorType'
import { Token } from './Token'

/// <summary>
/// Represents an unexpected token error in a parser
/// </summary>
export class UnexpectedTokenError extends ParseError {
  /// <summary>
  /// The unexpected symbol
  /// </summary>
  private readonly unexpected: Token

  /// <summary>
  /// The expected terminals
  /// </summary>
  private readonly expected: ROList<GSymbol>

  /// <summary>
  /// Gets the error's type
  /// </summary>
  get Type(): ParseErrorType {
    return ParseErrorType.UnexpectedToken
  }

  /// <summary>
  /// Gets the error's length in the input (in number of characters)
  /// </summary>
  get Length(): int {
    return this.unexpected.Span.Length
  }

  /// <summary>
  /// Gets the error's message
  /// </summary>
  get Message(): string {
    return this.BuildMessage()
  }

  /// <summary>
  /// Gets the unexpected token
  /// </summary>
  get UnexpectedToken(): Token {
    return this.unexpected
  }

  /// <summary>
  /// Gets the expected terminals
  /// </summary>
  get ExpectedTerminals(): ROList<GSymbol> {
    return this.expected
  }

  /// <summary>
  /// Initializes this error
  /// </summary>
  /// <param name="token">The unexpected token</param>
  /// <param name="expected">The expected terminals</param>
  constructor(token: Token, expected: ROList<GSymbol>) {
    super(token.Position)
    this.unexpected = token
    this.expected = expected
  }

  /// <summary>
  /// Builds the message for this error
  /// </summary>
  /// <returns>The message for this error</returns>
  private BuildMessage(): string {
    const builder = ['Unexpected token "']
    builder.push(this.unexpected.Value)
    builder.push('"')
    if (this.expected.Count > 0) {
      builder.push('; expected: ')
      for (let i = 0; i < this.expected.Count; ++i) {
        if (i != 0) {
          builder.push(', ')
        }
        builder.push(this.expected[i]!.Name)
      }
    }
    return builder.join('')
  }
}
