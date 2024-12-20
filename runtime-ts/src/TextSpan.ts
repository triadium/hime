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
import { Int, int } from './BaseTypes'

/// <summary>
/// Represents a span of text in an input as a starting index and length
/// </summary>
export class TextSpan {
  /// <summary>
  /// The starting index
  /// </summary>
  private readonly index: int
  /// <summary>
  /// The length
  /// </summary>
  private readonly length: int

  /// <summary>
  /// Gets the starting index of this span
  /// </summary>
  get Index(): int {
    return this.index
  }

  /// <summary>
  /// Gets the length of this span
  /// </summary>
  get Length(): int {
    return this.length
  }

  /// <summary>
  /// Initializes this span
  /// </summary>
  /// <param name="index">The span's index</param>
  /// <param name="length">The span's length</param>
  constructor(index: number, length: number) {
    this.index = Int.from(index)
    this.length = Int.from(length)
  }

  /// <summary>
  /// Gets a string representation of this position
  /// </summary>
  /// <returns></returns>
  toString(): string {
    return `@${this.index}+${this.length}`
  }
}
