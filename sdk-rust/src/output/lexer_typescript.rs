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

//! Module for generating lexer code in TypeScript

use std::fs::File;
use std::io::{self, Write};
use std::path::PathBuf;

use crate::errors::Error;
use crate::grammars::{Grammar, TerminalRef, TerminalSet, PREFIX_GENERATED_TERMINAL};
use crate::output::get_lexer_bin_name_typescript;
use crate::output::helper::to_upper_camel_case;
use crate::{Modifier, CRATE_VERSION};

/// Generates code for the specified file
#[allow(clippy::too_many_lines)]
pub fn write(
    path: Option<&String>,
    file_name: String,
    grammar: &Grammar,
    expected: &TerminalSet,
    separator: Option<TerminalRef>,
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
    let base_lexer = if grammar.contexts.len() > 1 {
        "ContextSensitiveLexer"
    } else {
        "ContextFreeLexer"
    };
    let modifier = match modifier {
        Modifier::Public => "public",
        Modifier::Internal => "internal",
    };
    let bin_name = get_lexer_bin_name_typescript(grammar);
    let separator = match separator {
        None => 0xFFFF,
        Some(terminal_ref) => terminal_ref.sid(),
    };

    writeln!(writer, "/*")?;
    writeln!(writer, " * WARNING: this file has been generated by")?;
    writeln!(writer, " * Hime Parser Generator {CRATE_VERSION}")?;
    writeln!(writer, " */")?;
    writeln!(writer)?;
    writeln!(writer, "import {{ readFile }} from 'fs/promises'")?;
    writeln!(writer, "import {{")?;
    writeln!(writer, "  Automaton,")?;
    writeln!(writer, "  BinaryReader,")?;
    writeln!(writer, "  {base_lexer},")?;
    writeln!(writer, "  GSymbol,")?;
    writeln!(writer, "}} from 'hime-redist-ts'")?;
    writeln!(writer)?;

    writeln!(writer, "/**")?;
    writeln!(writer, " * Represents a lexer (namespace {})", namespace)?;
    writeln!(writer, " * @{}", modifier)?;
    writeln!(writer, " *")?;
    writeln!(writer, " * Hime.SDK {CRATE_VERSION}")?;
    writeln!(writer, " */")?;
    writeln!(writer, "export class {}Lexer extends {} {{", &name, base_lexer)?;

    writeln!(writer, "  /**")?;
    writeln!(writer, "   * The collection of terminals matched by this lexer")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @remarks")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * The terminals are in an order consistent with the automaton,")?;
    writeln!(
        writer,
        "   * so that terminal indices in the automaton can be used to retrieve the terminals in this table"
    )?;
    writeln!(writer, "   */")?;
    writeln!(writer, "  private static readonly terminals = [")?;
    writeln!(writer, "    new GSymbol(0x0001, 'ε'),")?;
    writeln!(writer, "    new GSymbol(0x0002, '$'),")?;
    for terminal_ref in expected.content.iter().skip(2) {
        let terminal = grammar.get_terminal(terminal_ref.sid()).unwrap();
        writeln!(writer, "    new GSymbol(0x{:04X}, '{}'),", terminal.id, terminal.value)?;
    }
    writeln!(writer, "  ]")?;

    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Initializes a new instance of the lexer")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * Hime.SDK {CRATE_VERSION}")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * @param input - The lexer's input")?;
    writeln!(writer, "   */")?;

    writeln!(writer, "  static async fromString(input: string) {{")?;
    writeln!(writer, "    const buffer = await readFile('./{}')", &bin_name)?;
    writeln!(writer, "    const automaton = new Automaton(BinaryReader.Create(buffer))")?;
    writeln!(
        writer,
        "    return new {}Lexer(automaton, this.terminals, 0x{:04X}, input)",
        &name, separator
    )?;
    writeln!(writer, "  }}")?;
    writeln!(writer, "}}")?;
    writeln!(writer)?;

    writeln!(writer, "export namespace {}Lexer {{", &name)?;

    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Contains the constant IDs for the terminals for this lexer")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * Hime.SDK {CRATE_VERSION}")?;
    writeln!(writer, "   */")?;
    writeln!(writer, "  export enum ID {{")?;
    for terminal_ref in expected.content.iter().skip(2) {
        let terminal = grammar.get_terminal(terminal_ref.sid()).unwrap();
        if terminal.name.starts_with(PREFIX_GENERATED_TERMINAL) {
            continue;
        }
        writeln!(writer, "    /**")?;
        writeln!(writer, "     * The unique identifier for terminal {}", &terminal.name)?;
        writeln!(writer, "     */")?;
        writeln!(
            writer,
            "    Terminal{} = 0x{:04X},",
            to_upper_camel_case(&terminal.name),
            terminal.id
        )?;
    }
    writeln!(writer, "  }}")?;

    writeln!(writer, "  /**")?;
    writeln!(writer, "   * Contains the constant IDs for the contexts for this lexer")?;
    writeln!(writer, "   *")?;
    writeln!(writer, "   * Hime.SDK {CRATE_VERSION}")?;
    writeln!(writer, "   */")?;
    writeln!(writer, "  export enum Context {{")?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * The unique identifier for the default context")?;
    writeln!(writer, "     */")?;
    writeln!(writer, "    Default = 0,")?;
    for (index, context) in grammar.contexts.iter().enumerate().skip(1) {
        writeln!(writer, "    /**")?;
        writeln!(writer, "     * The unique identifier for context {context}")?;
        writeln!(writer, "     */")?;
        writeln!(writer, "    {} = 0x{:04X},", to_upper_camel_case(context), index)?;
    }
    writeln!(writer, "  }}")?;
    writeln!(writer, "}}")?;
    Ok(())
}