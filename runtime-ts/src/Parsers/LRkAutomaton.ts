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
import { IBinaryReader } from '../BinaryReader'
import { GSymbol } from '../GSymbol'
import { ROList } from '../Utils'

import { ColumnMap } from './ColumnMap'
import { LRAction } from './LRAction'
import { LRActionCode } from './LRActionCode'
import { LRContexts } from './LRContexts'
import { LRExpected } from './LRExpected'
import { LRProduction } from './LRProduction'

/// <summary>
/// Represents the LR(k) parsing table and productions
/// </summary>
/// <remarks>
/// Binary data of a LR(k) parser
/// --- header
/// uint16: number of columns
/// uint16: number of states
/// uint16: number of productions
/// --- parse table columns
/// uint16: sid of the column
/// --- parse table
/// See LRActions
/// --- productions table
/// See LRProduction
/// </remarks>
export class LRkAutomaton {
  /// <summary>
  /// The number of columns in the LR table
  /// </summary>
  private readonly ncols: ushort
  /// <summary>
  /// The number of states in the LR table
  /// </summary>
  private readonly nstates: ushort
  /// <summary>
  /// Map of symbol ID to column index in the LR table
  /// </summary>
  private readonly columns: ColumnMap
  /// <summary>
  /// The contexts information
  /// </summary>
  private readonly contexts: LRContexts[]
  /// <summary>
  /// The LR table
  /// </summary>
  private readonly table: LRAction[]
  /// <summary>
  /// The table of LR productions
  /// </summary>
  private readonly productions: LRProduction[]

  /// <summary>
  /// Gets the number of states in this automaton
  /// </summary>
  get StatesCount(): int {
    return this.nstates
  }

  /// <summary>
  /// Initializes a new automaton from the given binary stream
  /// </summary>
  /// <param name="reader">The binary stream to load from</param>
  constructor(reader: IBinaryReader) {
    this.ncols = reader.ReadUInt16()
    this.nstates = reader.ReadUInt16()
    const nprod = reader.ReadUInt16()

    this.columns = new ColumnMap()
    for (let i = 0; i < this.ncols; ++i) {
      this.columns.Add(reader.ReadUInt16(), i)
    }

    this.contexts = new Array<LRContexts>(this.nstates)
    for (let i = 0; i < this.nstates; ++i) {
      this.contexts[i] = new LRContexts(reader)
    }
    this.table = new Array<LRAction>(this.nstates * this.ncols)
    for (let i = 0; i < this.nstates * this.ncols; ++i) {
      this.table[i] = new LRAction(reader)
    }
    this.productions = new Array<LRProduction>(nprod)
    for (let i = 0; i < nprod; ++i) {
      this.productions[i] = new LRProduction(reader)
    }
  }

  /// <summary>
  /// Gets the contexts opened by the specified state
  /// </summary>
  /// <param name="state">State in the LR(k) automaton</param>
  /// <returns>The opened contexts</returns>
  GetContexts(state: int): LRContexts {
    return this.contexts[state]!
  }

  /// <summary>
  /// Gets the LR(k) action for the given state and sid
  /// </summary>
  /// <param name="state">State in the LR(k) automaton</param>
  /// <param name="sid">Symbol's ID</param>
  /// <returns>The LR(k) action for the state and sid</returns>
  GetAction(state: int, sid: int): LRAction {
    return this.table[state * this.ncols + this.columns[sid]!]!
  }

  /// <summary>
  /// Gets the production at the given index
  /// </summary>
  /// <param name="index">Production's index</param>
  /// <returns>The production a the given index</returns>
  GetProduction(index: int): LRProduction {
    return this.productions[index]!
  }

  /// <summary>
  /// Gets the expected terminals for the specified state
  /// </summary>
  /// <param name="state">The DFA state</param>
  /// <param name="terminals">The possible terminals</param>
  /// <returns>The expected terminals</returns>
  GetExpected(state: int, terminals: ROList<GSymbol>): LRExpected {
    const result = new LRExpected()
    let offset = this.ncols * state
    for (let i = 0; i < terminals.Count; ++i) {
      const action = this.table[offset]!
      if (action.Code == LRActionCode.Shift) {
        result.Shifts.push(terminals[i]!)
      } else if (action.Code == LRActionCode.Reduce) {
        result.Reductions.push(terminals[i]!)
      }
      offset++
    }
    return result
  }
}
