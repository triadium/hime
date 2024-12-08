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


/// <summary>
/// Represents a type of table
/// </summary>
export enum TableType /*: byte*/ {
	/// <summary>
	/// Marks as other (used for SPPF nodes)
	/// </summary>
	None = 0,
	/// <summary>
	/// Table of tokens
	/// </summary>
	Token = 1,
	/// <summary>
	/// Table of variables
	/// </summary>
	Variable = 2,
	/// <summary>
	/// Tables of virtuals
	/// </summary>
	Virtual = 3
}
