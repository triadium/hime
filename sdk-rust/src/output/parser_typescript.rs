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

//! Module for generating parser code in TypeScript

use std::fs::File;
use std::io::{self, Write};
use std::path::PathBuf;

use crate::errors::Error;
use crate::grammars::{Grammar, TerminalSet, PREFIX_GENERATED_TERMINAL, PREFIX_GENERATED_VARIABLE};
use crate::output::get_parser_bin_name_typescript;
use crate::output::helper::{to_lower_camel_case, to_lower_dash_case, to_upper_camel_case};
use crate::{Modifier, ParsingMethod, CRATE_VERSION};

/// Generates code for the specified file
pub fn write(
    path: Option<&String>,
    file_name: String,
    grammar: &Grammar,
    expected: &TerminalSet,
    method: ParsingMethod,
    namespace: &str,
    modifier: Modifier,
) -> Result<(), Error> {
    let mut final_path = PathBuf::new();
    if let Some(path) = path {
        final_path.push(path);
    }
    final_path.push(file_name);
    let file = File::create(final_path)?;
    let mut writer = io::BufWriter::new(file);

    let name = to_upper_camel_case(&grammar.name);
    let modifier = match modifier {
        Modifier::Public => "public",
        Modifier::Internal => "internal",
    };
    let (parser_type, automaton_type) = if method.is_rnglr() {
        ("RNGLRParser", "RNGLRAutomaton")
    } else {
        ("LRkParser", "LRkAutomaton")
    };

    writeln!(writer, "/*")?;
    writeln!(writer, " * WARNING: this file has been generated by")?;
    writeln!(writer, " * Hime Parser Generator {CRATE_VERSION}")?;
    writeln!(writer, " */")?;
    writeln!(writer)?;
    writeln!(writer, "import {{ readFile }} from 'fs/promises'")?;
    writeln!(writer, "import {{")?;
    writeln!(writer, "  ArrayCopy,")?;
    writeln!(writer, "  ASTNode,")?;
    writeln!(writer, "  BinaryReader,")?;
    writeln!(writer, "  GSymbol,")?;
    writeln!(writer, "  ParseResult,")?;
    writeln!(writer, "  {automaton_type},")?;
    writeln!(writer, "  {parser_type},")?;
    writeln!(writer, "  SemanticAction,")?;
    writeln!(writer, "  SemanticBody,")?;
    writeln!(writer, "}} from 'hime-redist-ts'")?;
    writeln!(writer)?;

    writeln!(
        writer,
        "import {{ {}Lexer }} from './{}.lexer'",
        &name,
        to_lower_dash_case(&grammar.name)
    )?;

    writeln!(writer, "/**")?;
    writeln!(writer, " * Represents a parser (namespace {})", namespace)?;
    writeln!(writer, " * @{}", modifier)?;
    writeln!(writer, " *")?;
    writeln!(writer, " * Hime.SDK {CRATE_VERSION}")?;
    writeln!(writer, " */")?;

    writeln!(writer, "export class {}Parser extends {} {{", &name, parser_type)?;

    write_code_variables(&mut writer, grammar)?;
    write_code_virtuals(&mut writer, grammar)?;
    write_code_get_actions(&mut writer, grammar)?;
    write_code_visitor_result(&mut writer, grammar, expected)?;
    write_code_constructors(&mut writer, grammar, &automaton_type)?;
    write_code_utils(&mut writer)?;

    writeln!(writer, "}}")?;

    writeln!(writer)?;
    writeln!(writer, "export namespace {}Parser {{", &name)?;

    write_code_symbols(&mut writer, grammar)?;
    write_code_actions(&mut writer, grammar)?;
    write_code_visitor(&mut writer, grammar, expected)?;

    writeln!(writer, "}}")?;

    Ok(())
}

