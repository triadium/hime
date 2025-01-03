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
import { int } from '../BaseTypes'

import { Automaton } from './Automaton'

/// <summary>
/// Represents a match in the input
/// </summary>
export class TokenMatch {
  /// <summary>
  /// The matching DFA state
  /// </summary>
  readonly state: int
  /// <summary>
  /// Length of the matched input
  /// </summary>
  readonly length: int

  /// <summary>
  /// Gets whether this is match indicates a success
  /// </summary>
  get IsSuccess(): boolean {
    return this.state !== Automaton.DEAD_STATE
  }

  /// <summary>
  /// Initializes a match
  /// </summary>
  /// <param name='state'>The matching DFA state</param>
  /// <param name='length'>Length of the matched input</param>
  constructor(state: int, length: int) {
    this.state = state
    this.length = length
  }

  /// <summary>
  /// Initializes a failing match
  /// </summary>
  /// <param name='length'>The number of characters to advance in the input</param>
  static FailingMatch(length: int): TokenMatch {
    return new TokenMatch(Automaton.DEAD_STATE, length)
  }
}