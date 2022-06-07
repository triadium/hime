//! Module for the lexer and parser for HimeGrammar
//! WARNING: this file has been generated by
//! Hime Parser Generator 4.1.0

use std::io::Read;

use hime_redist::ast::AstNode;
use hime_redist::errors::ParseErrors;
use hime_redist::lexers::automaton::Automaton;
use hime_redist::lexers::impls::ContextFreeLexer;
use hime_redist::lexers::Lexer;
use hime_redist::parsers::lrk::{LRkAutomaton, LRkParser};
use hime_redist::parsers::Parser;
use hime_redist::result::ParseResult;
use hime_redist::symbols::{SemanticBody, SemanticElementTrait, Symbol};
use hime_redist::text::Text;
use hime_redist::tokens::TokenRepository;

/// Static resource for the serialized lexer automaton
const LEXER_AUTOMATON: &[u8] = include_bytes!("hime_grammar_lexer.bin");

/// The unique identifier for terminal SEPARATOR
pub const ID_TERMINAL_SEPARATOR: u32 = 0x0007;
/// The unique identifier for terminal NAME
pub const ID_TERMINAL_NAME: u32 = 0x0009;
/// The unique identifier for terminal INTEGER
pub const ID_TERMINAL_INTEGER: u32 = 0x000A;
/// The unique identifier for terminal LITERAL_STRING
pub const ID_TERMINAL_LITERAL_STRING: u32 = 0x000C;
/// The unique identifier for terminal LITERAL_ANY
pub const ID_TERMINAL_LITERAL_ANY: u32 = 0x000D;
/// The unique identifier for terminal LITERAL_TEXT
pub const ID_TERMINAL_LITERAL_TEXT: u32 = 0x000E;
/// The unique identifier for terminal LITERAL_CLASS
pub const ID_TERMINAL_LITERAL_CLASS: u32 = 0x000F;
/// The unique identifier for terminal UNICODE_BLOCK
pub const ID_TERMINAL_UNICODE_BLOCK: u32 = 0x0010;
/// The unique identifier for terminal UNICODE_CATEGORY
pub const ID_TERMINAL_UNICODE_CATEGORY: u32 = 0x0011;
/// The unique identifier for terminal UNICODE_CODEPOINT
pub const ID_TERMINAL_UNICODE_CODEPOINT: u32 = 0x0012;
/// The unique identifier for terminal UNICODE_SPAN_MARKER
pub const ID_TERMINAL_UNICODE_SPAN_MARKER: u32 = 0x0013;
/// The unique identifier for terminal OPERATOR_OPTIONAL
pub const ID_TERMINAL_OPERATOR_OPTIONAL: u32 = 0x0014;
/// The unique identifier for terminal OPERATOR_ZEROMORE
pub const ID_TERMINAL_OPERATOR_ZEROMORE: u32 = 0x0015;
/// The unique identifier for terminal OPERATOR_ONEMORE
pub const ID_TERMINAL_OPERATOR_ONEMORE: u32 = 0x0016;
/// The unique identifier for terminal OPERATOR_UNION
pub const ID_TERMINAL_OPERATOR_UNION: u32 = 0x0017;
/// The unique identifier for terminal OPERATOR_DIFFERENCE
pub const ID_TERMINAL_OPERATOR_DIFFERENCE: u32 = 0x0018;
/// The unique identifier for terminal TREE_ACTION_PROMOTE
pub const ID_TERMINAL_TREE_ACTION_PROMOTE: u32 = 0x0019;
/// The unique identifier for terminal TREE_ACTION_DROP
pub const ID_TERMINAL_TREE_ACTION_DROP: u32 = 0x001A;
/// The unique identifier for terminal BLOCK_OPTIONS
pub const ID_TERMINAL_BLOCK_OPTIONS: u32 = 0x001B;
/// The unique identifier for terminal BLOCK_TERMINALS
pub const ID_TERMINAL_BLOCK_TERMINALS: u32 = 0x001C;
/// The unique identifier for terminal BLOCK_RULES
pub const ID_TERMINAL_BLOCK_RULES: u32 = 0x001D;
/// The unique identifier for terminal BLOCK_CONTEXT
pub const ID_TERMINAL_BLOCK_CONTEXT: u32 = 0x001E;

