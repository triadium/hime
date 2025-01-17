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

export type ubyte = number
export type byte = number
export type ushort = number
export type short = number
export type uint = number
export type int = number
export type ulong = bigint
export type long = bigint

export type char = ushort

export class UInt {
  static from(x: number): uint {
    return x >>> 0
  }
}

export class Int {
  static from(x: number): int {
    return x >> 0
  }
}

export class UShort {
  static from(x: number): ushort {
    return (x >> 0) & 0xffff
  }
}

export class Short {
  static from(x: number): short {
    return (x << 16) >> 16
  }
}
