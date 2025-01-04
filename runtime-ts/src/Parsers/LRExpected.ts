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
import { GSymbol } from '../GSymbol'

/// <summary>
/// Container for the expected terminals for a LR state
/// </summary>
export class LRExpected {
  /// <summary>
  /// The terminals expected for shift actions
  /// </summary>
  private readonly shifts: Array<GSymbol>
  /// <summary>
  /// The terminals expected for reduction actions
  /// </summary>
  private readonly reductions: Array<GSymbol>

  /// <summary>
  /// Gets the terminals expected for shift actions
  /// </summary>
  get Shifts(): Array<GSymbol> {
    return this.shifts
  }

  /// <summary>
  /// Gets the terminals expected for a reduction actions
  /// </summary>
  get Reductions(): Array<GSymbol> {
    return this.reductions
  }

  /// <summary>
  /// Initializes this container
  /// </summary>
  constructor() {
    this.shifts = new Array<GSymbol>()
    this.reductions = new Array<GSymbol>()
  }

  /// <summary>
  /// Adds the specified terminal as expected on a shift action
  /// </summary>
  /// <param name="terminal">The terminal</param>
  /// <remarks>
  /// If the terminal is already added to the reduction collection it is removed from it.
  /// </remarks>
  AddUniqueShift(terminal: GSymbol): void {
    const itod = this.reductions.indexOf(terminal)
    if (itod > -1) {
      this.reductions.splice(itod, 1)
    }

    if (!this.shifts.includes(terminal)) {
      this.shifts.push(terminal)
    }
  }

  /// <summary>
  /// Adds the specified terminal as expected on a reduction action
  /// </summary>
  /// <param name="terminal">The terminal</param>
  /// <remarks>
  /// If the terminal is in the shift collection, nothing happens.
  /// </remarks>
  AddUniqueReduction(terminal: GSymbol): void {
    if (!this.shifts.includes(terminal) && !this.reductions.includes(terminal)) {
      this.reductions.push(terminal)
    }
  }
}
