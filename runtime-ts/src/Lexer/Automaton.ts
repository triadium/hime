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
import { int, uint, ushort } from '../BaseTypes'
import { IBinaryReader } from '../BinaryReader'

import { AutomatonState } from './AutomatonState'

/// <summary>
/// Represents the automaton of a lexer
/// </summary>
/// <remarks>
/// Binary data structure of lexers:
/// uint32: number of entries in the states index table
/// -- states offset table
/// each entry is of the form:
/// uint32: offset of the state from the beginning of the states table in number of uint16
/// -- states table
/// See AutomatonState
/// </remarks>
export class Automaton {
  /// <summary>
  /// Identifier of inexistant state in an automaton
  /// </summary>
  static readonly DEAD_STATE: int = 0xffff
  /// <summary>
  /// Identifier of the default context
  /// </summary>
  static readonly DEFAULT_CONTEXT: int = 0

  /// <summary>
  /// Table of indices in the states table
  /// </summary>
  private readonly table: uint[]
  /// <summary>
  /// Lexer's DFA table of states
  /// </summary>
  private readonly states: ushort[]
  /// <summary>
  /// The number of states in this automaton
  /// </summary>
  private readonly statesCount: int

  /// <summary>
  /// Gets the number of states in this automaton
  /// </summary>
  get StatesCount(): int {
    return this.statesCount
  }

  /// <summary>
  /// Get the data of the specified state
  /// </summary>
  /// <param name="state">A state's index</param>
  /// <returns>The data of the specified state</returns>
  GetState(state: int): AutomatonState {
    return new AutomatonState(this.states, this.table[state]!)
  }

  /// <summary>
  /// Initializes a new automaton from the given binary stream
  /// </summary>
  /// <param name="reader">The binary stream to load from</param>
  /// <remarks>
  /// This methods reads the necessary data from the reader assuming the reader only contains this automaton.
  /// It will read from reader until the end of the underlying stream.
  /// </remarks>
  constructor(reader: IBinaryReader) {
    this.statesCount = reader.ReadInt32()
    this.table = new Array(this.statesCount) // uint[]
    for (let i = 0; i < this.statesCount; ++i) {
      this.table[i] = reader.ReadUInt32()
    }
    const rest = (reader.Length - this.table.length * 4 - 4) / 2
    this.states = new Array(rest) // ushort[]
    for (let i = 0; i < rest; ++i) {
      this.states[i] = reader.ReadUInt16()
    }
  }
}
