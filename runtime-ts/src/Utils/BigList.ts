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
import { ArrayCopy } from "./ArrayCopy"

/// <summary>
/// Represents a list of items that is efficient in storage and addition.
/// Items cannot be removed or inserted.
/// </summary>
/// <typeparam name="T">The type of the stored items</typeparam>
/// <remarks>
/// The internal representation is an array of pointers to arrays of T.
/// The basic arrays of T (chunks) have a fixed size.
/// </remarks>
export class BigList<T> {
	/// <summary>
	/// The number of bits allocated to the lowest part of the index (within a chunk)
	/// </summary>
	private static readonly UPPER_SHIFT: int = 8
	/// <summary>
	/// The size of the chunks
	/// </summary>
	private static readonly CHUNKS_SIZE: int = 1 << BigList.UPPER_SHIFT
	/// <summary>
	/// Bit mask for the lowest part of the index (within a chunk)
	/// </summary>
	private static readonly LOWER_MASK: int = BigList.CHUNKS_SIZE - 1
	/// <summary>
	/// Initial size of the higer array (pointers to the chunks)
	/// </summary>
	private static readonly INIT_CHUNK_COUNT: int = BigList.CHUNKS_SIZE

	/// <summary>
	/// The data
	/// </summary>
	private chunks: T[][]
	/// <summary>
	/// The index of the current chunk
	/// </summary>
	private chunkIndex: int
	/// <summary>
	/// The index of the next available cell within the current chunk
	/// </summary>
	private cellIndex: int

	/// <summary>
	/// Gets or sets the value of the item at the given index
	/// </summary>
	/// <param name="index">Index of an item</param>
	/// <returns>The value of the item at the given index</returns>
	[n: number]: T

	/// <summary>
	/// Initializes this list
	/// </summary>
	constructor() {
		const self = this

		this.chunks = new Array<T[]>(BigList.INIT_CHUNK_COUNT)
		this.chunks[0] = new Array<T>(BigList.CHUNKS_SIZE)
		this.chunkIndex = 0
		this.cellIndex = 0

		return new Proxy(this, {
			get(target, prop) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					return self.chunks[index >> BigList.UPPER_SHIFT]![index & BigList.LOWER_MASK]
				}
				return (target as unknown as any)[prop]
			},
			set(target, prop, value) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					self.chunks[index >> BigList.UPPER_SHIFT]![index & BigList.LOWER_MASK] = value
				}
				else {
					(target as unknown as any)[prop] = value
				}
				return true
			}
		})
	}

	/// <summary>
	/// Gets the size of this list
	/// </summary>
	get Size() {
		return (this.chunkIndex * BigList.CHUNKS_SIZE) + this.cellIndex
	}

	/// <summary>
	/// Copies the specified range of items to the given buffer
	/// </summary>
	/// <param name="index">The starting index of the range of items to copy</param>
	/// <param name="count">The size of the range of items to copy</param>
	/// <param name="buffer">The buffer to copy the items in</param>
	/// <param name="start">The starting index within the buffer to copy the items to</param>
	CopyTo(index: int, count: int, buffer: T[], start: int): void {
		let indexUpper = index >> BigList.UPPER_SHIFT
		let indexLower = index & BigList.LOWER_MASK
		while (indexLower + count >= BigList.CHUNKS_SIZE) {
			// while we can copy chunks
			const length = BigList.CHUNKS_SIZE - indexLower
			ArrayCopy(this.chunks[indexUpper]!, indexLower, buffer, start, length)
			count -= length
			start += length
			indexUpper++
			indexLower = 0
		}
		if (count > 0) {
			ArrayCopy(this.chunks[indexUpper]!, indexLower, buffer, start, count)
		}
	}

	/// <summary>
	/// Adds the given value at the end of this list
	/// </summary>
	/// <param name="value">The value to add</param>
	/// <returns>The index of the value in this list</returns>
	Add(value: T): int {
		if (this.cellIndex === BigList.CHUNKS_SIZE) { this.AddChunk() }

		this.chunks[this.chunkIndex]![this.cellIndex] = value
		const index = (this.chunkIndex << BigList.UPPER_SHIFT | this.cellIndex)
		this.cellIndex++
		return index
	}

	/// <summary>
	/// Copies the given values at the end of this list
	/// </summary>
	/// <param name="values">The values to add</param>
	/// <param name="index">The starting index of the values to store</param>
	/// <param name="length">The number of values to store</param>
	/// <returns>The index within this list at which the values have been added</returns>
	Push(values: T[], index: int, length: int): int {
		const start = this.Size
		if (length > 0) {
			this.DoCopy(values, index, length)
		}
		return start
	}

	/// <summary>
	/// Copies the values from the given index at the end of the list
	/// </summary>
	/// <param name="from">The index to start copy from</param>
	/// <param name="count">The number of items to copy</param>
	/// <returns>The index within this list at which the values have been copied to</returns>
	Duplicate(from: int, count: int): int {
		const start = this.Size
		if (count <= 0) { return start }

		let chunk = from >> BigList.UPPER_SHIFT     // The current chunk to copy from
		let cell = from & BigList.LOWER_MASK        // The current starting index in the chunk

		while (cell + count > BigList.CHUNKS_SIZE) {
			this.DoCopy(this.chunks[chunk]!, cell, BigList.CHUNKS_SIZE - cell)
			count -= BigList.CHUNKS_SIZE - cell
			chunk++
			cell = 0
		}
		this.DoCopy(this.chunks[chunk]!, cell, count)

		return start
	}

	/// <summary>
	/// Removes the specified number of values from the end of this list
	/// </summary>
	/// <param name="count">The number of values to remove</param>
	Remove(count: int): void {
		this.chunkIndex -= count >> BigList.UPPER_SHIFT
		this.cellIndex -= count & BigList.LOWER_MASK
	}

	/// <summary>
	/// Copies the given values at the end of this list
	/// </summary>
	/// <param name="values">The values to add</param>
	/// <param name="index">The starting index of the values to store</param>
	/// <param name="length">The number of values to store</param>
	DoCopy(values: T[], index: int, length: int): void {
		while (this.cellIndex + length > BigList.CHUNKS_SIZE) {
			const count = BigList.CHUNKS_SIZE - this.cellIndex
			if (count === 0) {
				this.AddChunk()
				continue
			}
			ArrayCopy(values, index, this.chunks[this.chunkIndex]!, this.cellIndex, count)
			index += count
			length -= count
			this.AddChunk()
		}
		ArrayCopy(values, index, this.chunks[this.chunkIndex]!, this.cellIndex, length)
		this.cellIndex += length
	}

	/// <summary>
	/// Adds a new (empty) chunk of cells
	/// </summary>
	AddChunk(): void {
		if (this.chunkIndex == this.chunks.length - 1) {
			this.chunks.length = this.chunks.length + BigList.INIT_CHUNK_COUNT
		}
		this.chunkIndex++
		let chunk = this.chunks[this.chunkIndex]
		if (chunk == null) {
			chunk = new Array<T>(BigList.CHUNKS_SIZE)
			this.chunks[this.chunkIndex] = chunk
		}
		this.cellIndex = 0
	}
}
