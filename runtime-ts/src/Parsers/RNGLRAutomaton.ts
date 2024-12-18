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
import { int, ushort } from "../BaseTypes"
import { IBinaryReader } from "../BinaryReader"
import { GSymbol } from "../GSymbol"
import { ROList } from "../Utils"
import { ColumnMap } from "./ColumnMap"
import { LRAction } from "./LRAction"
import { LRActionCode } from "./LRActionCode"
import { LRContexts } from "./LRContexts"
import { LRExpected } from "./LRExpected"
import { LRProduction } from "./LRProduction"


/// <summary>
/// Represents the RNGLR parsing table and productions
/// </summary>
/// <remarks>
/// Binary data of a RNGLR parser
/// --- header
/// uint16: index of the axiom's variable
/// uint16: number of columns
/// uint16: number of states
/// uint32: number of actions
/// uint16: number of productions
/// uint16: number of null productions
/// --- parse table columns
/// uint16: sid of the column
/// --- parse table
/// See RNGLRTable
/// --- action table
/// See LRActions
/// --- productions table
/// See LRProduction
/// --- null production table
/// indices of the null productions
/// </remarks>
export class RNGLRAutomaton {
	/// <summary>
	/// Index of the axiom variable
	/// </summary>
	private readonly axiom: int
	/// <summary>
	/// The number of columns in the LR table
	/// </summary>
	private readonly ncols: ushort
	/// <summary>
	/// The number of states in the automaton
	/// </summary>
	private readonly nstates: int
	/// <summary>
	/// Map of symbol ID to column index in the LR table
	/// </summary>
	private readonly columns: ColumnMap
	/// <summary>
	/// The contexts information
	/// </summary>
	private readonly contexts: LRContexts[]
	/// <summary>
	/// The RNGLR table
	/// </summary>
	private readonly table: RNGLRAutomaton.Cell[]
	/// <summary>
	/// The action table
	/// </summary>
	private readonly actions: LRAction[]
	/// <summary>
	/// The table of LR productions
	/// </summary>
	private readonly productions: LRProduction[]
	/// <summary>
	/// The table of nullable variables
	/// </summary>
	private readonly nullables: ushort[]

	/// <summary>
	/// Gets the index of the axiom
	/// </summary>
	get Axiom(): int { return this.axiom }

	/// <summary>
	/// Gets the number of states in the RNGLR table
	/// </summary>
	get StatesCount(): int { return this.nstates }

	/// <summary>
	/// Initializes a new automaton from the given binary stream
	/// </summary>
	/// <param name="reader">The binary stream to load from</param>
	constructor(reader: IBinaryReader) {
		this.axiom = reader.ReadUInt16()
		this.ncols = reader.ReadUInt16()
		this.nstates = reader.ReadUInt16()

		const nactions = reader.ReadUInt32()
		const nprod = reader.ReadUInt16()
		const nnprod = reader.ReadUInt16()

		this.columns = new ColumnMap()
		for (let i = 0; i < this.ncols; ++i) {
			this.columns.Add(reader.ReadUInt16(), i)
		}
		this.contexts = new Array<LRContexts>(this.nstates)
		for (let i = 0; i < this.nstates; ++i) {
			this.contexts[i] = new LRContexts(reader)
		}
		this.table = new Array<RNGLRAutomaton.Cell>(this.nstates * this.ncols)
		for (let i = 0; i < this.table.length; ++i) {
			this.table[i] = new RNGLRAutomaton.Cell(reader)
		}
		this.actions = new Array<LRAction>(nactions)
		for (let i = 0; i < nactions; ++i) {
			this.actions[i] = new LRAction(reader)
		}
		this.productions = new Array<LRProduction>(nprod)
		for (let i = 0; i < nprod; ++i) {
			this.productions[i] = new LRProduction(reader)
		}
		this.nullables = new Array<ushort>(nnprod)
		for (let i = 0; i < nnprod; ++i) {
			this.nullables[i] = reader.ReadUInt16()
		}
	}

