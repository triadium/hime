﻿/*******************************************************************************
 * Copyright (c) 2017 Association Cénotélie (cenotelie.fr)
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
import { GSymbol } from "./GSymbol";
import { SemanticBody } from "./SemanticBody";


/// <summary>
/// Delegate for a user-defined semantic action
/// </summary>
/// <param name="head">The grammar variable representing the head of the reduced rule</param>
/// <param name="body">The current body at the time of the action</param>
export interface SemanticAction {
	(head: GSymbol, body: SemanticBody): void
}