/// The unique identifier for the default context
pub const CONTEXT_DEFAULT: u16 = 0;

/// The collection of terminals matched by this lexer
/// The terminals are in an order consistent with the automaton,
/// so that terminal indices in the automaton can be used to retrieve the terminals in this table
pub const TERMINALS: &[Symbol] = &[
    Symbol {
        id: 0x0001,
        name: "ε"
    },
    Symbol {
        id: 0x0002,
        name: "$"
    },
    Symbol {
        id: 0x0007,
        name: "SEPARATOR"
    },
    Symbol {
        id: 0x0009,
        name: "NAME"
    },
    Symbol {
        id: 0x000A,
        name: "INTEGER"
    },
    Symbol {
        id: 0x000C,
        name: "LITERAL_STRING"
    },
    Symbol {
        id: 0x000D,
        name: "LITERAL_ANY"
    },
    Symbol {
        id: 0x000E,
        name: "LITERAL_TEXT"
    },
    Symbol {
        id: 0x000F,
        name: "LITERAL_CLASS"
    },
    Symbol {
        id: 0x0010,
        name: "UNICODE_BLOCK"
    },
    Symbol {
        id: 0x0011,
        name: "UNICODE_CATEGORY"
    },
    Symbol {
        id: 0x0012,
        name: "UNICODE_CODEPOINT"
    },
    Symbol {
        id: 0x0013,
        name: "UNICODE_SPAN_MARKER"
    },
    Symbol {
        id: 0x0014,
        name: "OPERATOR_OPTIONAL"
    },
    Symbol {
        id: 0x0015,
        name: "OPERATOR_ZEROMORE"
    },
    Symbol {
        id: 0x0016,
        name: "OPERATOR_ONEMORE"
    },
    Symbol {
        id: 0x0017,
        name: "OPERATOR_UNION"
    },
    Symbol {
        id: 0x0018,
        name: "OPERATOR_DIFFERENCE"
    },
    Symbol {
        id: 0x0019,
        name: "TREE_ACTION_PROMOTE"
    },
    Symbol {
        id: 0x001A,
        name: "TREE_ACTION_DROP"
    },
    Symbol {
        id: 0x001B,
        name: "BLOCK_OPTIONS"
    },
    Symbol {
        id: 0x001C,
        name: "BLOCK_TERMINALS"
    },
    Symbol {
        id: 0x001D,
        name: "BLOCK_RULES"
    },
    Symbol {
        id: 0x001E,
        name: "BLOCK_CONTEXT"
    },
    Symbol {
        id: 0x0043,
        name: "="
    },
    Symbol {
        id: 0x0044,
        name: ";"
    },
    Symbol {
        id: 0x0045,
        name: "("
    },
    Symbol {
        id: 0x0046,
        name: ")"
    },
    Symbol {
        id: 0x0048,
        name: "{"
    },
    Symbol {
        id: 0x0049,
        name: ","
    },
    Symbol {
        id: 0x004A,
        name: "}"
    },
    Symbol {
        id: 0x004F,
        name: "->"
    },
    Symbol {
        id: 0x0050,
        name: "fragment"
    },
    Symbol {
        id: 0x0052,
        name: "@"
    },
    Symbol {
        id: 0x0053,
        name: "<"
    },
    Symbol {
        id: 0x0055,
        name: ">"
    },
    Symbol {
        id: 0x0056,
        name: "#"
    },
    Symbol {
        id: 0x005E,
        name: ":"
    },
    Symbol {
        id: 0x0060,
        name: "grammar"
    }
];

/// Creates a new lexer
fn new_lexer<'a: 'b, 'b, 'c>(
    repository: TokenRepository<'a, 'b, 'c>,
    errors: &'c mut ParseErrors<'a>
) -> Lexer<'a, 'b, 'c> {
    let automaton = Automaton::new(LEXER_AUTOMATON);
    Lexer::ContextFree(ContextFreeLexer::new(repository, errors, automaton, 0x0007))
}

/// Static resource for the serialized parser automaton
const PARSER_AUTOMATON: &[u8] = include_bytes!("hime_grammar_parser.bin");

