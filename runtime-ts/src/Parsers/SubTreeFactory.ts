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
import { Factory } from "../Utils/Factory"
import { Pool } from "../Utils/Pool"
import { SubTree } from "./SubTree"


/// <summary>
/// Represents of factory of sub-trees that have a specified capacity
/// </summary>
export class SubTreeFactory implements Factory<SubTree> {
	/// <summary>
	/// The capacity of the SubTrees produced by this factory
	/// </summary>
	private readonly capacity: int

	/// <summary>
	/// Initializes this SubTree factory
	/// </summary>
	/// <param name="capacity">The capacity of the produced SubTrees</param>
	constructor(capacity: int) {
		this.capacity = capacity
	}

	/// <summary>
	///  Creates a new object
	/// </summary>
	/// <param name="pool">The enclosing pool</param>
	/// <returns>The created object</returns>
	public CreateNew(pool: Pool<SubTree>): SubTree {
		return new SubTree(pool, this.capacity)
	}
}
