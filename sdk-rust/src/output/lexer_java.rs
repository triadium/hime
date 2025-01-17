/*******************************************************************************
 * Copyright (c) 2020 Association Cénotélie (cenotelie.fr)
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

//! Module for generating lexer code in Java

use std::fs::File;
use std::io::{self, Write};
use std::path::PathBuf;

use crate::errors::Error;
use crate::grammars::{Grammar, TerminalRef, TerminalSet, PREFIX_GENERATED_TERMINAL};
use crate::output::get_lexer_bin_name_java;
use crate::output::helper::{to_upper_camel_case, to_upper_case};
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
        Modifier::Public => "public ",
        Modifier::Internal => "",
    };
    let bin_name = get_lexer_bin_name_java(grammar);
    let separator = match separator {
        None => 0xFFFF,
        Some(terminal_ref) => terminal_ref.sid(),
    };

    writeln!(writer, "/*")?;
    writeln!(writer, " * WARNING: this file has been generated by")?;
    writeln!(writer, " * Hime Parser Generator {CRATE_VERSION}")?;
    writeln!(writer, " */")?;
    writeln!(writer)?;
    writeln!(writer, "package {namespace};")?;
    writeln!(writer)?;
    writeln!(writer, "import fr.cenotelie.hime.redist.Symbol;")?;
    writeln!(writer, "import fr.cenotelie.hime.redist.lexer.Automaton;")?;
    if grammar.contexts.len() > 1 {
        writeln!(writer, "import fr.cenotelie.hime.redist.lexer.ContextSensitiveLexer;")?;
    } else {
        writeln!(writer, "import fr.cenotelie.hime.redist.lexer.ContextFreeLexer;")?;
    }
    writeln!(writer)?;
    writeln!(writer, "import java.io.InputStreamReader;")?;
    writeln!(writer)?;

    writeln!(writer, "/**")?;
    writeln!(writer, " * Represents a lexer")?;
    writeln!(writer, " */")?;
    writeln!(writer, "{}class {}Lexer extends {} {{", modifier, &name, base_lexer)?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * The automaton for this lexer")?;
    writeln!(writer, "     */")?;
    writeln!(
        writer,
        "    private static final Automaton commonAutomaton = Automaton.find({}Lexer.class, \"{}\");",
        &name, bin_name
    )?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * Contains the constant IDs for the terminals for this lexer")?;
    writeln!(writer, "     */")?;
    writeln!(writer, "    public static class ID {{")?;
    for terminal_ref in expected.content.iter().skip(2) {
        let terminal = grammar.get_terminal(terminal_ref.sid()).unwrap();
        if terminal.name.starts_with(PREFIX_GENERATED_TERMINAL) {
            continue;
        }
        writeln!(writer, "        /**")?;
        writeln!(writer, "         * The unique identifier for terminal {}", &terminal.name)?;
        writeln!(writer, "         */")?;
        writeln!(
            writer,
            "        public static final int TERMINAL_{} = 0x{:04X};",
            to_upper_case(&terminal.name),
            terminal.id
        )?;
    }
    writeln!(writer, "    }}")?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * Contains the constant IDs for the contexts for this lexer")?;
    writeln!(writer, "     */")?;
    writeln!(writer, "    public static class Context {{")?;
    writeln!(writer, "        /**")?;
    writeln!(writer, "         * The unique identifier for the default context")?;
    writeln!(writer, "         */")?;
    writeln!(writer, "        public static final int DEFAULT = 0;")?;
    for (index, context) in grammar.contexts.iter().enumerate().skip(1) {
        writeln!(writer, "        /**")?;
        writeln!(writer, "         * The unique identifier for context {context}")?;
        writeln!(writer, "         */")?;
        writeln!(
            writer,
            "        public static final int {} = 0x{:04X};",
            to_upper_case(context),
            index
        )?;
    }
    writeln!(writer, "    }}")?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * The collection of terminals matched by this lexer")?;
    writeln!(writer, "     *")?;
    writeln!(writer, "     * The terminals are in an order consistent with the automaton,")?;
    writeln!(
        writer,
        "     * so that terminal indices in the automaton can be used to retrieve the terminals in this table"
    )?;
    writeln!(writer, "     */")?;
    writeln!(writer, "    private static final Symbol[] terminals = {{")?;
    writeln!(writer, "        new Symbol(0x0001, \"ε\"),")?;
    write!(writer, "        new Symbol(0x0002, \"$\")")?;
    for terminal_ref in expected.content.iter().skip(2) {
        let terminal = grammar.get_terminal(terminal_ref.sid()).unwrap();
        writeln!(writer, ",")?;
        write!(writer, "        ")?;
        write!(
            writer,
            "new Symbol(0x{:04X}, \"{}\")",
            terminal.id,
            terminal.value.replace('"', "\\\"")
        )?;
    }
    writeln!(writer, " }};")?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * Initializes a new instance of the lexer")?;
    writeln!(writer, "     *")?;
    writeln!(writer, "     * @param input The lexer's input")?;
    writeln!(writer, "     */")?;
    writeln!(writer, "    public {}Lexer(String input) {{", &name)?;
    writeln!(writer, "        super(commonAutomaton, terminals, 0x{separator:04X}, input);")?;
    writeln!(writer, "    }}")?;

    writeln!(writer, "    /**")?;
    writeln!(writer, "     * Initializes a new instance of the lexer")?;
    writeln!(writer, "     *")?;
    writeln!(writer, "     * @param input The lexer's input")?;
    writeln!(writer, "     */")?;
    writeln!(writer, "    public {}Lexer(InputStreamReader input) {{", &name)?;
    writeln!(writer, "        super(commonAutomaton, terminals, 0x{separator:04X}, input);")?;
    writeln!(writer, "    }}")?;
    writeln!(writer, "}}")?;
    Ok(())
}
