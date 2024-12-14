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
import { Pool } from "./Pool"


/// <summary>
/// Represents a factory of objects for a pool
/// </summary>
/// <typeparam name="T">The type of the pooled objects</typeparam>
export interface Factory<T> {
	/// <summary>
	/// Creates a new object
	/// </summary>
	/// <param name="pool">The enclosing pool</param>
	/// <returns>The created object</returns>
	CreateNew(pool: Pool<T>): T
}

