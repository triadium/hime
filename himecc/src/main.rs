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

//! Generator of lexers and parsers for the Hime runtime.

use std::fmt::{Display, Formatter};
use std::io::{self, Read};
use std::{env, process};

use clap::{Arg, ArgAction, Command};
use hime_sdk::errors::{Error, Errors};
use hime_sdk::{CompilationTask, Input, Mode, Modifier, ParsingMethod, Runtime};
use miette::{EyreContext, MietteHandler};

/// The name of this program
pub const CRATE_NAME: &str = env!("CARGO_PKG_NAME");
/// The version of this program
pub const CRATE_VERSION: &str = env!("CARGO_PKG_VERSION");
/// The commit that was used to build the application
pub const GIT_HASH: &str = env!("GIT_HASH");
/// The git tag that was used to build the application
pub const GIT_TAG: &str = env!("GIT_TAG");

#[allow(clippy::too_many_lines)]
pub fn main() -> miette::Result<()> {
    let matches = Command::new("Hime Parser Generator")
        .version(String::leak(format!("{CRATE_NAME} {CRATE_VERSION} tag={GIT_TAG} hash={GIT_HASH}")) as &'static str)
        .author("Association Cénotélie <contact@cenotelie.fr>")
        .about("Generator of lexers and parsers for the Hime runtime.")
        .arg(
            Arg::new("output_mode")
                .value_name("MODE")
                .short('o')
                .long("output")
                .help("The output mode.")
                .action(ArgAction::Set)
                .required(false)
                .value_parser([
                    "sources",
                    "assembly",
                    "all"
                ])
        )
        .arg(
            Arg::new("output_target")
                .value_name("TARGET")
                .short('t')
                .long("target")
                .help("The target runtime.")
                .action(ArgAction::Set)
                .required(false)
                .value_parser([
                    "net",
                    "u3d",
                    "java",
                    "rust"
                ])
        )
        .arg(
            Arg::new("output_target_runtime_path")
                .value_name("RUNTIME")
                .short('r')
                .long("runtime")
                .help("The path to a specific target runtime.")
                .action(ArgAction::Set)
                .required(false)
        )
        .arg(
            Arg::new("output_path")
                .value_name("PATH")
                .short('p')
                .long("path")
                .help("The path to write the output. By default, the current directory is used.")
                .action(ArgAction::Set)
                .required(false)
        )
        .arg(
            Arg::new("output_access")
                .value_name("ACCESS")
                .short('a')
                .long("access")
                .help("The access modifier for the generated code.")
                .action(ArgAction::Set)
                .required(false)
                .value_parser([
                    "internal",
                    "public"
                ])
        )
        .arg(
            Arg::new("output_namespace")
                .value_name("NMSPCE")
                .short('n')
                .long("namespace")
                .help("The namespace to use for the generated code. If none is given, and the target runtime requires one, the name of the grammar will be used.")
                .action(ArgAction::Set)
                .required(false)
        )
        .arg(
            Arg::new("parsing_method")
                .value_name("METHOD")
                .short('m')
                .long("method")
                .help("The parsing method to use.")
                .action(ArgAction::Set)
                .required(false)
                .value_parser([
                    "lr0",
                    "lr1",
                    "lalr1",
                    "rnglr1",
                    "rnglalr1"
                ])
        )
        .arg(
            Arg::new("debug")
                .long("debug")
                .help("Print debug data when building a grammar.")
                .action(ArgAction::SetTrue)
                .required(false)
        )
        .arg(
            Arg::new("rust_no_std")
                .long("no-std")
                .help("Rust-only, activates the support for no-std in the generated code (default to no support for no-std)")
                .action(ArgAction::SetTrue)
                .required(false)
        )
        .arg(
            Arg::new("rust_suppress_module_doc")
                .long("embed")
                .help("Rust-only,  indicates whether to suppress module documentation so that the generated code can be embedded (blocked by https://github.com/rust-lang/rust/issues/66920) (default to false)")
                .action(ArgAction::SetTrue)
                .required(false)
        )
        .arg(
            Arg::new("rust_compress_automata")
                .long("compress")
                .help("Rust-only, indicates whether to compress automata binary files (default to false)")
                .action(ArgAction::SetTrue)
                .required(false)
        )
        .arg(
            Arg::new("grammar_name")
                .value_name("GRAMMAR")
                .short('g')
                .long("grammar")
                .help("The name of the grammar to compile if there are multiple.")
                .action(ArgAction::Set)
                .required(false)
        )
        .arg(
            Arg::new("test")
                .long("test")
                .help("Compiles the target grammar in-memory and test it against an input read from std::in and output the AST or parse errors")
                .action(ArgAction::SetTrue)
                .required(false)
        )
        .arg(
            Arg::new("inputs")
                .value_name("INPUTS")
                .help("The file names of the input grammars")
                .action(ArgAction::Append)
                .required(true)
        )
        .get_matches();

    let mut task = CompilationTask::default();
    match matches.get_one::<String>("output_mode").map(String::as_str) {
        Some("sources") => task.mode = Some(Mode::Sources),
        Some("assembly") => task.mode = Some(Mode::Assembly),
        Some("all") => task.mode = Some(Mode::SourcesAndAssembly),
        _ => {}
    }
    match matches.get_one::<String>("output_target").map(String::as_str) {
        Some("net") => task.output_target = Some(Runtime::Net),
        Some("u3d") => task.output_target = Some(Runtime::Unity3d),
        Some("java") => task.output_target = Some(Runtime::Java),
        Some("rust") => task.output_target = Some(Runtime::Rust),
        _ => {}
    }
    task.output_target_runtime_path = matches
        .get_one::<String>("output_target_runtime_path")
        .map(std::string::ToString::to_string);
    task.output_path = matches.get_one::<String>("output_path").map(std::string::ToString::to_string);
    match matches.get_one::<String>("output_access").map(String::as_str) {
        Some("internal") => task.output_modifier = Some(Modifier::Internal),
        Some("public") => task.output_modifier = Some(Modifier::Public),
        _ => {}
    }
    task.output_namespace = matches
        .get_one::<String>("output_namespace")
        .map(std::string::ToString::to_string);
    match matches.get_one::<String>("parsing_method").map(String::as_str) {
        Some("lr0") => task.method = Some(ParsingMethod::LR0),
        Some("lr1") => task.method = Some(ParsingMethod::LR1),
        Some("lalr1") => task.method = Some(ParsingMethod::LALR1),
        Some("rnglr1") => task.method = Some(ParsingMethod::RNGLR1),
        Some("rnglalr1") => task.method = Some(ParsingMethod::RNGLALR1),
        _ => {}
    }
    if matches.get_flag("debug") {
        task.print_debug_data = Some(true);
    }
    if matches.get_flag("rust_no_std") {
        task.rust_use_std = Some(false);
    }
    if matches.get_flag("rust_suppress_module_doc") {
        task.rust_suppress_module_doc = Some(true);
    }
    if matches.get_flag("rust_compress_automata") {
        task.rust_compress_automata = Some(true);
    }
    task.grammar_name = matches
        .get_one::<String>("grammar_name")
        .map(std::string::ToString::to_string);
    if let Some(inputs) = matches.get_many::<String>("inputs") {
        for input in inputs {
            task.inputs.push(Input::FileName(input.to_string()));
        }
    }
    let result = if matches.get_flag("test") {
        execute_test(&task)
    } else {
        execute_normal(&task)
    };
    if let Err(errors) = result {
        println!("{}", HimeCcErrors(errors));
        process::exit(1);
    } else {
        process::exit(0);
    }
}

/// Executes the normal operation of the compiler
fn execute_normal<'a>(task: &CompilationTask<'a>) -> Result<(), Errors<'a>> {
    task.execute()?;
    Ok(())
}

