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
/// Represent a map from symbols' IDs to the index of their corresponding column in an LR table.
/// It is optimized for IDs from 0x0000 to 0x01FF (the first 512 symbols) with hope they are the most frequent.
/// </summary>
export class ColumnMap {
  /// <summary>
  /// Cache for ids from 0x00 to 0xFF
  /// </summary>
  private readonly cache1: int[]
  /// <summary>
  /// Cache for ids from 0x100 to 0x1FF
  /// </summary>
  private cache2?: int[]
  /// <summary>
  /// Hashmap for the other ids
  /// </summary>
  private others?: Map<int, int>;

  [key: int]: int

  /// <summary>
  /// Initializes the structure
  /// </summary>
  constructor() {
    this.cache1 = new Array(256).fill(0)

    return new Proxy(this, {
      /// <summary>
      /// Gets the data for the given key
      /// </summary>
      /// <param name="key">The key for the data</param>
      /// <returns>The data corresponding to the key</returns>
      get: (target, prop) => {
        const key = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
        if (typeof key === 'number' && !isNaN(key)) {
          if (key <= 0xff) {
            return this.cache1[key]
          } else if (key <= 0x1ff) {
            return this.cache2![key - 0x100]
          }
          return this.others!.get(key)
        }
        return (target as unknown as any)[prop]
      },
    })
  }

  /// <summary>
  /// Adds a new data in the collection with the given key
  /// </summary>
  /// <param name="key">The key for the data</param>
  /// <param name="value">The data</param>
  Add(key: int, value: int): void {
    if (key <= 0xff) {
      this.cache1[key] = value
    } else if (key <= 0x1ff) {
      if (this.cache2 == null) {
        this.cache2 = new Array(256)
        this.cache2.fill(0)
      }
      this.cache2[key - 0x100] = value
    } else {
      if (this.others == null) {
        this.others = new Map<int, int>()
      }
      this.others.set(key, value)
    }
  }
}
