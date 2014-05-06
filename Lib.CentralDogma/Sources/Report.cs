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
using System.Collections.Generic;
using System.Xml;

namespace Hime.CentralDogma
{
	/// <summary>
	/// Represents a compilation report
	/// </summary>
	public sealed class Report
	{
		private List<object> infos;
		private List<object> warnings;
		private List<object> errors;

		/// <summary>
		/// Gets whether the report contains errors
		/// </summary>
		public bool HasErrors { get { return (errors.Count > 0); } }

		/// <summary>
		/// Gets the informational entries in this report
		/// </summary>
		public ROList<object> Infos { get { return new ROList<object>(infos); } }
		/// <summary>
		/// Gets the informational entries in this report
		/// </summary>
		public ROList<object> Warnings { get { return new ROList<object>(warnings); } }
		/// <summary>
		/// Gets the informational entries in this report
		/// </summary>
		public ROList<object> Errors { get { return new ROList<object>(errors); } }

		/// <summary>
		/// Initializes a new report
		/// </summary>
		public Report()
		{
			this.infos = new List<object>();
			this.warnings = new List<object>();
			this.errors = new List<object>();
		}

		/// <summary>
		/// Adds a new info entry
		/// </summary>
		/// <param name="message">The info message</param>
		public void AddInfo(object message)
		{
			infos.Add(message);
		}

		/// <summary>
		/// Adds a new warning entry
		/// </summary>
		/// <param name="message">The warning message</param>
		public void AddWarning(object message)
		{
			warnings.Add(message);
		}

		/// <summary>
		/// Adds a new error entry
		/// </summary>
		/// <param name="message">The error message</param>
		public void AddError(object message)
		{
			errors.Add(message);
		}
	}
}