/// Generates the code for the symbols
fn write_code_symbols(writer: &mut dyn Write, grammar: &Grammar) -> Result<(), Error> {
    writeln!(writer, "  /**")?;
    writeln!(
        writer,
        "   * Contains the constant IDs for the variables and virtuals in this parser"
    )?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * Hime.SDK {CRATE_VERSION}")?;
    writeln!(writer, "   */")?;

    writeln!(writer, "  export enum ID {{")?;
    for variable in grammar
        .variables
        .iter()
        .filter(|v| !v.name.starts_with(PREFIX_GENERATED_VARIABLE))
    {
        writeln!(writer, "    /**")?;
        writeln!(writer, "     * The unique identifier for variable {}", &variable.name)?;
        writeln!(writer, "     */")?;
        writeln!(
            writer,
            "    Variable{} = 0x{:04X},",
            to_upper_camel_case(&variable.name),
            variable.id
        )?;
    }
    for symbol in &grammar.virtuals {
        writeln!(writer, "    /**")?;
        writeln!(writer, "     * The unique identifier for virtual {}", &symbol.name)?;
        writeln!(writer, "     */")?;
        writeln!(
            writer,
            "    Virtual{} = 0x{:04X},",
            to_upper_camel_case(&symbol.name),
            symbol.id
        )?;
    }
    writeln!(writer, "  }}")?;
    Ok(())
}

/// Generates the code for the variables
fn write_code_variables(writer: &mut dyn Write, grammar: &Grammar) -> Result<(), Error> {
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * The collection of variables matched by this parser")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @remarks")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * The variables are in an order consistent with the automaton,")?;
    writeln!(
        writer,
        "   * so that variable indices in the automaton can be used to retrieve the variables in this table"
    )?;
    writeln!(writer, "   */")?;
    writeln!(writer, "  static readonly variables: GSymbol[] = [")?;
    for variable_ref in grammar.variables.iter() {
        writeln!(
            writer,
            "    new GSymbol(0x{:04X}, '{}'),",
            variable_ref.id, &variable_ref.name
        )?;
    }
    writeln!(writer, "  ]")?;
    Ok(())
}

/// Generates the code for the virtual symbols
fn write_code_virtuals(writer: &mut dyn Write, grammar: &Grammar) -> Result<(), Error> {
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * The collection of virtuals matched by this parser")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * The virtuals are in an order consistent with the automaton,")?;
    writeln!(
        writer,
        "   * so that virtual indices in the automaton can be used to retrieve the virtuals in this table"
    )?;
    writeln!(writer, "   */")?;
    writeln!(writer, "  private static readonly virtuals: GSymbol[] = [")?;
    for symbol_ref in grammar.virtuals.iter() {
        writeln!(writer, "    new GSymbol(0x{:04X}, '{}'),", symbol_ref.id, &symbol_ref.name)?;
    }
    writeln!(writer, "  ]")?;
    Ok(())
}

/// Generates the code for the functions of the semantic actions getting
fn write_code_get_actions(writer: &mut dyn Write, grammar: &Grammar) -> Result<(), Error> {
    if grammar.actions.is_empty() {
        return Ok(());
    }

    let name = to_upper_camel_case(&grammar.name);

    writeln!(writer, "  /**")?;
    writeln!(
        writer,
        "   * Gets the set of semantic actions in the form a table consistent with the automaton"
    )?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @param input - A set of semantic actions")?;
    writeln!(writer, "   */")?;

    writeln!(
        writer,
        "  private static getUserActions(input: {}Parser.Actions): SemanticAction[] {{",
        &name
    )?;
    writeln!(
        writer,
        "    const result = new Array<SemanticAction>({})",
        &grammar.actions.len()
    )?;
    for (index, action) in grammar.actions.iter().enumerate() {
        writeln!(writer, "    result[{}] = input.{}", index, to_lower_camel_case(&action.name))?;
    }
    writeln!(writer, "    return result")?;
    writeln!(writer, "  }}")?;

    writeln!(writer, "  /**")?;
    writeln!(
        writer,
        "   * Gets the set of semantic actions in the form a table consistent with the automaton"
    )?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @param input - A set of semantic actions")?;
    writeln!(writer, "   */")?;

    writeln!(
        writer,
        "  private static getUserActionsFromMap(input: Record<string, SemanticAction>) {{"
    )?;
    writeln!(
        writer,
        "    const result = new Array<SemanticAction>({})",
        &grammar.actions.len()
    )?;
    for (index, action) in grammar.actions.iter().enumerate() {
        writeln!(
            writer,
            "    result[{}] = input['{}']!",
            index,
            to_lower_camel_case(&action.name)
        )?;
    }
    writeln!(writer, "    return result")?;
    writeln!(writer, "  }}")?;

    Ok(())
}

