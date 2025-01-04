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
import { int } from './BaseTypes'
import { GSymbol } from './GSymbol'
import { Text } from './Text'
import { TextContext } from './TextContext'
import { TextPosition } from './TextPosition'
import { TextSpan } from './TextSpan'
import { Token } from './Token'
import { BigList } from './Utils'
import { ROList } from './Utils'

/// <summary>
/// Represents the metadata of a token
/// </summary>
class Cell {
  /// <summary>
  /// The terminal's index
  /// </summary>
  readonly terminal: int
  /// <summary>
  /// The span of this token
  /// </summary>
  readonly span: TextSpan

  /// <summary>
  /// Initializes this cell
  /// </summary>
  /// <param name="terminal">The terminal's index</param>
  /// <param name="span">The token's span in the input</param>
  constructor(terminal: int, span: TextSpan) {
    this.terminal = terminal
    this.span = span
  }
}

/// <summary>
/// Represents an iterator over all the tokens in this repository
/// </summary>
class LinearEnumerator implements Iterable<Token> {
  /// <summary>
  /// The repository
  /// </summary>
  private repository: TokenRepository

  /// <summary>
  /// Initializes this iterator
  /// </summary>
  /// <param name="repository">The repository</param>
  constructor(repository: TokenRepository) {
    this.repository = repository
  }
  *[Symbol.iterator]() {
    for (let i = 0; i < this.repository.Size; ++i) {
      yield this.repository[i]!
    }
  }
}

/// <summary>
/// A repository of matched tokens
/// </summary>
export class TokenRepository implements Iterable<Token> {
  /// <summary>
  /// The terminal symbols matched in this content
  /// </summary>
  private readonly terminals: ROList<GSymbol>
  /// <summary>
  /// The base text
  /// </summary>
  private readonly text: Text
  /// <summary>
  /// The token data in this content
  /// </summary>
  private readonly cells: BigList<Cell>

  /// <summary>
  /// Gets the number of tokens in this repository
  /// </summary>
  get Size(): int {
    return this.cells.Size
  }

  /// <summary>
  /// Gets the terminal symbols matched in this content
  /// </summary>
  get Terminals(): ROList<GSymbol> {
    return this.terminals
  }

  /// <summary>
  /// Gets the token at the specified index
  /// </summary>
  /// <param name="index">An index in this repository</param>
  /// <returns>The token at the specified index</returns>
  readonly [n: number]: Token

  /// <summary>
  /// Initializes this text
  /// </summary>
  /// <param name="terminals">The terminal symbols</param>
  /// <param name="text">The base text</param>
  constructor(terminals: ROList<GSymbol>, text: Text) {
    this.terminals = terminals
    this.text = text
    this.cells = new BigList<Cell>()

    return new Proxy(this, {
      get: (target, prop) => {
        const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
        if (typeof index === 'number' && !isNaN(index)) {
          return new Token(this, index)
        }
        return (target as unknown as any)[prop]
      },
    })
  }
  [Symbol.iterator]() {
    return new LinearEnumerator(this)[Symbol.iterator]()
  }

  /// <summary>
  /// Gets the position in the input text of the given token
  /// </summary>
  /// <param name="index">A token's index</param>
  /// <returns>The position in the text</returns>
  GetPosition(index: int): TextPosition {
    return this.text.GetPositionAt(this.cells[index]!.span.Index)
  }

  /// <summary>
  /// Gets the span in the input text of the given token
  /// </summary>
  /// <param name="token">A token's index</param>
  /// <returns>The span in the text</returns>
  GetSpan(token: int): TextSpan {
    return this.cells[token]!.span
  }

  /// <summary>
  /// Gets the context in the input of the given token
  /// </summary>
  /// <param name="index">A token's index</param>
  /// <returns>The context</returns>
  GetContext(index: int): TextContext {
    return this.text.GetContextOfSpan(this.cells[index]!.span)
  }

  /// <summary>
  /// Gets the grammar symbol associated to the given token
  /// </summary>
  /// <param name="index">A token's index</param>
  /// <returns>The associated symbol</returns>
  GetSymbol(index: int): GSymbol {
    return this.terminals[this.cells[index]!.terminal]!
  }

  /// <summary>
  /// Gets the value of the given token
  /// </summary>
  /// <param name="index">A token's index</param>
  /// <returns>The associated value</returns>
  GetValue(index: int): string {
    return this.text.GetValueOfSpan(this.cells[index]!.span)
  }

  /// <summary>
  /// Gets the token (if any) that contains the specified index in the input text
  /// </summary>
  /// <param name="index">An index within the input text</param>
  /// <returns>The token, if any</returns>
  FindTokenAt(index: int): Token | null {
    const count = this.cells.Size
    if (count === 0) {
      return null
    }
    let l = 0
    let r = count - 1
    while (l <= r) {
      const m = (l + r) / 2
      const cell = this.cells[m]!
      if (index < cell.span.Index) {
        // look on the left
        r = m - 1
      } else if (index < cell.span.Index + cell.span.Length) {
        // within the token
        return new Token(this, m)
      } else {
        // look on the right
        l = m + 1
      }
    }
    return null
  }

  /// <summary>
  /// Registers a new token in this repository
  /// </summary>
  /// <param name="terminal">The index of the matched terminal</param>
  /// <param name="index">The starting index of the matched value in the input</param>
  /// <param name="length">The length of the matched value in the input</param>
  /// <returns>The index of the added token</returns>
  Add(terminal: int, index: int, length: int): int {
    return this.cells.Add(new Cell(terminal, new TextSpan(index, length)))
  }
}
