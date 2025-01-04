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
import { readFile } from 'fs/promises'

import { ASTNode, BaseLRParser, int } from 'hime-redist-ts'

import { ExpectedTreeParser } from './expected-tree.parser'

/// <summary>
/// The main program for the executor
/// </summary>
export class Executor {
  /// <summary>
  /// The parser must produce an AST that matches the expected one
  /// </summary>
  private static readonly VERB_MATCHES = 'matches'
  /// <summary>
  /// The parser must produce an AST that do NOT match the expected one
  /// </summary>
  private static readonly VERB_NOMATCHES = 'nomatches'
  /// <summary>
  /// The parser must fail
  /// </summary>
  private static readonly VERB_FAILS = 'fails'
  /// <summary>
  /// The parser have the specified output
  /// </summary>
  private static readonly VERB_OUTPUTS = 'outputs'

  /// <summary>
  /// The test was successful
  /// </summary>
  private static readonly RESULT_SUCCESS: int = 0
  /// <summary>
  /// The test failed in the end
  /// </summary>
  private static readonly RESULT_FAILURE_VERB: int = 1
  /// <summary>
  /// The test failed in its parsing phase
  /// </summary>
  private static readonly RESULT_FAILURE_PARSING: int = 2

  /// <summary>
  /// The entry point of the program, where the program control starts and ends.
  /// </summary>
  /// <param name="args">The command-line arguments.</param>
  /// <returns>The success or failure of the test</returns>
  /// <remarks>
  /// Expected arguments are:
  /// * The parser's name
  /// * A verb specifying the type of test, one of: matches, nomatches, fails
  /// </remarks>
  static async Run(args: string[]): Promise<int> {
    const parserName = args[0]
    const verb = args[1]
    return this.Execute(parserName, verb)
  }

  /// <summary>
  /// Executes the specified test
  /// </summary>
  /// <param name="parserName">The parser's name</param>
  /// <param name="verb">A verb specifying the type of test</param>
  /// <returns>The test result</returns>
  static async Execute(parserName: string, verb: string): Promise<int> {
    const input = await readFile('input.txt', { encoding: 'utf8' })
    const parser: BaseLRParser = await Executor.GetParser(parserName, input)

    console.log(`=>|${input}|`)

    switch (verb) {
      case Executor.VERB_MATCHES:
        return Executor.TestMatches(parser)
      case Executor.VERB_NOMATCHES:
        return Executor.TestNoMatches(parser)
      case Executor.VERB_FAILS:
        return Executor.TestFails(parser)
      case Executor.VERB_OUTPUTS:
        return Executor.TestOutputs(parser)
    }
    return Executor.RESULT_FAILURE_VERB
  }

  /// <summary>
  /// Gets the serialized expected AST
  /// </summary>
  /// <returns>The expected AST, or null if an error occurred</returns>
  private static async GetExpectedAST(): Promise<ASTNode | null> {
    const expectedText = await readFile('expected.txt', { encoding: 'utf-8' })
    const expectedParser = await ExpectedTreeParser.fromString(expectedText)
    const result = expectedParser.Parse()
    for (const error of result.Errors) {
      console.log(error)
      const context = result.Input.GetContext(error.Position)
      console.log(context.Content)
      console.log(context.Pointer)
    }
    return result.Errors.Count > 0 ? null : result.Root
  }

  /// <summary>
  /// Gets the serialized expected output
  /// </summary>
  /// <returns>The expected output lines</returns>
  private static async GetExpectedOutput(): Promise<string[]> {
    return (await readFile('expected.txt', { encoding: 'utf-8' })).split('\n')
  }

  /// <summary>
  /// Executes the test as a parsing test with a matching condition
  /// </summary>
  /// <param name="parser">The parser to use</param>
  /// <returns>The test result</returns>
  private static async TestMatches(parser: BaseLRParser): Promise<int> {
    const expected = await this.GetExpectedAST()
    console.log(`??|${expected}|`)

    if (expected == null) {
      console.log('Failed to parse the expected AST')
      return this.RESULT_FAILURE_PARSING
    }

    const result = parser.Parse()
    for (const error of result.Errors) {
      console.log(error)
      const context = result.Input.GetContext(error.Position)
      console.log(context.Content)
      console.log(context.Pointer)
    }

    if (!result.IsSuccess) {
      console.log('Failed to parse the input')
      return this.RESULT_FAILURE_PARSING
    }

    if (result.Errors.Count > 0) {
      console.log('Some errors while parsing the input')
      return this.RESULT_FAILURE_PARSING
    }

    if (this.Compare(expected, result.Root)) {
      return this.RESULT_SUCCESS
    } else {
      console.log('Produced AST does not match the expected one')
      return this.RESULT_FAILURE_VERB
    }
  }

