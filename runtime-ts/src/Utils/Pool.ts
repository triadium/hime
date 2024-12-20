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

import { Factory } from './Factory'

/// <summary>
/// Represents a pool of reusable objects
/// </summary>
/// <typeparam name="T">Type of the pooled objects</typeparam>
export class Pool<T> {
  /// <summary>
  /// The factory for this pool
  /// </summary>
  private readonly factory: Factory<T>

  /// <summary>
  /// Cache of the free objects in this pool
  /// </summary>
  private free: T[]

  /// <summary>
  /// Index of the next free object in this pool
  /// </summary>
  private nextFree: int

  /// <summary>
  /// Total number of objects in this pool
  /// </summary>
  private allocated: int

  /// <summary>
  /// Initializes the pool
  /// </summary>
  /// <param name="factory">The factory for the pooled objects</param>
  /// <param name="initSize">The initial size of the pool</param>
  constructor(factory: Factory<T>, initSize: int) {
    this.factory = factory
    this.free = new Array<T>(initSize)
    this.nextFree = -1
    this.allocated = 0
  }

  /// <summary>
  /// Acquires an object from this pool
  /// </summary>
  /// <returns>An object from this pool</returns>
  Acquire(): T {
    if (this.nextFree === -1) {
      // No free object => create new one
      const result = this.factory.CreateNew(this)
      this.allocated++
      return result
    } else {
      // Gets a free object from the top of the pool
      return this.free[this.nextFree--]!
    }
  }

  /// <summary>
  /// Returns the given object to this pool
  /// </summary>
  /// <param name="obj">The returned object</param>
  Return(obj: T): void {
    this.nextFree++
    if (this.nextFree === this.free.length && this.allocated > this.nextFree) {
      this.free.length = this.allocated
    }
    this.free[this.nextFree] = obj
  }
}