/// The unique identifier for variable option
pub const ID_VARIABLE_OPTION: u32 = 0x001F;
/// The unique identifier for variable terminal_def_atom
pub const ID_VARIABLE_TERMINAL_DEF_ATOM: u32 = 0x0020;
/// The unique identifier for variable terminal_def_element
pub const ID_VARIABLE_TERMINAL_DEF_ELEMENT: u32 = 0x0021;
/// The unique identifier for variable terminal_def_cardinalilty
pub const ID_VARIABLE_TERMINAL_DEF_CARDINALILTY: u32 = 0x0022;
/// The unique identifier for variable terminal_def_repetition
pub const ID_VARIABLE_TERMINAL_DEF_REPETITION: u32 = 0x0023;
/// The unique identifier for variable terminal_def_fragment
pub const ID_VARIABLE_TERMINAL_DEF_FRAGMENT: u32 = 0x0024;
/// The unique identifier for variable terminal_def_restrict
pub const ID_VARIABLE_TERMINAL_DEF_RESTRICT: u32 = 0x0025;
/// The unique identifier for variable terminal_definition
pub const ID_VARIABLE_TERMINAL_DEFINITION: u32 = 0x0026;
/// The unique identifier for variable terminal_rule
pub const ID_VARIABLE_TERMINAL_RULE: u32 = 0x0027;
/// The unique identifier for variable terminal_fragment
pub const ID_VARIABLE_TERMINAL_FRAGMENT: u32 = 0x0028;
/// The unique identifier for variable terminal_context
pub const ID_VARIABLE_TERMINAL_CONTEXT: u32 = 0x0029;
/// The unique identifier for variable terminal_item
pub const ID_VARIABLE_TERMINAL_ITEM: u32 = 0x002A;
/// The unique identifier for variable rule_sym_action
pub const ID_VARIABLE_RULE_SYM_ACTION: u32 = 0x002B;
/// The unique identifier for variable rule_sym_virtual
pub const ID_VARIABLE_RULE_SYM_VIRTUAL: u32 = 0x002C;
/// The unique identifier for variable rule_sym_ref_params
pub const ID_VARIABLE_RULE_SYM_REF_PARAMS: u32 = 0x002D;
/// The unique identifier for variable rule_sym_ref_template
pub const ID_VARIABLE_RULE_SYM_REF_TEMPLATE: u32 = 0x002E;
/// The unique identifier for variable rule_sym_ref_simple
pub const ID_VARIABLE_RULE_SYM_REF_SIMPLE: u32 = 0x002F;
/// The unique identifier for variable rule_def_atom
pub const ID_VARIABLE_RULE_DEF_ATOM: u32 = 0x0030;
/// The unique identifier for variable rule_def_context
pub const ID_VARIABLE_RULE_DEF_CONTEXT: u32 = 0x0031;
/// The unique identifier for variable rule_def_sub
pub const ID_VARIABLE_RULE_DEF_SUB: u32 = 0x0032;
/// The unique identifier for variable rule_def_element
pub const ID_VARIABLE_RULE_DEF_ELEMENT: u32 = 0x0033;
/// The unique identifier for variable rule_def_tree_action
pub const ID_VARIABLE_RULE_DEF_TREE_ACTION: u32 = 0x0034;
/// The unique identifier for variable rule_def_repetition
pub const ID_VARIABLE_RULE_DEF_REPETITION: u32 = 0x0035;
/// The unique identifier for variable rule_def_fragment
pub const ID_VARIABLE_RULE_DEF_FRAGMENT: u32 = 0x0036;
/// The unique identifier for variable rule_def_choice
pub const ID_VARIABLE_RULE_DEF_CHOICE: u32 = 0x0037;
/// The unique identifier for variable rule_definition
pub const ID_VARIABLE_RULE_DEFINITION: u32 = 0x0038;
/// The unique identifier for variable rule_template_params
pub const ID_VARIABLE_RULE_TEMPLATE_PARAMS: u32 = 0x0039;
/// The unique identifier for variable cf_rule_template
pub const ID_VARIABLE_CF_RULE_TEMPLATE: u32 = 0x003A;
/// The unique identifier for variable cf_rule_simple
pub const ID_VARIABLE_CF_RULE_SIMPLE: u32 = 0x003B;
/// The unique identifier for variable cf_rule
pub const ID_VARIABLE_CF_RULE: u32 = 0x003C;
/// The unique identifier for variable grammar_options
pub const ID_VARIABLE_GRAMMAR_OPTIONS: u32 = 0x003D;
/// The unique identifier for variable grammar_terminals
pub const ID_VARIABLE_GRAMMAR_TERMINALS: u32 = 0x003E;
/// The unique identifier for variable grammar_cf_rules
pub const ID_VARIABLE_GRAMMAR_CF_RULES: u32 = 0x003F;
/// The unique identifier for variable grammar_parency
pub const ID_VARIABLE_GRAMMAR_PARENCY: u32 = 0x0040;
/// The unique identifier for variable cf_grammar
pub const ID_VARIABLE_CF_GRAMMAR: u32 = 0x0041;
/// The unique identifier for variable file
pub const ID_VARIABLE_FILE: u32 = 0x0042;

