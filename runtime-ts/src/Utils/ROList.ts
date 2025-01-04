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
/// Represents a lightweight interface for a readonly list of T elements
/// </summary>
/// <typeparam name="T">The type of elements in this list</typeparam>
export class ROList<T> {
  /// <summary>
  /// The inner data set
  /// </summary>
  private readonly inner: ReadonlyArray<T>

  /// <summary>
  /// The index signature
  /// </summary>
  readonly [n: number]: T

  /// <summary>
  /// Gets the number of elements in this list
  /// </summary>
  get Count(): int {
    return this.inner.length
  }

  /// <summary>
  /// Initializes this list
  /// </summary>
  /// <param name="original">The original items</param>
  constructor(original: Array<T>) {
    this.inner = original
    return new Proxy(this, {
      /// <summary>
      /// Gets the element at the specified index
      /// </summary>
      /// <param name="index">An index in this list</param>
      get: (target, prop) => {
        if (typeof prop === 'string' && !isNaN(parseInt(prop, 10))) {
          // FIXME: self.inner.at(index)
          return this.inner[prop as unknown as number]
        }
        return (target as unknown as any)[prop]
      },
    })
  }

  /// <summary>
  /// Determines whether this list contains the specified item
  /// </summary>
  /// <param name="item">The item to look for</param>
  /// <returns><c>true</c> if the item is in this list</returns>
  Contains(item: T): boolean {
    return this.inner.includes(item)
  }

  /// <summary>
  /// Determines the index of the specified item in this list
  /// </summary>
  /// <param name="item">The item to look for</param>
  /// <returns>The index of the specified item, or -1</returns>
  IndexOf(item: T): int {
    return this.inner.indexOf(item)
  }

  /// <summary>
  /// Gets the iterator
  /// </summary>
  /// <returns>The iterator</returns>
  [Symbol.iterator](): ArrayIterator<T> {
    return this.inner[Symbol.iterator]()
  }
}
