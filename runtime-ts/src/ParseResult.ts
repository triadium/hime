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
import { AST } from './AST'
import { ASTNode } from './ASTNode'
import { int } from './BaseTypes'
import { ParseError } from './ParseError'
import { Text } from './Text'
import { TextPosition } from './TextPosition'
import { Token } from './Token'
import { ROList } from './Utils'

/// <summary>
/// Represents the output of a parser
/// </summary>
export class ParseResult {
  private errors: ROList<ParseError>
  private text: Text
  private ast?: AST | undefined

  /// <summary>
  /// Initializes this result as a success with the given AST
  /// </summary>
  /// <param name="errors">The list of errors</param>
  /// <param name="text">The parsed text</param>
  /// <param name="ast">The produced AST</param>
  constructor(errors: ROList<ParseError>, text: Text, ast?: AST | undefined) {
    this.errors = errors
    this.text = text
    this.ast = ast
  }

  /// <summary>
  /// Gets whether the parser was successful
  /// </summary>
  get IsSuccess(): boolean {
    return this.ast != null
  }

  /// <summary>
  /// Gets a list of the parsing errors
  /// </summary>
  get Errors(): ROList<ParseError> {
    return this.errors
  }

  /// <summary>
  /// Gets the text that has been parsed
  /// </summary>
  get Input(): Text {
    return this.text
  }

  /// <summary>
  /// Gets the root of the produced parse tree
  /// </summary>
  get Root(): ASTNode {
    if (this.ast == null) return new ASTNode()
    return this.ast.Root
  }

  /// <summary>
  /// Gets the token (if any) that contains the specified index in the input text
  /// </summary>
  /// <param name="index">An index within the input text</param>
  /// <returns>The token, if any</returns>
  FindTokenAt(index: int): Token | null {
    if (this.ast == null) {
      return null
    }
    return this.ast.FindTokenAt(index)
  }

  /// <summary>
  /// Gets the token (if any) that contains the specified position in the input text
  /// </summary>
  /// <param name="position">A position within the input text</param>
  /// <returns>The token, if any</returns>
  FindTokenAtPosition(position: TextPosition): Token | null {
    if (this.ast == null) {
      return null
    }
    const index = this.text.GetLineIndex(position.Line) + position.Column - 1
    return this.ast.FindTokenAt(index)
  }

  /// <summary>
  /// Gets the AST node (if any) that has the specified token as label
  /// </summary>
  /// <param name="token">The token to look for</param>
  /// <returns>The AST node, if any</returns>
  FindNodeFor(token: Token): ASTNode | null {
    if (this.ast == null) {
      return null
    }
    return this.ast.FindNodeFor(token)
  }

  /// <summary>
  /// Gets the AST node (if any) that has a token label that contains the specified index in the input text
  /// </summary>
  /// <param name="index">An index within the input text</param>
  /// <returns>The AST node, if any</returns>
  FindNodeAt(index: int): ASTNode | null {
    if (this.ast == null) {
      return null
    }
    const token = this.FindTokenAt(index)
    return token != null ? this.ast.FindNodeFor(token) : null
  }

  /// <summary>
  /// Gets the AST node (if any) that has a token label that contains the specified position in the input text
  /// </summary>
  /// <param name="position">A position within the input text</param>
  /// <returns>The AST node, if any</returns>
  FindNodeAtPosition(position: TextPosition): ASTNode | null {
    if (this.ast == null) {
      return null
    }
    const token = this.FindTokenAtPosition(position)
    return token != null ? this.ast.FindNodeFor(token) : null
  }
}
