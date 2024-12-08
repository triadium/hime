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

namespace Hime.Redist {
    export interface IBinaryReader {
        ReadUInt8(): ubyte
        ReadUInt16(): ushort
        ReadUInt32(): uint
        ReadUInt64(): ulong
        ReadInt8(): byte
        ReadInt16(): short
        ReadInt32(): int
        ReadInt64(): long
        Length: int
    }

    class BigBinaryReader implements IBinaryReader {
        private buffer: Buffer
        private index: number

        constructor(buffer: string | Buffer, encoding: BufferEncoding) {
            this.index = 0
            this.buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, encoding)
        }

        get Length() { return this.buffer.length }

        ReadUInt8(): ubyte {
            const v = this.buffer.readUInt8(this.index)
            this.index++
            return v
        }
        ReadUInt16(): ushort {
            const v = this.buffer.readUInt16BE(this.index)
            this.index += 2
            return v
        }
        ReadUInt32(): uint {
            const v = this.buffer.readUInt32BE(this.index)
            this.index += 4
            return v
        }
        ReadUInt64(): ulong {
            const v = this.buffer.readBigUInt64BE(this.index)
            this.index += 8
            return v
        }
        ReadInt8(): byte {
            const v = this.buffer.readInt8(this.index)
            this.index++
            return v
        }
        ReadInt16(): short {
            const v = this.buffer.readInt16BE(this.index)
            this.index += 2
            return v
        }
        ReadInt32(): int {
            const v = this.buffer.readInt32BE(this.index)
            this.index += 4
            return v
        }
        ReadInt64(): long {
            const v = this.buffer.readBigInt64BE(this.index)
            this.index += 8
            return v
        }
    }

    class LittleBinaryReader implements IBinaryReader {
        private buffer: Buffer
        private index: number

        constructor(buffer: string | Buffer, encoding: BufferEncoding) {
            this.buffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, encoding)
            this.index = buffer.length > 0 ? 0 : Number.MAX_SAFE_INTEGER
        }

        get Length() { return this.buffer.length }

        ReadUInt8(): ubyte {
            const v = this.buffer.readUInt8(this.index)
            this.index++
            return v
        }
        ReadUInt16(): ushort {
            const v = this.buffer.readUInt16LE(this.index)
            this.index += 2
            return v
        }
        ReadUInt32(): uint {
            const v = this.buffer.readUInt32LE(this.index)
            this.index += 4
            return v
        }
        ReadUInt64(): ulong {
            const v = this.buffer.readBigUInt64LE(this.index)
            this.index += 8
            return v
        }
        ReadInt8(): byte {
            const v = this.buffer.readInt8(this.index)
            this.index++
            return v
        }
        ReadInt16(): short {
            const v = this.buffer.readInt16LE(this.index)
            this.index += 2
            return v
        }
        ReadInt32(): int {
            const v = this.buffer.readInt32LE(this.index)
            this.index += 4
            return v
        }
        ReadInt64(): long {
            const v = this.buffer.readBigInt64LE(this.index)
            this.index += 8
            return v
        }
    }

    export class BinaryReader {
        static Create(buffer: string | Buffer, encoding: BufferEncoding, endianness: 'little' | 'big' = 'little'): IBinaryReader {
            switch (endianness) {
                case 'little': return new LittleBinaryReader(buffer, encoding)
                case 'big': return new BigBinaryReader(buffer, encoding)
            }
        }
    }
}