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
import { ArrayCopy } from "../Utils"


/// <summary>
/// Represents a path in a GSS
/// </summary>
export class GSSPath {
	/// <summary>
	/// The initial size of the label buffer
	/// </summary>
	private static readonly INIT_BUFFER_SIZE = 64

	/// <summary>
	/// The labels on this GSS path
	/// </summary>
	private labels: int[] | null

	/// <summary>
	/// Gets or sets the final target of this path
	/// </summary>
	Last: int


	/// <summary>
	/// Gets or sets the generation containing the final target of this path
	/// </summary>
	Generation: int



	// 	public int this[int index]
	// {
	// 			get { return labels[index]; }
	// 			set { labels[index] = value; }
	// }

	[index: int]: int

	/// <summary>
	/// Initializes this path
	/// </summary>
	constructor(length?: int) {
		const self = this

		this.Last = 0;
		this.Generation = 0
		this.labels = length ? new Array<int>(length < GSSPath.INIT_BUFFER_SIZE ? GSSPath.INIT_BUFFER_SIZE : length) : null

		return new Proxy(this, {
			/// <summary>
			/// Gets or sets the i-th label of the edges traversed by this path
			/// </summary>
			get(target, prop) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					return self.labels![index]
				}
				return (target as unknown as any)[prop]
			},
			set(target, prop, value) {
				const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
				if (typeof index === 'number' && !isNaN(index)) {
					self.labels![index] = value
				}
				else {
					(target as unknown as any)[prop] = value
				}
				return true
			}
		})
	}

	/// <summary>
	/// Ensure the specified length of the label buffer
	/// </summary>
	/// <param name="length">The required length</param>
	Ensure(length: int): void {
		if (length > this.labels!.length) {
			this.labels = new Array<int>(length)
		}
	}

	/// <summary>
	/// Copy the content of another path to this one
	/// </summary>
	/// <param name="path">The path to copy</param>
	/// <param name="length">The path's length</param>
	CopyLabelsFrom(path: GSSPath, length: int): void {
		ArrayCopy(path.labels!, 0, this.labels!, 0, length)
	}
}
