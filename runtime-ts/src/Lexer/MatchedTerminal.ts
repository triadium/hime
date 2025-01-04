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
import { int, ushort } from '../BaseTypes'

/// <summary>
/// Represents the information of a terminal matched at the state of a lexer's automaton
/// </summary>
export class MatchedTerminal {
  /// <summary>
  /// The context
  /// </summary>
  private readonly context: ushort
  /// <summary>
  /// The terminal's index
  /// </summary>
  private readonly index: ushort

  /// <summary>
  /// Gets the context required for the terminal to be matched
  /// </summary>
  get Context(): int {
    return this.context
  }

  /// <summary>
  /// Gets the index of the matched terminal in the terminal table of the associated lexer
  /// </summary>
  get Index(): int {
    return this.index
  }

  /// <summary>
  /// Initializes this matched terminal data
  /// </summary>
  /// <param name="context">The context</param>
  /// <param name="index">The terminal's index</param>
  constructor(context: ushort, index: ushort) {
    this.context = context
    this.index = index
  }
}