/// Generates the code for the semantic actions
fn write_code_actions(writer: &mut dyn Write, grammar: &Grammar) -> Result<(), Error> {
    if grammar.actions.is_empty() {
        return Ok(());
    }

    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Represents a set of semantic actions in this parser")?;
    writeln!(writer, "   */")?;

    writeln!(writer, "  export class Actions {{")?;
    for action in &grammar.actions {
        writeln!(writer, "    /**")?;
        writeln!(writer, "     * The {} semantic action", &action.name)?;
        writeln!(writer, "     */")?;
        writeln!(
            writer,
            "    {}(_: GSymbol, __: SemanticBody): void {{ }}",
            to_lower_camel_case(&action.name)
        )?;
    }
    writeln!(writer, "  }}")?;
    Ok(())
}

/// Generates the code for the constructors
fn write_code_constructors(writer: &mut dyn Write, grammar: &Grammar, automaton_type: &str) -> Result<(), Error> {
    let name = to_upper_camel_case(&grammar.name);
    let bin_name = get_parser_bin_name_typescript(grammar);

    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Initializes a new instance of the parser")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @param automaton - The parser's automaton")?;
    writeln!(writer, "   * @param actions - The set of semantic actions")?;
    writeln!(writer, "   * @param lexer - The input lexer")?;
    writeln!(writer, "   */")?;

    writeln!(
        writer,
        "  constructor(automaton: {}, actions: SemanticAction[], lexer: {}Lexer) {{",
        &automaton_type, &name
    )?;
    writeln!(
        writer,
        "    super(automaton, {}Parser.variables, {}Parser.virtuals, actions, lexer)",
        &name, &name
    )?;
    writeln!(writer, "  }}")?;
    writeln!(writer)?;

    if grammar.actions.is_empty() {
        writeln!(writer, "  /**")?;
        writeln!(writer, "   * Initializes a new instance of the parser from string input")?;
        writeln!(writer, "   *")?;
        writeln!(writer, "   * @param input - The input")?;
        writeln!(writer, "   */")?;
        writeln!(writer, "  static async fromString(input: string) {{")?;
        writeln!(writer, "    const lexer = await {}Lexer.fromString(input)", &name)?;
        writeln!(writer, "    const buffer = await readFile('./{}')", &bin_name)?;
        writeln!(
            writer,
            "    const automaton = new {}(BinaryReader.Create(buffer))",
            &automaton_type
        )?;
        writeln!(writer, "    return new {}Parser(automaton, [], lexer)", &name)?;
        writeln!(writer, "  }}")?;
    } else {
        writeln!(writer, "  /**")?;
        writeln!(writer, "   * Initializes a new instance of the parser from string input")?;
        writeln!(writer, "   *")?;
        writeln!(writer, "   * @param input - The input")?;
        writeln!(writer, "   */")?;
        writeln!(writer, "  static async fromString(input: string) {{")?;
        writeln!(writer, "    const lexer = await {}Lexer.fromString(input)", &name)?;
        writeln!(writer, "    const buffer = await readFile('./{}')", &bin_name)?;
        writeln!(
            writer,
            "    const automaton = new {}(BinaryReader.Create(buffer))",
            &automaton_type
        )?;
        writeln!(
            writer,
            "    return new {}Parser(automaton, this.getUserActions(new {}Parser.Actions()), lexer)",
            &name, &name
        )?;
        writeln!(writer, "  }}")?;

        writeln!(writer)?;
        writeln!(writer, "  /**")?;
        writeln!(
            writer,
            "   * Initializes a new instance of the parser from string input with actions"
        )?;
        writeln!(writer, "   *")?;
        writeln!(writer, "   * @param input - The input")?;
        writeln!(writer, "   * @param actions - The set of semantic actions")?;
        writeln!(writer, "   */")?;
        writeln!(
            writer,
            "  static async fromStringWithActions(input: string, actions: MathExpParser.Actions) {{"
        )?;
        writeln!(writer, "    const lexer = await {}Lexer.fromString(input)", &name)?;
        writeln!(writer, "    const buffer = await readFile('./{}')", &bin_name)?;
        writeln!(
            writer,
            "    const automaton = new {}(BinaryReader.Create(buffer))",
            &automaton_type
        )?;
        writeln!(
            writer,
            "    return new {}Parser(automaton, this.getUserActions(actions), lexer)",
            &name
        )?;
        writeln!(writer, "  }}")?;
        writeln!(writer)?;
        writeln!(writer, "  /**")?;
        writeln!(
            writer,
            "   * Initializes a new instance of the parser from string input with actions"
        )?;
        writeln!(writer, "   *")?;
        writeln!(writer, "   * @param input - The input")?;
        writeln!(writer, "   * @param actions - The set of semantic actions")?;
        writeln!(writer, "   */")?;
        writeln!(
            writer,
            "  static async fromStringWithActionMap(input: string, actions: Record<string, SemanticAction>) {{"
        )?;
        writeln!(writer, "    const lexer = await {}Lexer.fromString(input)", &name)?;
        writeln!(writer, "    const buffer = await readFile('./{}')", &bin_name)?;
        writeln!(
            writer,
            "    const automaton = new {}(BinaryReader.Create(buffer))",
            &automaton_type
        )?;
        writeln!(
            writer,
            "    return new {}Parser(automaton, this.getUserActionsFromMap(actions), lexer)",
            &name
        )?;
        writeln!(writer, "  }}")?;
    }
    Ok(())
}

