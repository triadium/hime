/**********************************************************************
* Copyright (c) 2013 Laurent Wouters and others
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
*
* Contributors:
*     Laurent Wouters - lwouters@xowl.org
**********************************************************************/
using System;
using Hime.Redist;

namespace Hime.CentralDogma
{
	/// <summary>
	/// Represents a logger producing a compilation report
	/// </summary>
	public class Reporter
	{
		/// <summary>
		/// The resulting report
		/// </summary>
		private Report report;

		/// <summary>
		/// Gets the current report
		/// </summary>
		public Report Result { get { return report; } }

		/// <summary>
		/// Initializes the reporter for the given type
		/// </summary>
		public Reporter()
		{
			report = new Report();
		}

		/// <summary>
		/// Adds a new info entry to the log
		/// </summary>
		/// <param name="message">The info message</param>
		public void Info(object message)
		{
			report.AddInfo(message);
			Console.WriteLine("[INFO] {0}", message);
		}

		/// <summary>
		/// Adds a new warning entry in the log
		/// </summary>
		/// <param name="message">The warning message</param>
		public void Warn(object message)
		{
			report.AddWarning(message);
			Console.WriteLine("[WARNING] {0}", message);
		}

		/// <summary>
		/// Adds a new error entry in the log
		/// </summary>
		/// <param name="message">The error message</param>
		public void Error(object message)
		{
			report.AddError(message);
			Console.WriteLine("[ERROR] {0}", message);
		}

		/// <summary>
		/// Adds a new input error entry in the log
		/// </summary>
		/// <param name="message">The error message</param>
		/// <param name="input">The input where containing an error</param>
		/// <param name="position">The position of the error within the input</param>
		public void Error(object message, Text input, TextPosition position)
		{
			Error(message);
			string content = input.GetLineContent(position.Line);
			content = content.TrimEnd('\r', '\n');
			int cut = 0;
			for (int i=0; i!=content.Length; i++)
			{
				if (!char.IsWhiteSpace(content[i]))
					break;
				cut++;
			}
			Console.Write('\t');
			Console.WriteLine(content.Substring(cut));
			Console.Write('\t');
			for (int i=cut; i!=position.Column - 1; i++)
				Console.Write(content[i] == '\t' ? '\t' : ' ');
			Console.WriteLine('^');
		}
	}
}