/// The unique identifier for virtual range
pub const ID_VIRTUAL_RANGE: u32 = 0x0047;
/// The unique identifier for virtual concat
pub const ID_VIRTUAL_CONCAT: u32 = 0x004B;
/// The unique identifier for virtual emptypart
pub const ID_VIRTUAL_EMPTYPART: u32 = 0x0058;

/// The collection of variables matched by this parser
/// The variables are in an order consistent with the automaton,
/// so that variable indices in the automaton can be used to retrieve the variables in this table
pub const VARIABLES: &[Symbol] = &[
    Symbol {
        id: 0x001F,
        name: "option"
    },
    Symbol {
        id: 0x0020,
        name: "terminal_def_atom"
    },
    Symbol {
        id: 0x0021,
        name: "terminal_def_element"
    },
    Symbol {
        id: 0x0022,
        name: "terminal_def_cardinalilty"
    },
    Symbol {
        id: 0x0023,
        name: "terminal_def_repetition"
    },
    Symbol {
        id: 0x0024,
        name: "terminal_def_fragment"
    },
    Symbol {
        id: 0x0025,
        name: "terminal_def_restrict"
    },
    Symbol {
        id: 0x0026,
        name: "terminal_definition"
    },
    Symbol {
        id: 0x0027,
        name: "terminal_rule"
    },
    Symbol {
        id: 0x0028,
        name: "terminal_fragment"
    },
    Symbol {
        id: 0x0029,
        name: "terminal_context"
    },
    Symbol {
        id: 0x002A,
        name: "terminal_item"
    },
    Symbol {
        id: 0x002B,
        name: "rule_sym_action"
    },
    Symbol {
        id: 0x002C,
        name: "rule_sym_virtual"
    },
    Symbol {
        id: 0x002D,
        name: "rule_sym_ref_params"
    },
    Symbol {
        id: 0x002E,
        name: "rule_sym_ref_template"
    },
    Symbol {
        id: 0x002F,
        name: "rule_sym_ref_simple"
    },
    Symbol {
        id: 0x0030,
        name: "rule_def_atom"
    },
    Symbol {
        id: 0x0031,
        name: "rule_def_context"
    },
    Symbol {
        id: 0x0032,
        name: "rule_def_sub"
    },
    Symbol {
        id: 0x0033,
        name: "rule_def_element"
    },
    Symbol {
        id: 0x0034,
        name: "rule_def_tree_action"
    },
    Symbol {
        id: 0x0035,
        name: "rule_def_repetition"
    },
    Symbol {
        id: 0x0036,
        name: "rule_def_fragment"
    },
    Symbol {
        id: 0x0037,
        name: "rule_def_choice"
    },
    Symbol {
        id: 0x0038,
        name: "rule_definition"
    },
    Symbol {
        id: 0x0039,
        name: "rule_template_params"
    },
    Symbol {
        id: 0x003A,
        name: "cf_rule_template"
    },
    Symbol {
        id: 0x003B,
        name: "cf_rule_simple"
    },
    Symbol {
        id: 0x003C,
        name: "cf_rule"
    },
    Symbol {
        id: 0x003D,
        name: "grammar_options"
    },
    Symbol {
        id: 0x003E,
        name: "grammar_terminals"
    },
    Symbol {
        id: 0x003F,
        name: "grammar_cf_rules"
    },
    Symbol {
        id: 0x0040,
        name: "grammar_parency"
    },
    Symbol {
        id: 0x0041,
        name: "cf_grammar"
    },
    Symbol {
        id: 0x0042,
        name: "file"
    },
    Symbol {
        id: 0x004C,
        name: "__V76"
    },
    Symbol {
        id: 0x004D,
        name: "__V77"
    },
    Symbol {
        id: 0x004E,
        name: "__V78"
    },
    Symbol {
        id: 0x0051,
        name: "__V81"
    },
    Symbol {
        id: 0x0054,
        name: "__V84"
    },
    Symbol {
        id: 0x0057,
        name: "__V87"
    },
    Symbol {
        id: 0x0059,
        name: "__V89"
    },
    Symbol {
        id: 0x005A,
        name: "__V90"
    },
    Symbol {
        id: 0x005B,
        name: "__V91"
    },
    Symbol {
        id: 0x005C,
        name: "__V92"
    },
    Symbol {
        id: 0x005D,
        name: "__V93"
    },
    Symbol {
        id: 0x005F,
        name: "__V95"
    },
    Symbol {
        id: 0x0061,
        name: "__V97"
    },
    Symbol {
        id: 0x0062,
        name: "__VAxiom"
    }
];