/// Generates the visitor for the parse result
#[allow(clippy::too_many_lines)]
fn write_code_visitor_result(writer: &mut dyn Write, grammar: &Grammar, expected: &TerminalSet) -> Result<(), Error> {
    let name = to_upper_camel_case(&grammar.name);

    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Walk the AST of a result using a visitor")?;
    writeln!(writer, "   * ")?;
    writeln!(writer, "   * @param result - The parse result")?;
    writeln!(writer, "   * @param visitor - The visitor to use")?;
    writeln!(writer, "   */")?;

    writeln!(
        writer,
        "  static visit(result: ParseResult, visitor: {}Parser.Visitor): void {{",
        &name
    )?;

    writeln!(writer, "    this.visitASTNode(result.Root, visitor)")?;
    writeln!(writer, "  }}")?;
    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Walk the sub-AST from the specified node using a visitor")?;
    writeln!(writer, "   * ")?;
    writeln!(writer, "   * @param node - The AST node to start from")?;
    writeln!(writer, "   * @param visitor - The visitor to use")?;
    writeln!(writer, "   */")?;
    writeln!(
        writer,
        "  static visitASTNode(node: ASTNode, visitor: {}Parser.Visitor): void {{",
        &name
    )?;
    writeln!(writer, "    for (let i = 0; i < node.Children.Count; ++i) {{")?;
    writeln!(writer, "      this.visitASTNode(node.Children[i]!, visitor)")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "    switch (node.Symbol.ID) {{")?;
    for terminal_ref in &expected.content {
        let Some(terminal) = grammar.get_terminal(terminal_ref.sid()) else {
            continue;
        };
        if terminal.name.starts_with(PREFIX_GENERATED_TERMINAL) {
            continue;
        }
        writeln!(
            writer,
            "      case 0x{:04X}: visitor.onTerminal{}(node); break;",
            terminal.id,
            to_upper_camel_case(&terminal.name)
        )?;
    }
    for variable in &grammar.variables {
        if variable.name.starts_with(PREFIX_GENERATED_VARIABLE) {
            continue;
        }
        writeln!(
            writer,
            "      case 0x{:04X}: visitor.onVariable{}(node); break;",
            variable.id,
            to_upper_camel_case(&variable.name)
        )?;
    }
    for symbol in &grammar.virtuals {
        writeln!(
            writer,
            "      case 0x{:04X}: visitor.onVirtual{}(node); break;",
            symbol.id,
            to_upper_camel_case(&symbol.name)
        )?;
    }
    writeln!(writer, "    }}")?;
    writeln!(writer, "  }}")?;

    Ok(())
}

