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


/// <summary>
/// Fast reusable buffer
/// </summary>
/// <typeparam name="T">The type of elements in this buffer</typeparam>
export class Buffer<T> {
	/// <summary>
	/// The inner data backing this buffer
	/// </summary>
	private inner: T[]
	/// <summary>
	/// The number of elements in this buffer
	/// </summary>
	private size: int

	/// <summary>
	/// Gets the number of elements in this buffer
	/// </summary>
	get Size(): int { return this.size }

	[index: int]: T

	/// <summary>
	/// Initializes this buffer
	/// </summary>
	/// <param name="capacity">The initial capacity</param>
	constructor(capacity: int) {
		const self = this

		this.inner = new Array<T>(capacity)
		this.size = 0

		return new Proxy(this, {
			/// <summary>
			/// Gets the i-th element of this buffer
			/// </summary>
			/// <param name="index">Index within this buffer</param>
			/// <returns>The i-th element</returns>
			get(target, prop) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					return self.inner[index]
				}
				return (target as unknown as any)[prop]
			}
		})
	}

	/// <summary>
	/// Resets the content of this buffer
	/// </summary>
	Reset(): void {
		this.size = 0
	}

	/// <summary>
	/// Adds an element to this buffer
	/// </summary>
	/// <param name="element">An element</param>
	Add(element: T): void {
		if (this.size === this.inner.length) {
			this.inner.length *= 2
		}
		this.inner[this.size] = element
		this.size++
	}
}