/// The collection of virtuals matched by this parser
/// The virtuals are in an order consistent with the automaton,
/// so that virtual indices in the automaton can be used to retrieve the virtuals in this table
pub const VIRTUALS: &[Symbol] = &[
    Symbol {
        id: 0x0047,
        name: "range"
    },
    Symbol {
        id: 0x004B,
        name: "concat"
    },
    Symbol {
        id: 0x0058,
        name: "emptypart"
    }
];

/// Parses the specified string with this parser
pub fn parse_str<'t>(input: &'t str) -> ParseResult<'static, 't, 'static> {
    let text = Text::from_str(input);
    parse_text(text)
}

/// Parses the specified string with this parser
pub fn parse_string(input: String) -> ParseResult<'static, 'static, 'static> {
    let text = Text::from_string(input);
    parse_text(text)
}

/// Parses the specified stream of UTF-8 with this parser
pub fn parse_utf8_stream(input: &mut dyn Read) -> ParseResult<'static, 'static, 'static> {
    let text = Text::from_utf8_stream(input).unwrap();
    parse_text(text)
}

/// Parses the specified text with this parser
fn parse_text<'t>(text: Text<'t>) -> ParseResult<'static, 't, 'static> {
    parse_text_with(text, TERMINALS, VARIABLES, VIRTUALS)
}

/// Parses the specified text with this parser
fn parse_text_with<'s, 't, 'a>(
    text: Text<'t>,
    terminals: &'a [Symbol<'s>],
    variables: &'a [Symbol<'s>],
    virtuals: &'a [Symbol<'s>]
) -> ParseResult<'s, 't, 'a> {
    let mut my_actions = |_index: usize, _head: Symbol, _body: &dyn SemanticBody| ();
    let mut result = ParseResult::new(terminals, variables, virtuals, text);
    {
        let data = result.get_parsing_data();
        let mut lexer = new_lexer(data.0, data.1);
        let automaton = LRkAutomaton::new(PARSER_AUTOMATON);
        let mut parser = LRkParser::new(&mut lexer, automaton, data.2, &mut my_actions);
        parser.parse();
    }
    result
}