/// Generates the visitor
fn write_code_visitor(writer: &mut dyn Write, grammar: &Grammar, expected: &TerminalSet) -> Result<(), Error> {
    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Default visitor class")?;
    writeln!(writer, "   */")?;

    writeln!(writer, "  export class Visitor {{")?;
    for terminal_ref in &expected.content {
        let Some(terminal) = grammar.get_terminal(terminal_ref.sid()) else {
            continue;
        };
        if terminal.name.starts_with(PREFIX_GENERATED_TERMINAL) {
            continue;
        }
        writeln!(
            writer,
            "    onTerminal{}(_: ASTNode): void {{ }}",
            to_upper_camel_case(&terminal.name)
        )?;
    }
    for variable in &grammar.variables {
        if variable.name.starts_with(PREFIX_GENERATED_VARIABLE) {
            continue;
        }
        writeln!(
            writer,
            "    onVariable{}(_: ASTNode): void {{ }}",
            to_upper_camel_case(&variable.name)
        )?;
    }
    for symbol in &grammar.virtuals {
        writeln!(
            writer,
            "    onVirtual{}(_: ASTNode): void {{ }}",
            to_upper_camel_case(&symbol.name)
        )?;
    }
    writeln!(writer, "  }}")?;

    Ok(())
}

/// Generates the code for the utils functions
fn write_code_utils(writer: &mut dyn Write) -> Result<(), Error> {
    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Prints the result of the parsing")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @param result - The result of the parsing")?;
    writeln!(writer, "   */")?;
    writeln!(writer, "  static Print(result: ParseResult): void {{")?;
    writeln!(writer, "    if (result.IsSuccess) {{")?;
    writeln!(writer, "      const output: string[] = []")?;
    writeln!(writer, "      this.PrintNode(result.Root, new Array<boolean>(), output)")?;
    writeln!(writer, "      console.log(output.join(''))")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "    else {{")?;
    writeln!(writer, "      for (const err of result.Errors) {{")?;
    writeln!(writer, "        console.log(err)")?;
    writeln!(writer, "      }}")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "  }}")?;
    writeln!(writer)?;
    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Prints the node of the parsing")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @param node - The node of the parsing")?;
    writeln!(writer, "   * @param crossings - The crossings flags")?;
    writeln!(writer, "   * @param output - The array of output lines")?;
    writeln!(writer, "   */")?;
    writeln!(
        writer,
        "  static PrintNode(node: ASTNode, crossings: boolean[], output: string[]): void {{"
    )?;
    writeln!(writer, "    const line: string[] = []")?;
    writeln!(writer, "    for (let i = 0; i < crossings.length - 1; ++i) {{")?;
    writeln!(writer, "      line.push(crossings[i] ? '|   ' : '    ')")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "    if (crossings.length > 0) {{")?;
    writeln!(writer, "      line.push('+-> ')")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "    line.push(node.toString())")?;
    writeln!(writer, "    line.push('\\n')")?;
    writeln!(writer, "    output.push(line.join(''))")?;
    writeln!(writer, "    for (let i = 0; i < node.Children.Count; ++i) {{")?;
    writeln!(
        writer,
        "      const childCrossings = new Array<boolean>(crossings.length + 1)"
    )?;
    writeln!(writer, "      ArrayCopy(crossings, 0, childCrossings, 0, crossings.length)")?;
    writeln!(
        writer,
        "      childCrossings[childCrossings.length - 1] = (i < node.Children.Count - 1)"
    )?;
    writeln!(writer, "      this.PrintNode(node.Children[i]!, childCrossings, output)")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "  }}")?;

    Ok(())
}