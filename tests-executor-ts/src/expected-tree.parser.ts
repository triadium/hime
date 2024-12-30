/*
 * WARNING: this file has been generated by
 * Hime Parser Generator 4.4.0
 */

import { readFile } from 'fs/promises'
import {
  ArrayCopy,
  ASTNode,
  BinaryReader,
  GSymbol,
  ParseResult,
  LRkAutomaton,
  LRkParser,
  SemanticAction,
  SemanticBody,
} from 'hime-redist-ts'

import { ExpectedTreeLexer } from './expected-tree.lexer'
/**
 * Represents a parser (namespace ExpectedTree)
 * @internal
 *
 * Hime.SDK 4.4.0
 */
export class ExpectedTreeParser extends LRkParser {
  /**
   * The collection of variables matched by this parser
   *
   * @remarks
   *
   * The variables are in an order consistent with the automaton,
   * so that variable indices in the automaton can be used to retrieve the variables in this table
   */
  static readonly variables: GSymbol[] = [
    new GSymbol(0x001F, 'option'),
    new GSymbol(0x0020, 'terminal_def_atom'),
    new GSymbol(0x0021, 'terminal_def_element'),
    new GSymbol(0x0022, 'terminal_def_cardinalilty'),
    new GSymbol(0x0023, 'terminal_def_repetition'),
    new GSymbol(0x0024, 'terminal_def_fragment'),
    new GSymbol(0x0025, 'terminal_def_restrict'),
    new GSymbol(0x0026, 'terminal_definition'),
    new GSymbol(0x0027, 'terminal_rule'),
    new GSymbol(0x0028, 'terminal_fragment'),
    new GSymbol(0x0029, 'terminal_context'),
    new GSymbol(0x002A, 'terminal_item'),
    new GSymbol(0x002B, 'rule_sym_action'),
    new GSymbol(0x002C, 'rule_sym_virtual'),
    new GSymbol(0x002D, 'rule_sym_ref_params'),
    new GSymbol(0x002E, 'rule_sym_ref_template'),
    new GSymbol(0x002F, 'rule_sym_ref_simple'),
    new GSymbol(0x0030, 'rule_def_atom'),
    new GSymbol(0x0031, 'rule_def_context'),
    new GSymbol(0x0032, 'rule_def_sub'),
    new GSymbol(0x0033, 'rule_def_element'),
    new GSymbol(0x0034, 'rule_def_tree_action'),
    new GSymbol(0x0035, 'rule_def_repetition'),
    new GSymbol(0x0036, 'rule_def_fragment'),
    new GSymbol(0x0037, 'rule_def_choice'),
    new GSymbol(0x0038, 'rule_definition'),
    new GSymbol(0x0039, 'rule_template_params'),
    new GSymbol(0x003A, 'cf_rule_template'),
    new GSymbol(0x003B, 'cf_rule_simple'),
    new GSymbol(0x003C, 'cf_rule'),
    new GSymbol(0x003D, 'grammar_options'),
    new GSymbol(0x003E, 'grammar_terminals'),
    new GSymbol(0x003F, 'grammar_cf_rules'),
    new GSymbol(0x0040, 'grammar_parency'),
    new GSymbol(0x0041, 'cf_grammar'),
    new GSymbol(0x0042, 'file'),
    new GSymbol(0x004C, '__V76'),
    new GSymbol(0x004D, '__V77'),
    new GSymbol(0x004E, '__V78'),
    new GSymbol(0x0051, '__V81'),
    new GSymbol(0x0054, '__V84'),
    new GSymbol(0x0057, '__V87'),
    new GSymbol(0x0059, '__V89'),
    new GSymbol(0x005A, '__V90'),
    new GSymbol(0x005B, '__V91'),
    new GSymbol(0x005C, '__V92'),
    new GSymbol(0x005D, '__V93'),
    new GSymbol(0x005F, '__V95'),
    new GSymbol(0x0061, '__V97'),
    new GSymbol(0x0063, 'fixture'),
    new GSymbol(0x0064, 'header'),
    new GSymbol(0x0065, 'test'),
    new GSymbol(0x0066, 'test_matches'),
    new GSymbol(0x0067, 'test_no_match'),
    new GSymbol(0x0068, 'test_fails'),
    new GSymbol(0x0069, 'test_output'),
    new GSymbol(0x006A, 'tree'),
    new GSymbol(0x006B, 'check'),
    new GSymbol(0x006C, 'children'),
    new GSymbol(0x006D, '__V109'),
    new GSymbol(0x0076, '__V118'),
    new GSymbol(0x0077, '__V119'),
    new GSymbol(0x0079, '__V121'),
    new GSymbol(0x007A, '__VAxiom'),
  ]
  /**
   * The collection of virtuals matched by this parser
   *
   *
   * The virtuals are in an order consistent with the automaton,
   * so that virtual indices in the automaton can be used to retrieve the virtuals in this table
   */
  private static readonly virtuals: GSymbol[] = [
    new GSymbol(0x0047, 'range'),
    new GSymbol(0x004B, 'concat'),
    new GSymbol(0x0058, 'emptypart'),
  ]