  /// <summary>
  /// Executes the test as a parsing test with a non-matching condition
  /// </summary>
  /// <param name="parser">The parser to use</param>
  /// <returns>The test result</returns>
  private static async TestNoMatches(parser: BaseLRParser): Promise<int> {
    const expected = await this.GetExpectedAST()
    console.log(`??|${expected}|`)

    if (!expected) {
      console.log('Failed to parse the expected AST')
      return this.RESULT_FAILURE_PARSING
    }

    const result = parser.Parse()
    for (const error of result.Errors) {
      console.log(error)
      const context = result.Input.GetContext(error.Position)
      console.log(context.Content)
      console.log(context.Pointer)
    }

    if (!result.IsSuccess) {
      console.log('Failed to parse the input')
      return this.RESULT_FAILURE_PARSING
    }

    if (result.Errors.Count > 0) {
      console.log('Some errors while parsing the input')
      return this.RESULT_FAILURE_PARSING
    }

    if (this.Compare(expected, result.Root)) {
      console.log('Produced AST incorrectly matches the specified expectation')
      return this.RESULT_FAILURE_VERB
    } else {
      return this.RESULT_SUCCESS
    }
  }

  /// <summary>
  /// Executes the test as a parsing test with a failing condition
  /// </summary>
  /// <param name="parser">The parser to use</param>
  /// <returns>The test result</returns>
  private static TestFails(parser: BaseLRParser): int {
    const result = parser.Parse()

    if (!result.IsSuccess) {
      return this.RESULT_SUCCESS
    }

    if (result.Errors.Count > 0) {
      return this.RESULT_SUCCESS
    }

    console.log('No error found while parsing, while some were expected')

    return this.RESULT_FAILURE_VERB
  }

  /// <summary>
  /// Executes the test as an output test
  /// </summary>
  /// <param name="parser">The parser to use</param>
  /// <returns>The test result</returns>
  private static async TestOutputs(parser: BaseLRParser): Promise<number> {
    const output = await this.GetExpectedOutput()
    // Trim last empty lines
    let outputLength = output.length
    for (let i = output.length - 1; i >= 0; --i) {
      if (output[i].length === 0) {
        outputLength--
      } else {
        break
      }
    }
    output.length = outputLength
    console.log(`??|${output}|`)

    const result = parser.Parse()

    if (output.length === 0 || (output.length === 1 && output[0].length === 0)) {
      if (result.IsSuccess && result.Errors.Count === 0) {
        return this.RESULT_SUCCESS
      }

      for (const error of result.Errors) {
        console.log(error)
        const context = result.Input.GetContext(error.Position)
        console.log(context.Content)
        console.log(context.Pointer)
      }

      console.log('Expected an empty output but some error where found while parsing')

      return this.RESULT_FAILURE_VERB
    }

    let i = 0
    for (const error of result.Errors) {
      const message = error.toString()
      const context = result.Input.GetContext(error.Position)

      if (i + 2 >= output.length) {
        console.log('Unexpected error:')
        console.log(message)
        console.log(context.Content)
        console.log(context.Pointer)
        return this.RESULT_FAILURE_VERB
      }

      if (!message.startsWith(output[i])) {
        console.log('Unexpected output: ' + message)
        console.log('Expected prefix  : ' + output[i])
        return this.RESULT_FAILURE_VERB
      }

      if (!context.Content.startsWith(output[i + 1])) {
        console.log('Unexpected output: ' + context.Content)
        console.log('Expected prefix  : ' + output[i + 1])
        return this.RESULT_FAILURE_VERB
      }
      if (!context.Pointer.startsWith(output[i + 2])) {
        console.log('Unexpected output: ' + context.Pointer)
        console.log('Expected prefix  : ' + output[i + 2])
        return this.RESULT_FAILURE_VERB
      }
      i += 3
    }

    if (i === output.length) {
      return this.RESULT_SUCCESS
    }

    for (let j = i; j < output.length; ++j) {
      console.log('Missing output: ' + output[j])
    }

    return this.RESULT_FAILURE_VERB
  }

  /// <summary>
  /// Compare the specified AST node to the expected node
  /// </summary>
  /// <param name="expected">The expected node</param>
  /// <param name="node">The AST node to compare</param>
  /// <returns><c>true</c> if the nodes match</returns>
  private static Compare(expected: ASTNode, node: ASTNode): boolean {
    if (node.Symbol.Name !== expected.Value) {
      return false
    }

    if (expected.Children[0].Children.Count > 0) {
      const test = expected.Children[0].Children[0].Value

      let vRef = expected.Children[0].Children[1].Value
      vRef = vRef
        .substring(1, vRef.length - 1)
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')

      const vReal = node.Value

      if (test === '=' && vReal !== vRef) {
        return false
      }

      if (test === '!=' && vReal === vRef) {
        return false
      }
    }

    if (node.Children.Count !== expected.Children[1].Children.Count) {
      return false
    }

    for (let i = 0; i < node.Children.Count; ++i) {
      if (!this.Compare(expected.Children[1].Children[i], node.Children[i])) {
        return false
      }
    }

    return true
  }

  /// <summary>
  /// Gets the parser for the specified assembly and input
  /// </summary>
  /// <param name="parserName">The parser's name</param>
  /// <param name="input">An input for the parser</param>
  /// <returns>The parser</returns>
  private static async GetParser(parserName: string, input: string): Promise<BaseLRParser> {
    const parsers = (await import('parsers-ts')) as unknown as {
      [key: string]: BaseLRParser & { fromString: (input: string) => Promise<BaseLRParser> }
    }
    const Parser = parsers[parserName]
    return Parser.fromString(input)
  }
}
