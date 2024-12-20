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
import { int } from '../BaseTypes'
import { BigList } from '../Utils'

import { GSSEdge } from './GSSEdge'
import { GSSGeneration } from './GSSGeneration'
import { GSSPath } from './GSSPath'

/// <summary>
/// Represents Graph-Structured Stacks for GLR parsers
/// </summary>
export class GSS {
  /// <summary>
  /// The initial size of the paths buffer in this GSS
  /// </summary>
  private static readonly INIT_PATHS_COUNT = 64

  /// <summary>
  /// The label (GLR state) on the GSS node for the given index
  /// </summary>
  private readonly nodeLabels: BigList<int>
  /// <summary>
  /// The generations of nodes in this GSS
  /// </summary>
  private readonly nodeGenerations: BigList<GSSGeneration>

  /// <summary>
  /// The edges in this GSS
  /// </summary>
  private readonly edges: BigList<GSSEdge>
  /// <summary>
  /// The generations for the edges
  /// </summary>
  private readonly edgeGenerations: BigList<GSSGeneration>

  /// <summary>
  /// Index of the current generation
  /// </summary>
  private generation: int

  /// <summary>
  /// A single reusable GSS paths for returning 0-length GSS paths
  /// </summary>
  private readonly path0: GSSPath
  /// <summary>
  /// The single reusable buffer for returning 0-length GSS paths
  /// </summary>
  private readonly paths0: GSSPath[]
  /// <summary>
  /// A buffer of GSS paths
  /// </summary>
  private paths: GSSPath[]

  /// <summary>
  /// Initializes the GSS
  /// </summary>
  constructor() {
    this.nodeLabels = new BigList<int>()
    this.nodeGenerations = new BigList<GSSGeneration>()
    this.edges = new BigList<GSSEdge>()
    this.edgeGenerations = new BigList<GSSGeneration>()
    this.generation = -1
    this.path0 = new GSSPath()
    this.paths0 = [this.path0]
    this.paths = new Array<GSSPath>(GSS.INIT_PATHS_COUNT)
  }

  /// <summary>
  /// Gets the data of the current generation
  /// </summary>
  /// <returns>The generation's data</returns>
  GetCurrentGeneration(): GSSGeneration {
    return this.nodeGenerations[this.generation]!
  }

  /// <summary>
  /// Gets the data of the specified generation of nodes
  /// </summary>
  /// <param name="generation">A generation</param>
  /// <returns>The generation's data</returns>
  GetGeneration(generation: int): GSSGeneration {
    return this.nodeGenerations[generation]!
  }

  /// <summary>
  /// Gets the GLR state represented by the specified node
  /// </summary>
  /// <param name="node">A node</param>
  /// <returns>The GLR state represented by the node</returns>
  GetRepresentedState(node: int): int {
    return this.nodeLabels[node]!
  }

  /// <summary>
  /// Finds in the given generation a node representing the given GLR state
  /// </summary>
  /// <param name="generation">A generation</param>
  /// <param name="state">A GLR state</param>
  /// <returns>The node representing the GLR state, or -1 if it is not found</returns>
  FindNode(generation: int, state: int): int {
    const data = this.nodeGenerations[generation]!
    for (let i = data.Start; i < data.Start + data.Count; ++i) {
      if (this.nodeLabels[i] === state) {
        return i
      }
    }
    return -1
  }

  /// <summary>
  /// Determines whether this instance has the required edge
  /// </summary>
  /// <param name="generation">The generation of the edge's start node</param>
  /// <param name="from">The edge's start node</param>
  /// <param name="to">The edge's target node</param>
  /// <returns><c>true</c> if this instance has the required edge; otherwise, <c>false</c></returns>
  HasEdge(generation: int, from: int, to: int): boolean {
    const data = this.edgeGenerations[generation]!
    for (let i = data.Start; i < data.Start + data.Count; ++i) {
      const edge = this.edges[i]!
      if (edge.From === from && edge.To === to) {
        return true
      }
    }
    return false
  }

  /// <summary>
  /// Opens a new generation in this GSS
  /// </summary>
  /// <returns>The index of the new generation</returns>
  CreateGeneration(): int {
    this.nodeGenerations.Add(new GSSGeneration(this.nodeLabels.Size))
    this.edgeGenerations.Add(new GSSGeneration(this.edges.Size))
    this.generation++
    return this.generation
  }

  /// <summary>
  /// Creates a new node in the GSS
  /// </summary>
  /// <param name="state">The GLR state represented by the node</param>
  /// <returns>The node's identifier</returns>
  CreateNode(state: int): int {
    const node = this.nodeLabels.Add(state)
    const data = this.nodeGenerations[this.generation]!
    data.Count++
    this.nodeGenerations[this.generation] = data
    return node
  }

  /// <summary>
  /// Creates a new edge in the GSS
  /// </summary>
  /// <param name="from">The edge's starting node</param>
  /// <param name="to">The edge's target node</param>
  /// <param name="label">The edge's label</param>
  CreateEdge(from: int, to: int, label: int): void {
    this.edges.Add(new GSSEdge(from, to, label))
    const data = this.edgeGenerations[this.generation]!
    data.Count++
    this.edgeGenerations[this.generation] = data
  }

