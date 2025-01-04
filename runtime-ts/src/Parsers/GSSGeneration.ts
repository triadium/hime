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
import { int } from '../BaseTypes'

/// <summary>
/// Represents a generation in a Graph-Structured Stack
/// </summary>
/// <remarks>
/// Because GSS nodes and edges are always created sequentially,
/// a generation basically describes a span in a buffer of GSS nodes or edges
/// </remarks>
export class GSSGeneration {
  /// <summary>
  /// The start index of this generation in the list of nodes
  /// </summary>
  private readonly start: int
  /// <summary>
  /// The number of nodes in this generation
  /// </summary>
  private count: int

  /// <summary>
  /// Gets the start index of this generation in the list of nodes
  /// </summary>
  get Start(): int {
    return this.start
  }

  /// <summary>
  /// Gets or sets the number of nodes in this generation
  /// </summary>
  get Count() {
    return this.count
  }
  set Count(value: int) {
    this.count = value
  }

  /// <summary>
  /// Initializes this generation
  /// </summary>
  /// <param name="start">The start index of this generation in the list of nodes</param>
  constructor(start: int) {
    this.start = start
    this.count = 0
  }
}