  /**
   * Walk the AST of a result using a visitor
   * 
   * @param result - The parse result
   * @param visitor - The visitor to use
   */
  static visit(result: ParseResult, visitor: ExpectedTreeParser.Visitor): void {
    this.visitASTNode(result.Root, visitor)
  }

  /**
   * Walk the sub-AST from the specified node using a visitor
   * 
   * @param node - The AST node to start from
   * @param visitor - The visitor to use
   */
  static visitASTNode(node: ASTNode, visitor: ExpectedTreeParser.Visitor): void {
    for (let i = 0; i < node.Children.Count; ++i) {
      this.visitASTNode(node.Children[i]!, visitor)
    }
    switch (node.Symbol.ID) {
      case 0x0007: visitor.onTerminalSeparator(node); break;
      case 0x0009: visitor.onTerminalName(node); break;
      case 0x000A: visitor.onTerminalInteger(node); break;
      case 0x000C: visitor.onTerminalLiteralString(node); break;
      case 0x000D: visitor.onTerminalLiteralAny(node); break;
      case 0x000E: visitor.onTerminalLiteralText(node); break;
      case 0x000F: visitor.onTerminalLiteralClass(node); break;
      case 0x0010: visitor.onTerminalUnicodeBlock(node); break;
      case 0x0011: visitor.onTerminalUnicodeCategory(node); break;
      case 0x0012: visitor.onTerminalUnicodeCodepoint(node); break;
      case 0x0013: visitor.onTerminalUnicodeSpanMarker(node); break;
      case 0x0014: visitor.onTerminalOperatorOptional(node); break;
      case 0x0015: visitor.onTerminalOperatorZeromore(node); break;
      case 0x0016: visitor.onTerminalOperatorOnemore(node); break;
      case 0x0017: visitor.onTerminalOperatorUnion(node); break;
      case 0x0018: visitor.onTerminalOperatorDifference(node); break;
      case 0x0019: visitor.onTerminalTreeActionPromote(node); break;
      case 0x001A: visitor.onTerminalTreeActionDrop(node); break;
      case 0x001B: visitor.onTerminalBlockOptions(node); break;
      case 0x001C: visitor.onTerminalBlockTerminals(node); break;
      case 0x001D: visitor.onTerminalBlockRules(node); break;
      case 0x001E: visitor.onTerminalBlockContext(node); break;
      case 0x0062: visitor.onTerminalNodeName(node); break;
      case 0x001F: visitor.onVariableOption(node); break;
      case 0x0020: visitor.onVariableTerminalDefAtom(node); break;
      case 0x0021: visitor.onVariableTerminalDefElement(node); break;
      case 0x0022: visitor.onVariableTerminalDefCardinalilty(node); break;
      case 0x0023: visitor.onVariableTerminalDefRepetition(node); break;
      case 0x0024: visitor.onVariableTerminalDefFragment(node); break;
      case 0x0025: visitor.onVariableTerminalDefRestrict(node); break;
      case 0x0026: visitor.onVariableTerminalDefinition(node); break;
      case 0x0027: visitor.onVariableTerminalRule(node); break;
      case 0x0028: visitor.onVariableTerminalFragment(node); break;
      case 0x0029: visitor.onVariableTerminalContext(node); break;
      case 0x002A: visitor.onVariableTerminalItem(node); break;
      case 0x002B: visitor.onVariableRuleSymAction(node); break;
      case 0x002C: visitor.onVariableRuleSymVirtual(node); break;
      case 0x002D: visitor.onVariableRuleSymRefParams(node); break;
      case 0x002E: visitor.onVariableRuleSymRefTemplate(node); break;
      case 0x002F: visitor.onVariableRuleSymRefSimple(node); break;
      case 0x0030: visitor.onVariableRuleDefAtom(node); break;
      case 0x0031: visitor.onVariableRuleDefContext(node); break;
      case 0x0032: visitor.onVariableRuleDefSub(node); break;
      case 0x0033: visitor.onVariableRuleDefElement(node); break;
      case 0x0034: visitor.onVariableRuleDefTreeAction(node); break;
      case 0x0035: visitor.onVariableRuleDefRepetition(node); break;
      case 0x0036: visitor.onVariableRuleDefFragment(node); break;
      case 0x0037: visitor.onVariableRuleDefChoice(node); break;
      case 0x0038: visitor.onVariableRuleDefinition(node); break;
      case 0x0039: visitor.onVariableRuleTemplateParams(node); break;
      case 0x003A: visitor.onVariableCfRuleTemplate(node); break;
      case 0x003B: visitor.onVariableCfRuleSimple(node); break;
      case 0x003C: visitor.onVariableCfRule(node); break;
      case 0x003D: visitor.onVariableGrammarOptions(node); break;
      case 0x003E: visitor.onVariableGrammarTerminals(node); break;
      case 0x003F: visitor.onVariableGrammarCfRules(node); break;
      case 0x0040: visitor.onVariableGrammarParency(node); break;
      case 0x0041: visitor.onVariableCfGrammar(node); break;
      case 0x0042: visitor.onVariableFile(node); break;
      case 0x0063: visitor.onVariableFixture(node); break;
      case 0x0064: visitor.onVariableHeader(node); break;
      case 0x0065: visitor.onVariableTest(node); break;
      case 0x0066: visitor.onVariableTestMatches(node); break;
      case 0x0067: visitor.onVariableTestNoMatch(node); break;
      case 0x0068: visitor.onVariableTestFails(node); break;
      case 0x0069: visitor.onVariableTestOutput(node); break;
      case 0x006A: visitor.onVariableTree(node); break;
      case 0x006B: visitor.onVariableCheck(node); break;
      case 0x006C: visitor.onVariableChildren(node); break;
      case 0x0047: visitor.onVirtualRange(node); break;
      case 0x004B: visitor.onVirtualConcat(node); break;
      case 0x0058: visitor.onVirtualEmptypart(node); break;
    }
  }

