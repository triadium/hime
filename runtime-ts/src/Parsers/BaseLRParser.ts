/*******************************************************************************
 * Copyright (c) 2017 Association Cénotélie (cenotelie.fr)
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
import { GSymbol } from "../GSymbol"
import { BaseLexer } from "../Lexer/BaseLexer"
import { ParseError } from "../ParseError"
import { ParseResult } from "../ParseResult"
import { SemanticAction } from "../SemanticAction"
import { ROList } from "../Utils"


/// <summary>
/// Represents a base LR parser
/// </summary>
export abstract class BaseLRParser {
	/// <summary>
	/// Maximum number of errors
	/// </summary>
	protected static readonly MAX_ERROR_COUNT: int = 100
	/// <summary>
	/// The default value of the recover mode
	/// </summary>
	protected static readonly DEFAULT_MODE_RECOVER = true
	/// <summary>
	/// The default value of the debug mode
	/// </summary>
	protected static readonly DEFAULT_MODE_DEBUG = false

	/// <summary>
	/// Parser's variable symbols
	/// </summary>
	protected readonly symVariables: ROList<GSymbol>
	/// <summary>
	/// Parser's virtual symbols
	/// </summary>
	protected readonly symVirtuals: ROList<GSymbol>
	/// <summary>
	/// Parser's action symbols
	/// </summary>
	protected readonly symActions: ROList<SemanticAction>
	/// <summary>
	/// List of the encountered syntaxic errors
	/// </summary>
	protected readonly allErrors: Array<ParseError>
	/// <summary>
	/// Lexer associated to this parser
	/// </summary>
	protected readonly lexer: BaseLexer


	/// <summary>
	/// Gets the variable symbols used by this parser
	/// </summary>
	get SymbolVariables(): ROList<GSymbol> { return this.symVariables }

	/// <summary>
	/// Gets the virtual symbols used by this parser
	/// </summary>
	get SymbolVirtuals(): ROList<GSymbol> { return this.symVirtuals }

	/// <summary>
	/// Gets the action symbols used by this parser
	/// </summary>
	get SymbolActions(): ROList<SemanticAction> { return this.symActions }

	/// <summary>
	/// Gets or sets whether the paser should try to recover from errors
	/// </summary>
	ModeRecoverErrors: boolean

	/// <summary>
	/// Gets or sets a value indicating whether this parser is in debug mode
	/// </summary>
	ModeDebug: boolean

	/// <summary>
	/// Initializes a new instance of the LRkParser class with the given lexer
	/// </summary>
	/// <param name="variables">The parser's variables</param>
	/// <param name="virtuals">The parser's virtuals</param>
	/// <param name="actions">The parser's actions</param>
	/// <param name="lexer">The input lexer</param>
	protected constructor(variables: GSymbol[], virtuals: GSymbol[], actions: SemanticAction[] | null, lexer: BaseLexer) {
		this.ModeRecoverErrors = BaseLRParser.DEFAULT_MODE_RECOVER
		this.ModeDebug = BaseLRParser.DEFAULT_MODE_DEBUG

		this.symVariables = new ROList<GSymbol>([...variables])
		this.symVirtuals = new ROList<GSymbol>([...virtuals])

		this.symActions = new ROList<SemanticAction>(actions != null ? [...actions] : new Array<SemanticAction>())

		this.allErrors = new Array<ParseError>()
		this.lexer = lexer
		this.lexer.OnError = this.OnLexicalError
	}

	/// <summary>
	/// Adds the given lexical error emanating from the lexer to the list of errors
	/// </summary>
	/// <param name="error">Lexical error</param>
	protected OnLexicalError(error: ParseError): void {
		this.allErrors.push(error)
	}

	/// <summary>
	/// Parses the input and returns the result
	/// </summary>
	/// <returns>A ParseResult object containing the data about the result</returns>
	public abstract Parse(): ParseResult
}