  /// <summary>
  /// Setups a reusable GSS path with the given length
  /// </summary>
  /// <param name="index">The index in the buffer of reusable paths</param>
  /// <param name="last">The last GLR state in the path</param>
  /// <param name="length">The path's length</param>
  private SetupPath(index: int, last: int, length: int): void {
    if (index >= this.paths.length) {
      this.paths.length = this.paths.length + GSS.INIT_PATHS_COUNT
    }
    if (this.paths[index] == null) {
      this.paths[index] = new GSSPath(length)
    } else {
      this.paths[index].Ensure(length)
    }
    this.paths[index].Last = last
    this.paths[index].Generation = this.GetGenerationOf(last)
  }

  /// <summary>
  /// Retrieve the generation of the given node in this GSS
  /// </summary>
  /// <param name="node">A node's index</param>
  /// <returns>The index of the generation containing the node</returns>
  private GetGenerationOf(node: int): int {
    for (let i = this.generation; i > -1; --i) {
      const gen = this.nodeGenerations[i]!
      if (node >= gen.Start && node < gen.Start + gen.Count) {
        return i
      }
    }
    // should not happen
    return -1
  }

  /// <summary>
  /// Gets all paths in the GSS starting at the given node and with the given length
  /// </summary>
  /// <param name="from">The starting node</param>
  /// <param name="length">The length of the requested paths</param>
  /// <param name="count">The number of paths</param>
  /// <returns>A collection of paths in this GSS</returns>
  GetPaths(from: int, length: int, refs: { count: int }): GSSPath[] {
    if (length === 0) {
      // use the common 0-length GSS path to avoid new memory allocation
      this.path0.Last = from
      refs.count = 1
      return this.paths0
    }

    // Initializes the first path
    this.SetupPath(0, from, length)

    // The number of paths in the list
    let total = 1
    // For the remaining hops
    for (let i = 0; i < length; ++i) {
      let m = 0 // Insertion index for the compaction process
      let next = total // Insertion index for new paths
      for (let p = 0; p < total; ++p) {
        const last = this.paths[p]!.Last
        const genIndex = this.paths[p]!.Generation
        // Look for new additional paths from last
        const gen = this.edgeGenerations[genIndex]!
        let firstEdgeTarget = -1
        let firstEdgeLabel = -1
        for (let e = gen.Start; e < gen.Start + gen.Count; ++e) {
          const edge = this.edges[e]!
          if (edge.From === last) {
            if (firstEdgeTarget === -1) {
              // This is the first edge
              firstEdgeTarget = edge.To
              firstEdgeLabel = edge.Label
            } else {
              // Not the first edge
              // Clone and extend the new path
              this.SetupPath(next, edge.To, length)
              this.paths[next]!.CopyLabelsFrom(this.paths[p]!, i)
              this.paths[next]![i] = edge.Label
              // Go to next insert
              next++
            }
          }
        }
        // Check whether there was at least one edge
        if (firstEdgeTarget !== -1) {
          // Continue the current path
          if (m !== p) {
            const t = this.paths[m]!
            this.paths[m] = this.paths[p]!
            this.paths[p] = t
          }
          this.paths[m]!.Last = firstEdgeTarget
          this.paths[m]!.Generation = this.GetGenerationOf(firstEdgeTarget)
          this.paths[m]![i] = firstEdgeLabel
          // goto next
          m++
        }
      }
      if (m !== total) {
        // if some previous paths have been removed
        // => compact the list if needed
        for (let p = total; p < next; ++p) {
          const t = this.paths[m]!
          this.paths[m] = this.paths[p]!
          this.paths[p] = t
          m++
        }
        // m is now the exact number of paths
        total = m
      } else if (next !== total) {
        // no path has been removed, but some have been added
        // => next is the exact number of paths
        total = next
      }
    }

    refs.count = total
    return this.paths
  }

  /// <summary>
  /// Prints this stack onto the console output
  /// </summary>
  Print(): void {
    // list of all nodes having at least one child
    const linked = new Array<int>()

    for (let i = this.generation; i > -1; --i) {
      console.log('--- generation {0} ---', i)
      // Retrieve the edges in this generation
      const myedges = new Map<int, Array<int>>()
      const cedges = this.edgeGenerations[i]!
      for (let j = 0; j < cedges.Count; ++j) {
        const edge = this.edges[cedges.Start + j]!
        if (!myedges.has(edge.From)) {
          myedges.set(edge.From, new Array<int>())
        }
        myedges.get(edge.From)!.push(edge.To)
        if (!linked.includes(edge.To)) {
          linked.push(edge.To)
        }
      }
      // Retrieve the nodes in this generation and reverse their order
      const cnodes = this.nodeGenerations[i]!
      const mynodes = new Array<int>()
      for (let j = 0; j < cnodes.Count; ++j) {
        mynodes.push(cnodes.Start + j)
      }
      mynodes.reverse()
      // print this generation
      for (const node of mynodes) {
        const mark = linked.includes(node) ? 'node' : 'head'
        if (myedges.has(node)) {
          for (const to of myedges.get(node)!) {
            const gen = this.GetGenerationOf(to)
            if (gen === i) {
              console.log(`\t${mark} ${this.nodeLabels[node]} to ${this.nodeLabels[to]}`)
            } else {
              console.log(`\t${mark} ${this.nodeLabels[node]} to ${this.nodeLabels[to]} in gen ${gen}`)
            }
          }
        } else {
          console.log(`\t${mark} ${this.nodeLabels[node]}`)
        }
      }
    }
  }
}