  /**
   * Initializes a new instance of the parser
   *
   * @param automaton - The parser's automaton
   * @param actions - The set of semantic actions
   * @param lexer - The input lexer
   */
  constructor(automaton: LRkAutomaton, actions: SemanticAction[], lexer: ExpectedTreeLexer) {
    super(automaton, ExpectedTreeParser.variables, ExpectedTreeParser.virtuals, actions, lexer)
  }

  /**
   * Initializes a new instance of the parser from string input
   *
   * @param input - The input
   */
  static async fromString(input: string) {
    const lexer = await ExpectedTreeLexer.fromString(input)
    const buffer = await readFile('./expected-tree.parser.bin')
    const automaton = new LRkAutomaton(BinaryReader.Create(buffer))
    return new ExpectedTreeParser(automaton, [], lexer)
  }

  /**
   * Prints the result of the parsing
   *
   * @param result - The result of the parsing
   */
  static Print(result: ParseResult): void {
    if (result.IsSuccess) {
      const output: string[] = []
      this.PrintNode(result.Root, new Array<boolean>(), output)
      console.log(output.join(''))
    }
    else {
      for (const err of result.Errors) {
        console.log(err)
      }
    }
  }

  /**
   * Prints the node of the parsing
   *
   * @param node - The node of the parsing
   * @param crossings - The crossings flags
   * @param output - The array of output lines
   */
  static PrintNode(node: ASTNode, crossings: boolean[], output: string[]): void {
    const line: string[] = []
    for (let i = 0; i < crossings.length - 1; ++i) {
      line.push(crossings[i] ? '|   ' : '    ')
    }
    if (crossings.length > 0) {
      line.push('+-> ')
    }
    line.push(node.toString())
    line.push('\n')
    output.push(line.join(''))
    for (let i = 0; i < node.Children.Count; ++i) {
      const childCrossings = new Array<boolean>(crossings.length + 1)
      ArrayCopy(crossings, 0, childCrossings, 0, crossings.length)
      childCrossings[childCrossings.length - 1] = (i < node.Children.Count - 1)
      this.PrintNode(node.Children[i]!, childCrossings, output)
    }
  }
}

