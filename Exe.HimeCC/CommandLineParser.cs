/*
 * WARNING: this file has been generated by
 * Hime Parser Generator 1.0.0.0
 */

using System.Collections.Generic;
using Hime.Redist;
using Hime.Redist.Parsers;

namespace Hime.HimeCC.CL
{
	/// <summary>
	/// Represents a parser
	/// </summary>
	internal class CommandLineParser : LRkParser
	{
        private static readonly LRkAutomaton automaton = LRkAutomaton.Find(typeof(CommandLineParser), "CommandLineParser.bin");
		/// <summary>
		/// The collection of variables matched by this parser
		/// </summary>
		/// <remarks>
		/// The variables are in an order consistent with the automaton,
		/// so that variable indices in the automaton can be used to retrieve the variables in this table
		/// </remarks>
		private static readonly Symbol[] variables = {
			new Symbol(0x9, "value"), 
			new Symbol(0xA, "argument"), 
			new Symbol(0xB, "values"), 
			new Symbol(0xC, "arguments"), 
			new Symbol(0xD, "line"), 
			new Symbol(0xE, "_v0"), 
			new Symbol(0xF, "_v1"), 
			new Symbol(0x10, "_v2"), 
			new Symbol(0x11, "_Axiom_") };
		/// <summary>
		/// The unique identifier for variable value
		/// </summary>
		public const int value = 0x9;
		/// <summary>
		/// The unique identifier for variable argument
		/// </summary>
		public const int argument = 0xA;
		/// <summary>
		/// The unique identifier for variable values
		/// </summary>
		public const int values = 0xB;
		/// <summary>
		/// The unique identifier for variable arguments
		/// </summary>
		public const int arguments = 0xC;
		/// <summary>
		/// The unique identifier for variable line
		/// </summary>
		public const int line = 0xD;
		/// <summary>
		/// The unique identifier for variable _v0
		/// </summary>
		public const int _v0 = 0xE;
		/// <summary>
		/// The unique identifier for variable _v1
		/// </summary>
		public const int _v1 = 0xF;
		/// <summary>
		/// The unique identifier for variable _v2
		/// </summary>
		public const int _v2 = 0x10;
		/// <summary>
		/// The unique identifier for variable _Axiom_
		/// </summary>
		public const int _Axiom_ = 0x11;
		/// <summary>
		/// The collection of virtuals matched by this parser
		/// </summary>
		/// <remarks>
		/// The virtuals are in an order consistent with the automaton,
		/// so that virtual indices in the automaton can be used to retrieve the virtuals in this table
		/// </remarks>
		private static readonly Symbol[] virtuals = {
 };
		/// <summary>
		/// Initializes a new instance of the parser
		/// </summary>
		/// <param name="lexer">The input lexer</param>
		public CommandLineParser(CommandLineLexer lexer) : base (automaton, variables, virtuals, null, lexer) { }
	}
}
