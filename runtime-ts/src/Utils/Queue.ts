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
import { int } from "../BaseTypes"


export class Queue<T> implements Iterable<T> {
    /// <summary>
    /// The items of queue
    /// </summary>
    private items: T[]

    /// <summary>
    /// Initializes new queue
    /// </summary>
    constructor() {
        this.items = new Array<T>()
    }
    /// <summary>
    /// Returns count of items in the queue
    /// </summary>
    get Count(): int { return this.items.length }
    /// <summary>
    /// Returns true if the specified item contains in the queue
    /// </summary>
    Contains(item: T) {
        return this.items.includes(item)
    }
    /// <summary>
    /// Push new item to end of the queue
    /// </summary>
    Enqueue(item: T) {
        this.items.push(item)
    }
    /// <summary>
    /// Take item from front of the queue
    /// </summary>
    Dequeue() {
        return this.items.shift()
    }
    /// <summary>
    /// Get item of front of the queue without changing
    /// </summary>
    Peek() {
        return this.items[0]
    }

    [Symbol.iterator](): Iterator<T> {
        return this.items[Symbol.iterator]()
    }
}