export namespace ExpectedTreeParser {
  /**
   * Contains the constant IDs for the variables and virtuals in this parser
   *
   * Hime.SDK 4.4.0
   */
  export enum ID {
    /**
     * The unique identifier for variable option
     */
    VariableOption = 0x001F,
    /**
     * The unique identifier for variable terminal_def_atom
     */
    VariableTerminalDefAtom = 0x0020,
    /**
     * The unique identifier for variable terminal_def_element
     */
    VariableTerminalDefElement = 0x0021,
    /**
     * The unique identifier for variable terminal_def_cardinalilty
     */
    VariableTerminalDefCardinalilty = 0x0022,
    /**
     * The unique identifier for variable terminal_def_repetition
     */
    VariableTerminalDefRepetition = 0x0023,
    /**
     * The unique identifier for variable terminal_def_fragment
     */
    VariableTerminalDefFragment = 0x0024,
    /**
     * The unique identifier for variable terminal_def_restrict
     */
    VariableTerminalDefRestrict = 0x0025,
    /**
     * The unique identifier for variable terminal_definition
     */
    VariableTerminalDefinition = 0x0026,
    /**
     * The unique identifier for variable terminal_rule
     */
    VariableTerminalRule = 0x0027,
    /**
     * The unique identifier for variable terminal_fragment
     */
    VariableTerminalFragment = 0x0028,
    /**
     * The unique identifier for variable terminal_context
     */
    VariableTerminalContext = 0x0029,
    /**
     * The unique identifier for variable terminal_item
     */
    VariableTerminalItem = 0x002A,
    /**
     * The unique identifier for variable rule_sym_action
     */
    VariableRuleSymAction = 0x002B,
    /**
     * The unique identifier for variable rule_sym_virtual
     */
    VariableRuleSymVirtual = 0x002C,
    /**
     * The unique identifier for variable rule_sym_ref_params
     */
    VariableRuleSymRefParams = 0x002D,
    /**
     * The unique identifier for variable rule_sym_ref_template
     */
    VariableRuleSymRefTemplate = 0x002E,
    /**
     * The unique identifier for variable rule_sym_ref_simple
     */
    VariableRuleSymRefSimple = 0x002F,
    /**
     * The unique identifier for variable rule_def_atom
     */
    VariableRuleDefAtom = 0x0030,
    /**
     * The unique identifier for variable rule_def_context
     */
    VariableRuleDefContext = 0x0031,
    /**
     * The unique identifier for variable rule_def_sub
     */
    VariableRuleDefSub = 0x0032,
    /**
     * The unique identifier for variable rule_def_element
     */
    VariableRuleDefElement = 0x0033,
    /**
     * The unique identifier for variable rule_def_tree_action
     */
    VariableRuleDefTreeAction = 0x0034,
    /**
     * The unique identifier for variable rule_def_repetition
     */
    VariableRuleDefRepetition = 0x0035,
    /**
     * The unique identifier for variable rule_def_fragment
     */
    VariableRuleDefFragment = 0x0036,
    /**
     * The unique identifier for variable rule_def_choice
     */
    VariableRuleDefChoice = 0x0037,
    /**
     * The unique identifier for variable rule_definition
     */
    VariableRuleDefinition = 0x0038,
    /**
     * The unique identifier for variable rule_template_params
     */
    VariableRuleTemplateParams = 0x0039,
    /**
     * The unique identifier for variable cf_rule_template
     */
    VariableCfRuleTemplate = 0x003A,
    /**
     * The unique identifier for variable cf_rule_simple
     */
    VariableCfRuleSimple = 0x003B,
    /**
     * The unique identifier for variable cf_rule
     */
    VariableCfRule = 0x003C,
    /**
     * The unique identifier for variable grammar_options
     */
    VariableGrammarOptions = 0x003D,
    /**
     * The unique identifier for variable grammar_terminals
     */
    VariableGrammarTerminals = 0x003E,
    /**
     * The unique identifier for variable grammar_cf_rules
     */
    VariableGrammarCfRules = 0x003F,
    /**
     * The unique identifier for variable grammar_parency
     */
    VariableGrammarParency = 0x0040,
    /**
     * The unique identifier for variable cf_grammar
     */
    VariableCfGrammar = 0x0041,
    /**
     * The unique identifier for variable file
     */
    VariableFile = 0x0042,
    /**
     * The unique identifier for variable fixture
     */
    VariableFixture = 0x0063,
    /**
     * The unique identifier for variable header
     */
    VariableHeader = 0x0064,
    /**
     * The unique identifier for variable test
     */
    VariableTest = 0x0065,
    /**
     * The unique identifier for variable test_matches
     */
    VariableTestMatches = 0x0066,
    /**
     * The unique identifier for variable test_no_match
     */
    VariableTestNoMatch = 0x0067,
    /**
     * The unique identifier for variable test_fails
     */
    VariableTestFails = 0x0068,
    /**
     * The unique identifier for variable test_output
     */
    VariableTestOutput = 0x0069,
    /**
     * The unique identifier for variable tree
     */
    VariableTree = 0x006A,
    /**
     * The unique identifier for variable check
     */
    VariableCheck = 0x006B,
    /**
     * The unique identifier for variable children
     */
    VariableChildren = 0x006C,
    /**
     * The unique identifier for virtual range
     */
    VirtualRange = 0x0047,
    /**
     * The unique identifier for virtual concat
     */
    VirtualConcat = 0x004B,
    /**
     * The unique identifier for virtual emptypart
     */
    VirtualEmptypart = 0x0058,
  }