/// Executes the compiler in test mode
/// Compiles the target grammar in-memory
/// Test it against the input read from `std::in`
/// Output the result
fn execute_test<'a>(task: &CompilationTask<'a>) -> Result<(), Errors<'a>> {
    let mut data = task.load()?;
    if data.grammars.is_empty() || (data.grammars.len() > 1 && task.grammar_name.is_none()) {
        return Err(Errors::from(data, vec![Error::GrammarNotSpecified]));
    }
    let (grammar_index, grammar) = if data.grammars.len() == 1 {
        (0, &mut data.grammars[0])
    } else {
        let name = task.grammar_name.as_ref().unwrap();
        match data
            .grammars
            .iter_mut()
            .enumerate()
            .find(|(_, grammar)| &grammar.name == name)
        {
            Some(couple) => couple,
            None => {
                return Err(Errors::from(data, vec![Error::GrammarNotFound(name.clone())]));
            }
        }
    };
    let parser = match task.generate_in_memory(grammar, grammar_index) {
        Ok(p) => p,
        Err(errs) => {
            return Err(Errors::from(data, errs));
        }
    };

    let mut input_stream = io::stdin();
    let mut input = String::new();
    match input_stream.read_to_string(&mut input) {
        Ok(_) => {}
        Err(error) => {
            return Err(Errors::from(data, vec![Error::Io(error)]));
        }
    }
    let result = parser.parse(&input);
    match serde_json::to_writer(std::io::stdout(), &result) {
        Ok(r) => r,
        Err(error) => {
            return Err(Errors::from(data, vec![Error::Msg(error.to_string())]));
        }
    };
    Ok(())
}

/// Encapsulate SDK errors to implement Display with specific error formatting
struct HimeCcErrors<'t>(Errors<'t>);

impl<'t> Display for HimeCcErrors<'t> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let handler = MietteHandler::default();
        for error in &self.0.errors {
            let contextualized = error.with_context(&self.0.context);
            handler.debug(&contextualized, f)?;
        }
        Ok(())
    }
}