/// Visitor interface
pub trait Visitor {
    fn on_terminal_separator(&self, _node: &AstNode) {}
    fn on_terminal_name(&self, _node: &AstNode) {}
    fn on_terminal_integer(&self, _node: &AstNode) {}
    fn on_terminal_literal_string(&self, _node: &AstNode) {}
    fn on_terminal_literal_any(&self, _node: &AstNode) {}
    fn on_terminal_literal_text(&self, _node: &AstNode) {}
    fn on_terminal_literal_class(&self, _node: &AstNode) {}
    fn on_terminal_unicode_block(&self, _node: &AstNode) {}
    fn on_terminal_unicode_category(&self, _node: &AstNode) {}
    fn on_terminal_unicode_codepoint(&self, _node: &AstNode) {}
    fn on_terminal_unicode_span_marker(&self, _node: &AstNode) {}
    fn on_terminal_operator_optional(&self, _node: &AstNode) {}
    fn on_terminal_operator_zeromore(&self, _node: &AstNode) {}
    fn on_terminal_operator_onemore(&self, _node: &AstNode) {}
    fn on_terminal_operator_union(&self, _node: &AstNode) {}
    fn on_terminal_operator_difference(&self, _node: &AstNode) {}
    fn on_terminal_tree_action_promote(&self, _node: &AstNode) {}
    fn on_terminal_tree_action_drop(&self, _node: &AstNode) {}
    fn on_terminal_block_options(&self, _node: &AstNode) {}
    fn on_terminal_block_terminals(&self, _node: &AstNode) {}
    fn on_terminal_block_rules(&self, _node: &AstNode) {}
    fn on_terminal_block_context(&self, _node: &AstNode) {}
    fn on_variable_option(&self, _node: &AstNode) {}
    fn on_variable_terminal_def_atom(&self, _node: &AstNode) {}
    fn on_variable_terminal_def_element(&self, _node: &AstNode) {}
    fn on_variable_terminal_def_cardinalilty(&self, _node: &AstNode) {}
    fn on_variable_terminal_def_repetition(&self, _node: &AstNode) {}
    fn on_variable_terminal_def_fragment(&self, _node: &AstNode) {}
    fn on_variable_terminal_def_restrict(&self, _node: &AstNode) {}
    fn on_variable_terminal_definition(&self, _node: &AstNode) {}
    fn on_variable_terminal_rule(&self, _node: &AstNode) {}
    fn on_variable_terminal_fragment(&self, _node: &AstNode) {}
    fn on_variable_terminal_context(&self, _node: &AstNode) {}
    fn on_variable_terminal_item(&self, _node: &AstNode) {}
    fn on_variable_rule_sym_action(&self, _node: &AstNode) {}
    fn on_variable_rule_sym_virtual(&self, _node: &AstNode) {}
    fn on_variable_rule_sym_ref_params(&self, _node: &AstNode) {}
    fn on_variable_rule_sym_ref_template(&self, _node: &AstNode) {}
    fn on_variable_rule_sym_ref_simple(&self, _node: &AstNode) {}
    fn on_variable_rule_def_atom(&self, _node: &AstNode) {}
    fn on_variable_rule_def_context(&self, _node: &AstNode) {}
    fn on_variable_rule_def_sub(&self, _node: &AstNode) {}
    fn on_variable_rule_def_element(&self, _node: &AstNode) {}
    fn on_variable_rule_def_tree_action(&self, _node: &AstNode) {}
    fn on_variable_rule_def_repetition(&self, _node: &AstNode) {}
    fn on_variable_rule_def_fragment(&self, _node: &AstNode) {}
    fn on_variable_rule_def_choice(&self, _node: &AstNode) {}
    fn on_variable_rule_definition(&self, _node: &AstNode) {}
    fn on_variable_rule_template_params(&self, _node: &AstNode) {}
    fn on_variable_cf_rule_template(&self, _node: &AstNode) {}
    fn on_variable_cf_rule_simple(&self, _node: &AstNode) {}
    fn on_variable_cf_rule(&self, _node: &AstNode) {}
    fn on_variable_grammar_options(&self, _node: &AstNode) {}
    fn on_variable_grammar_terminals(&self, _node: &AstNode) {}
    fn on_variable_grammar_cf_rules(&self, _node: &AstNode) {}
    fn on_variable_grammar_parency(&self, _node: &AstNode) {}
    fn on_variable_cf_grammar(&self, _node: &AstNode) {}
    fn on_variable_file(&self, _node: &AstNode) {}
    fn on_virtual_range(&self, _node: &AstNode) {}
    fn on_virtual_concat(&self, _node: &AstNode) {}
    fn on_virtual_emptypart(&self, _node: &AstNode) {}
}

/// Walk the AST of a result using a visitor
pub fn visit(result: &ParseResult, visitor: &dyn Visitor) {
    let ast = result.get_ast();
    let root = ast.get_root();
    visit_ast_node(root, visitor);
}