	/// <summary>
	/// Gets the contexts opened by the specified state
	/// </summary>
	/// <param name="state">State in the LR(k) automaton</param>
	/// <returns>The opened contexts</returns>
	GetContexts(state: int): LRContexts {
		return this.contexts[state]!
	}

	/// <summary>
	/// Gets the number of GLR actions for the given state and sid
	/// </summary>
	/// <param name="state">An automaton's state</param>
	/// <param name="sid">A symbol ID</param>
	/// <returns>The number of GLR actions</returns>
	GetActionsCount(state: int, sid: int): int {
		return this.table[state * this.ncols + this.columns[sid]!]!.ActionsCount
	}

	/// <summary>
	/// Gets the i-th GLR action for the given state and sid
	/// </summary>
	/// <param name="state">An automaton's state</param>
	/// <param name="sid">A symbol ID</param>
	/// <param name="index">The action index</param>
	/// <returns>The GLR action</returns>
	GetAction(state: int, sid: int, index: int): LRAction {
		return this.actions[this.table[state * this.ncols + this.columns[sid]!]!.ActionsIndex + index]!
	}

	/// <summary>
	/// Gets the production at the given index
	/// </summary>
	/// <param name="index">Production's index</param>
	/// <returns>The production a the given index</returns>
	GetProduction(index: int): LRProduction {
		return this.productions[index]!
	}

	/// <summary>
	/// Gets the production for the nullable variable with the given index
	/// </summary>
	/// <param name="index">Index of a nullable variable</param>
	/// <returns>The production, or <c>null</c> if the variable is not nullable</returns>
	GetNullableProduction(index: int): LRProduction | null {
		const temp = this.nullables[index]!
		return temp === 0xFFFF ? null : this.productions[temp]!
	}

	/// <summary>
	/// Determine whether the given state is the accepting state
	/// </summary>
	/// <param name="state">An automaton's state</param>
	/// <returns>True if the state is the accepting state, false otherwise</returns>
	IsAcceptingState(state: int): boolean {
		return (this.table[state * this.ncols]!.ActionsCount === 1) && (this.actions[this.table[state * this.ncols]!.ActionsIndex]!.Code === LRActionCode.Accept)
	}

	/// <summary>
	/// Gets the expected terminals for the specified state
	/// </summary>
	/// <param name="state">The DFA state</param>
	/// <param name="terminals">The possible terminals</param>
	/// <returns>The expected terminals</returns>
	GetExpected(state: int, terminals: ROList<GSymbol>): LRExpected {
		const result = new LRExpected()
		for (let i = 0; i < terminals.Count; ++i) {
			const cell = this.table[state * this.ncols + i]!
			for (let j = 0; j < cell.ActionsCount; ++j) {
				const action = this.actions[cell.ActionsIndex + j]!
				if (action.Code === LRActionCode.Shift) {
					result.AddUniqueShift(terminals[i]!)
				}
				else if (action.Code === LRActionCode.Reduce) {
					result.AddUniqueReduction(terminals[i]!)
				}
			}
		}
		return result
	}
}

export namespace RNGLRAutomaton {
	/// <summary>
	/// Represents a cell in a RNGLR parse table
	/// </summary>
	export class Cell {
		/// <summary>
		/// The number of actions in this cell
		/// </summary>
		private readonly count: int
		/// <summary>
		/// Index of the cell's data
		/// </summary>
		private readonly index: int

		/// <summary>
		/// Gets the number of actions in the cell
		/// </summary>
		get ActionsCount(): int { return this.count }

		/// <summary>
		/// Gets the index of the first action in the Actions table
		/// </summary>
		get ActionsIndex(): int { return this.index }

		constructor(input: IBinaryReader) {
			this.count = input.ReadUInt16()
			this.index = input.ReadUInt32()
		}
	}
}