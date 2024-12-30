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

//! Module for build TypeScript assemblies

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

use include_dir::{include_dir, Dir, DirEntry};

use crate::errors::Error;
use crate::grammars::Grammar;
use crate::output::from_slashed_path;
use crate::{output, CompilationTask};

use super::helper::to_lower_dash_case;

const PACKAGE: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/src/output/assembly_typescript_package");
const MANIFEST: &[u8] = include_bytes!("assembly_typescript.json");
const YARN_PATH: &str = include_str!("assembly_typescript.yarnpath");

/// Build the TypeScript assembly for the specified units
pub fn build(task: &CompilationTask, units: &[(usize, &Grammar)]) -> Result<(), Error> {
    // build the project
    let (project_folder, assembly_name) = build_typescript_project(task, units)?;

    // install modules && build
    execute_yarn_command(&project_folder, "workspaces", &["focus"])?;
    execute_yarn_command(&project_folder, "build", &[])?;

    // create the package
    execute_yarn_command(&project_folder, "pack", &["-o", "./dist/%s-%v.tgz"])?;

    // copy the package to final path
    let assembly_file_name = format!("{assembly_name}-1.0.0.tgz");

    let mut output_file = project_folder.clone();
    output_file.push("dist");
    output_file.push(&assembly_file_name);

    if units.len() == 1 {
        // only one grammar => output for the grammar
        let path = task.get_output_path_for(units[0].1);
        let mut final_path = PathBuf::new();
        if let Some(path) = path.as_ref() {
            final_path.push(path);
        }
        final_path.push(&assembly_file_name);
        fs::copy(output_file, final_path)?;
    } else {
        // output the package
        let mut final_path = PathBuf::new();
        if let Some(path) = task.output_path.as_ref() {
            final_path.push(path);
        }
        final_path.push(&assembly_file_name);
        fs::copy(output_file, final_path)?;
    }

    // cleanup the temp folder
    fs::remove_dir_all(&project_folder)?;

    Ok(())
}

fn copy_dir(src_dir: &Dir<'_>, dst_folder: &Path) -> Result<(), Error> {
    for entry_ref in src_dir.entries().iter() {
        match entry_ref {
            DirEntry::Dir(dir) => {
                fs::create_dir_all(&dst_folder.join(from_slashed_path(dir.path())))?;
                copy_dir(dir, dst_folder)?
            }
            DirEntry::File(file) => {
                output::export_resource_target(&dst_folder.join(from_slashed_path(file.path())), file.contents())?
            }
        }
    }
    Ok(())
}

/// Builds the typescript project
fn build_typescript_project(task: &CompilationTask, units: &[(usize, &Grammar)]) -> Result<(PathBuf, String), Error> {
    let project_folder = output::temporary_folder();

    copy_dir(&PACKAGE, &project_folder)?;

    let src_folder = project_folder.join("src");
    fs::create_dir_all(&src_folder)?;

    let index_file = std::fs::File::create(src_folder.join("index.ts"))?;
    let mut index_writer = std::io::BufWriter::new(index_file);

    for (index, grammar) in units {
        writeln!(index_writer, "export * from './{}.lexer'", to_lower_dash_case(&grammar.name))?;
        writeln!(index_writer, "export * from './{}.parser'", to_lower_dash_case(&grammar.name))?;

        for source in output::get_sources(task, grammar, *index)? {
            let mut target = src_folder.clone();
            target.push(source.file_name().unwrap());
            fs::copy(source, target)?;
        }
    }

    let assembly_name = if units.len() == 1 {
        format!("{}-ts", to_lower_dash_case(&units[0].1.name))
    } else {
        String::from("parsers-ts")
    };

    output::export_resource(
        &project_folder,
        "package.json",
        std::str::from_utf8(MANIFEST)
            .unwrap()
            .replace("${TypeScriptAssemblyName}", assembly_name.as_str())
            .as_bytes(),
    )?;

    Ok((project_folder, assembly_name))
}

/// Execute a yarn command
fn execute_yarn_command(project_folder: &Path, verb: &str, args: &[&str]) -> Result<(), Error> {
    let mut command = Command::new("node");
    command.current_dir(project_folder).arg(YARN_PATH).arg(verb).args(args);

    let output = command.output()?;
    let stdout = String::from_utf8(output.stdout).unwrap();
    let stderr = String::from_utf8(output.stderr).unwrap();
    if !stderr.is_empty() || stdout.contains("Error") {
        let mut log = stderr;
        log.push_str(&stdout);
        return Err(Error::Msg(log));
    }
    Ok(())
}