/// Walk the sub-AST from the specified node using a visitor
pub fn visit_ast_node(node: AstNode, visitor: &dyn Visitor) {
    let children = node.children();
    for child in children.iter() {
        visit_ast_node(child, visitor);
    }
    match node.get_symbol().id {
        0x0007 => visitor.on_terminal_separator(&node),
        0x0009 => visitor.on_terminal_name(&node),
        0x000A => visitor.on_terminal_integer(&node),
        0x000C => visitor.on_terminal_literal_string(&node),
        0x000D => visitor.on_terminal_literal_any(&node),
        0x000E => visitor.on_terminal_literal_text(&node),
        0x000F => visitor.on_terminal_literal_class(&node),
        0x0010 => visitor.on_terminal_unicode_block(&node),
        0x0011 => visitor.on_terminal_unicode_category(&node),
        0x0012 => visitor.on_terminal_unicode_codepoint(&node),
        0x0013 => visitor.on_terminal_unicode_span_marker(&node),
        0x0014 => visitor.on_terminal_operator_optional(&node),
        0x0015 => visitor.on_terminal_operator_zeromore(&node),
        0x0016 => visitor.on_terminal_operator_onemore(&node),
        0x0017 => visitor.on_terminal_operator_union(&node),
        0x0018 => visitor.on_terminal_operator_difference(&node),
        0x0019 => visitor.on_terminal_tree_action_promote(&node),
        0x001A => visitor.on_terminal_tree_action_drop(&node),
        0x001B => visitor.on_terminal_block_options(&node),
        0x001C => visitor.on_terminal_block_terminals(&node),
        0x001D => visitor.on_terminal_block_rules(&node),
        0x001E => visitor.on_terminal_block_context(&node),
        0x001F => visitor.on_variable_option(&node),
        0x0020 => visitor.on_variable_terminal_def_atom(&node),
        0x0021 => visitor.on_variable_terminal_def_element(&node),
        0x0022 => visitor.on_variable_terminal_def_cardinalilty(&node),
        0x0023 => visitor.on_variable_terminal_def_repetition(&node),
        0x0024 => visitor.on_variable_terminal_def_fragment(&node),
        0x0025 => visitor.on_variable_terminal_def_restrict(&node),
        0x0026 => visitor.on_variable_terminal_definition(&node),
        0x0027 => visitor.on_variable_terminal_rule(&node),
        0x0028 => visitor.on_variable_terminal_fragment(&node),
        0x0029 => visitor.on_variable_terminal_context(&node),
        0x002A => visitor.on_variable_terminal_item(&node),
        0x002B => visitor.on_variable_rule_sym_action(&node),
        0x002C => visitor.on_variable_rule_sym_virtual(&node),
        0x002D => visitor.on_variable_rule_sym_ref_params(&node),
        0x002E => visitor.on_variable_rule_sym_ref_template(&node),
        0x002F => visitor.on_variable_rule_sym_ref_simple(&node),
        0x0030 => visitor.on_variable_rule_def_atom(&node),
        0x0031 => visitor.on_variable_rule_def_context(&node),
        0x0032 => visitor.on_variable_rule_def_sub(&node),
        0x0033 => visitor.on_variable_rule_def_element(&node),
        0x0034 => visitor.on_variable_rule_def_tree_action(&node),
        0x0035 => visitor.on_variable_rule_def_repetition(&node),
        0x0036 => visitor.on_variable_rule_def_fragment(&node),
        0x0037 => visitor.on_variable_rule_def_choice(&node),
        0x0038 => visitor.on_variable_rule_definition(&node),
        0x0039 => visitor.on_variable_rule_template_params(&node),
        0x003A => visitor.on_variable_cf_rule_template(&node),
        0x003B => visitor.on_variable_cf_rule_simple(&node),
        0x003C => visitor.on_variable_cf_rule(&node),
        0x003D => visitor.on_variable_grammar_options(&node),
        0x003E => visitor.on_variable_grammar_terminals(&node),
        0x003F => visitor.on_variable_grammar_cf_rules(&node),
        0x0040 => visitor.on_variable_grammar_parency(&node),
        0x0041 => visitor.on_variable_cf_grammar(&node),
        0x0042 => visitor.on_variable_file(&node),
        0x0047 => visitor.on_virtual_range(&node),
        0x004B => visitor.on_virtual_concat(&node),
        0x0058 => visitor.on_virtual_emptypart(&node),
        _ => ()
    };
}