  /**
   * Default visitor class
   */
  export class Visitor {
    onTerminalSeparator(_: ASTNode): void { }
    onTerminalName(_: ASTNode): void { }
    onTerminalInteger(_: ASTNode): void { }
    onTerminalLiteralString(_: ASTNode): void { }
    onTerminalLiteralAny(_: ASTNode): void { }
    onTerminalLiteralText(_: ASTNode): void { }
    onTerminalLiteralClass(_: ASTNode): void { }
    onTerminalUnicodeBlock(_: ASTNode): void { }
    onTerminalUnicodeCategory(_: ASTNode): void { }
    onTerminalUnicodeCodepoint(_: ASTNode): void { }
    onTerminalUnicodeSpanMarker(_: ASTNode): void { }
    onTerminalOperatorOptional(_: ASTNode): void { }
    onTerminalOperatorZeromore(_: ASTNode): void { }
    onTerminalOperatorOnemore(_: ASTNode): void { }
    onTerminalOperatorUnion(_: ASTNode): void { }
    onTerminalOperatorDifference(_: ASTNode): void { }
    onTerminalTreeActionPromote(_: ASTNode): void { }
    onTerminalTreeActionDrop(_: ASTNode): void { }
    onTerminalBlockOptions(_: ASTNode): void { }
    onTerminalBlockTerminals(_: ASTNode): void { }
    onTerminalBlockRules(_: ASTNode): void { }
    onTerminalBlockContext(_: ASTNode): void { }
    onTerminalNodeName(_: ASTNode): void { }
    onVariableOption(_: ASTNode): void { }
    onVariableTerminalDefAtom(_: ASTNode): void { }
    onVariableTerminalDefElement(_: ASTNode): void { }
    onVariableTerminalDefCardinalilty(_: ASTNode): void { }
    onVariableTerminalDefRepetition(_: ASTNode): void { }
    onVariableTerminalDefFragment(_: ASTNode): void { }
    onVariableTerminalDefRestrict(_: ASTNode): void { }
    onVariableTerminalDefinition(_: ASTNode): void { }
    onVariableTerminalRule(_: ASTNode): void { }
    onVariableTerminalFragment(_: ASTNode): void { }
    onVariableTerminalContext(_: ASTNode): void { }
    onVariableTerminalItem(_: ASTNode): void { }
    onVariableRuleSymAction(_: ASTNode): void { }
    onVariableRuleSymVirtual(_: ASTNode): void { }
    onVariableRuleSymRefParams(_: ASTNode): void { }
    onVariableRuleSymRefTemplate(_: ASTNode): void { }
    onVariableRuleSymRefSimple(_: ASTNode): void { }
    onVariableRuleDefAtom(_: ASTNode): void { }
    onVariableRuleDefContext(_: ASTNode): void { }
    onVariableRuleDefSub(_: ASTNode): void { }
    onVariableRuleDefElement(_: ASTNode): void { }
    onVariableRuleDefTreeAction(_: ASTNode): void { }
    onVariableRuleDefRepetition(_: ASTNode): void { }
    onVariableRuleDefFragment(_: ASTNode): void { }
    onVariableRuleDefChoice(_: ASTNode): void { }
    onVariableRuleDefinition(_: ASTNode): void { }
    onVariableRuleTemplateParams(_: ASTNode): void { }
    onVariableCfRuleTemplate(_: ASTNode): void { }
    onVariableCfRuleSimple(_: ASTNode): void { }
    onVariableCfRule(_: ASTNode): void { }
    onVariableGrammarOptions(_: ASTNode): void { }
    onVariableGrammarTerminals(_: ASTNode): void { }
    onVariableGrammarCfRules(_: ASTNode): void { }
    onVariableGrammarParency(_: ASTNode): void { }
    onVariableCfGrammar(_: ASTNode): void { }
    onVariableFile(_: ASTNode): void { }
    onVariableFixture(_: ASTNode): void { }
    onVariableHeader(_: ASTNode): void { }
    onVariableTest(_: ASTNode): void { }
    onVariableTestMatches(_: ASTNode): void { }
    onVariableTestNoMatch(_: ASTNode): void { }
    onVariableTestFails(_: ASTNode): void { }
    onVariableTestOutput(_: ASTNode): void { }
    onVariableTree(_: ASTNode): void { }
    onVariableCheck(_: ASTNode): void { }
    onVariableChildren(_: ASTNode): void { }
    onVirtualRange(_: ASTNode): void { }
    onVirtualConcat(_: ASTNode): void { }
    onVirtualEmptypart(_: ASTNode): void { }
  }
}
