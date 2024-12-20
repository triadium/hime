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
import { AST } from '../AST'
import { int } from '../BaseTypes'
import { GSymbol } from '../GSymbol'
import { SemanticBody } from '../SemanticBody'
import { SemanticElement } from '../SemanticElement'
import { TableElemRef } from '../TableElemRef'
import { TableType } from '../TableType'
import { TokenRepository } from '../TokenRepository'
import { TreeAction } from '../TreeAction'
import { ArrayCopy, Factory, Pool, ROList } from '../Utils'

import { GSSPath } from './GSSPath'
import { SPPF } from './SPPF'
import { SPPFNodeNormal } from './SPPFNodeNormal'
import { SPPFNodeRef } from './SPPFNodeRef'
import { SPPFNodeReplaceable } from './SPPFNodeReplaceable'

/// <summary>
/// Represents a structure that helps build a Shared Packed Parse Forest (SPPF)
/// </summary>
/// <remarks>
/// A SPPF is a compact representation of multiple variants of an AST at once.
/// GLR algorithms originally builds the complete SPPF.
/// However we only need to build one of the variant, i.e. an AST for the user.
/// </remarks>
export class SPPFBuilder implements SemanticBody {
  /// <summary>
  /// The initial size of the reduction handle
  /// </summary>
  private static readonly INIT_HANDLE_SIZE = 1024
  /// <summary>
  /// The initial size of the history buffer
  /// </summary>
  private static readonly INIT_HISTORY_SIZE = 8
  /// <summary>
  /// The initial size of the history parts' buffers
  /// </summary>
  static readonly INIT_HISTORY_PART_SIZE = 64
  /// <summary>
  /// The pool of history parts
  /// </summary>
  private readonly poolHPs: Pool<SPPFBuilder.HistoryPart>
  /// <summary>
  /// The history
  /// </summary>
  private history: SPPFBuilder.HistoryPart[]
  /// <summary>
  /// The next available slot for a history part
  /// </summary>
  private nextHP: int
  /// <summary>
  /// The SPPF being built
  /// </summary>
  private sppf: SPPF
  /// <summary>
  /// The adjacency cache for the reduction
  /// </summary>
  private cacheChildren: SPPFNodeRef[]
  /// <summary>
  /// The new available slot in the current cache
  /// </summary>
  private cacheNext: int
  /// <summary>
  /// The reduction handle represented as the indices of the sub-trees in the cache
  /// </summary>
  private handleIndices: int[]
  /// <summary>
  /// The actions for the reduction
  /// </summary>
  private handleActions: TreeAction[]
  /// <summary>
  /// The index of the next available slot in the handle
  /// </summary>
  private handleNext: int
  /// <summary>
  /// The stack of semantic objects for the reduction
  /// </summary>
  private stack: int[]
  /// <summary>
  /// The number of items popped from the stack
  /// </summary>
  private popCount: int
  /// <summary>
  /// The AST being built
  /// </summary>
  private readonly result: AST

  /// <summary>
  /// Gets the length of this body
  /// </summary>
  get Length(): int {
    return this.handleNext
  }

  [index: number]: SemanticElement

  /// <summary>
  /// Initializes this SPPF
  /// </summary>
  /// <param name="tokens">The token table</param>
  /// <param name="variables">The table of parser variables</param>
  /// <param name="virtuals">The table of parser virtuals</param>
  constructor(tokens: TokenRepository, variables: ROList<GSymbol>, virtuals: ROList<GSymbol>) {
    this.handleNext = 0
    this.popCount = 0
    this.cacheNext = 0
    this.nextHP = 0

    this.poolHPs = new Pool<SPPFBuilder.HistoryPart>(
      new SPPFBuilder.HistoryPartFactory(),
      SPPFBuilder.INIT_HISTORY_SIZE,
    )
    this.history = new Array<SPPFBuilder.HistoryPart>(SPPFBuilder.INIT_HISTORY_SIZE)
    this.sppf = new SPPF()
    this.cacheChildren = new Array<SPPFNodeRef>(SPPFBuilder.INIT_HANDLE_SIZE)
    this.handleIndices = new Array<int>(SPPFBuilder.INIT_HANDLE_SIZE)
    this.handleActions = new Array<TreeAction>(SPPFBuilder.INIT_HANDLE_SIZE)
    this.stack = new Array<int>(SPPFBuilder.INIT_HANDLE_SIZE)
    this.result = new AST(tokens, variables, virtuals)

    return new Proxy(this, {
      /// <summary>
      /// Gets the symbol at the i-th index
      /// </summary>
      /// <param name="index">Index of the symbol</param>
      /// <returns>The symbol at the given index</returns>
      get: (target, prop) => {
        const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
        if (typeof index === 'number' && !isNaN(index)) {
          const reference = this.cacheChildren[this.handleIndices[index]!]!
          const sppfNode = this.sppf.GetNode(reference.NodeId)
          const label = (sppfNode as SPPFNodeNormal).GetVersion(reference.Version).Label
          return this.result.GetSemanticElementForLabel(label)
        }
        return (target as unknown as any)[prop]
      },
    })
  }

  /// <summary>
  /// Gets the history part for the given GSS generation
  /// </summary>
  /// <param name="generation">The index of a GSS generation</param>
  /// <returns>The corresponding history part, or <c>null</c></returns>
  private GetHistoryPart(generation: int): SPPFBuilder.HistoryPart | null {
    for (let i = 0; i < this.nextHP; ++i) {
      if (this.history[i]!.generation === generation) {
        return this.history[i]!
      }
    }
    return null
  }

  /// <summary>
  /// Clears the current history
  /// </summary>
  ClearHistory(): void {
    for (let i = 0; i < this.nextHP; ++i) {
      this.poolHPs.Return(this.history[i]!)
    }
    this.nextHP = 0
  }

  /// <summary>
  /// Gets the symbol on the specified GSS edge label
  /// </summary>
  /// <param name="label">The label of a GSS edge</param>
  /// <returns>The symbol on the edge</returns>
  GetSymbolOn(label: int): GSymbol {
    return this.result.GetSymbolFor(this.sppf.GetNode(label).OriginalSymbol)
  }

  /// <summary>
  /// Gets the GSS label already in history for the given GSS generation and symbol
  /// </summary>
  /// <param name="generation">The index of a GSS generation</param>
  /// <param name="symbol">A symbol to look for</param>
  /// <returns>The existing GSS label, or the epsilon label</returns>
  GetLabelFor(generation: int, symbol: TableElemRef): int {
    const hp = this.GetHistoryPart(generation)
    if (hp == null) {
      return SPPF.EPSILON
    }
    for (let i = 0; i < hp.next; ++i) {
      if (this.sppf.GetNode(hp.data[i]!).OriginalSymbol === symbol) {
        return hp.data[i]!
      }
    }
    return SPPF.EPSILON
  }

  /// <summary>
  /// Creates a single node in the result SPPF an returns it
  /// </summary>
  /// <param name="symbol">The symbol as the node's label</param>
  /// <returns>The created node's index in the SPPF</returns>
  GetSingleNode(symbol: TableElemRef): int {
    return this.sppf.NewNode(symbol)
  }

  /// <summary>
  /// Prepares for the forthcoming reduction operations
  /// </summary>
  /// <param name="first">The first label</param>
  /// <param name="path">The path being reduced</param>
  /// <param name="length">The reduction length</param>
  ReductionPrepare(first: int, path: GSSPath | null, length: int): void {
    // build the stack
    if (length > 0) {
      for (let i = 0; i < length - 1; ++i) {
        this.stack[i] = path![length - 2 - i]!
      }
      this.stack[length - 1] = first
    }
    // initialize the reduction data
    this.cacheNext = 0
    this.handleNext = 0
    this.popCount = 0
  }

  /// <summary>
  /// During a reduction, pops the top symbol from the stack and gives it a tree action
  /// </summary>
  /// <param name="action">The tree action to apply to the symbol</param>
  ReductionPop(action: TreeAction): void {
    this.AddToCache(this.stack[this.popCount++]!, action)
  }

  /// <summary>
  /// Adds the specified GSS label to the reduction cache with the given tree action
  /// </summary>
  /// <param name="gssLabel">The label to add to the cache</param>
  /// <param name="action">The tree action to apply</param>
  private AddToCache(gssLabel: int, action: TreeAction): void {
    if (action === TreeAction.Drop) {
      return
    }
    const node = this.sppf.GetNode(gssLabel)
    if (node.IsReplaceable) {
      const replaceable = node as SPPFNodeReplaceable
      // this is replaceable sub-tree
      for (let i = 0; i != replaceable.ChildrenCount; i++) {
        this.AddNodeToCache(
          this.sppf.GetNode(replaceable.Children![i]!.NodeId) as SPPFNodeNormal,
          replaceable.Actions![i]!,
        )
      }
    } else {
      // this is a simple reference to an existing SPPF node
      this.AddNodeToCache(node as SPPFNodeNormal, action)
    }
  }

  /// <summary>
  /// Adds the specified SPPF node to the cache
  /// </summary>
  /// <param name="node">The node to add to the cache</param>
  /// <param name="action">The tree action to apply onto the node</param>
  private AddNodeToCache(node: SPPFNodeNormal, action: TreeAction): void {
    const version = node.DefaultVersion
    while (this.cacheNext + version.ChildrenCount + 1 >= this.cacheChildren.length) {
      // the current cache is not big enough, build a bigger one
      this.cacheChildren.length = this.cacheChildren.length + SPPFBuilder.INIT_HANDLE_SIZE
    }
    // add the node in the cache
    this.cacheChildren[this.cacheNext] = new SPPFNodeRef(node.Identifier, 0)
    // setup the handle to point to the root
    if (this.handleNext === this.handleIndices.length) {
      this.handleIndices.length = this.handleIndices.length + SPPFBuilder.INIT_HANDLE_SIZE
      this.handleActions.length = this.handleActions.length + SPPFBuilder.INIT_HANDLE_SIZE
    }
    this.handleIndices[this.handleNext] = this.cacheNext
    this.handleActions[this.handleNext] = action
    // copy the children
    if (version.ChildrenCount > 0) {
      ArrayCopy(version.Children!, 0, this.cacheChildren, this.cacheNext + 1, version.ChildrenCount)
    }
    this.handleNext++
    this.cacheNext += version.ChildrenCount + 1
  }

  /// <summary>
  /// During a reduction, inserts a virtual symbol
  /// </summary>
  /// <param name="index">The virtual symbol's index</param>
  /// <param name="action">The tree action applied onto the symbol</param>
  ReductionAddVirtual(index: int, action: TreeAction): void {
    if (action === TreeAction.Drop) {
      return // why would you do this?
    }
    const nodeId = this.sppf.NewNode(new TableElemRef(TableType.Virtual, index))
    if (this.cacheNext + 1 >= this.cacheChildren.length) {
      // the current cache is not big enough, build a bigger one
      this.cacheChildren.length = this.cacheChildren.length + SPPFBuilder.INIT_HANDLE_SIZE
    }
    // add the node in the cache
    this.cacheChildren[this.cacheNext] = new SPPFNodeRef(nodeId, 0)
    // setup the handle to point to the root
    if (this.handleNext == this.handleIndices.length) {
      this.handleIndices.length = this.handleIndices.length + SPPFBuilder.INIT_HANDLE_SIZE
      this.handleActions.length = this.handleActions.length + SPPFBuilder.INIT_HANDLE_SIZE
    }
    this.handleIndices[this.handleNext] = this.cacheNext
    this.handleActions[this.handleNext] = action
    // copy the children
    this.handleNext++
    this.cacheNext++
  }

  /// <summary>
  /// During a reduction, inserts the sub-tree of a nullable variable
  /// </summary>
  /// <param name="nullable">The sub-tree of a nullable variable</param>
  /// <param name="action">The tree action applied onto the symbol</param>
  ReductionAddNullable(nullable: int, action: TreeAction): void {
    this.AddToCache(nullable, action)
  }

  /// <summary>
  /// Finalizes the reduction operation
  /// </summary>
  /// <param name="generation">The generation to reduce from</param>
  /// <param name="varIndex">The reduced variable index</param>
  /// <param name="headAction">The tree action applied in the rule's head</param>
  /// <returns>The identifier of the produced SPPF node</returns>
  Reduce(generation: int, varIndex: int, headAction: TreeAction): int {
    const label =
      headAction === TreeAction.ReplaceByChildren
        ? this.ReduceReplaceable(varIndex)
        : this.ReduceNormal(varIndex, headAction)
    this.AddToHistory(generation, label)
    return label
  }

  /// <summary>
  /// Executes the reduction as a normal reduction
  /// </summary>
  /// <param name="varIndex">The reduced variable index</param>
  /// <param name="headAction">The tree action applied in the rule's head</param>
  /// <returns>The identifier of the produced SPPF node</returns>
  private ReduceNormal(varIndex: int, headAction: TreeAction): int {
    let promotedSymbol = new TableElemRef(TableType.None, 0)
    let promotedReference = new SPPFNodeRef(SPPF.EPSILON, 0)

    let insertion = 0
    for (let i = 0; i < this.handleNext; ++i) {
      switch (this.handleActions[i]) {
        case TreeAction.Promote:
          if (promotedReference.NodeId !== SPPF.EPSILON) {
            // not the first promotion
            // create a new version for the promoted node
            const oldPromotedNode = this.sppf.GetNode(promotedReference.NodeId) as SPPFNodeNormal
            const oldPromotedRef = oldPromotedNode.NewVersion(promotedSymbol, this.cacheChildren, insertion)
            // register the previously promoted reference into the cache
            this.cacheChildren[0] = oldPromotedRef
            insertion = 1
          }
          // save the new promoted node
          promotedReference = this.cacheChildren[this.handleIndices[i]!]!
          const promotedNode = this.sppf.GetNode(promotedReference.NodeId) as SPPFNodeNormal
          const promotedVersion = promotedNode.GetVersion(promotedReference.Version)
          promotedSymbol = promotedVersion.Label
          // repack the children on the left if any
          ArrayCopy(
            this.cacheChildren,
            this.handleIndices[i]! + 1,
            this.cacheChildren,
            insertion,
            promotedVersion.ChildrenCount,
          )
          insertion += promotedVersion.ChildrenCount
          break
        default:
          // Repack the sub-root on the left
          if (insertion !== this.handleIndices[i]) {
            this.cacheChildren[insertion] = this.cacheChildren[this.handleIndices[i]!]!
          }
          insertion++
          break
      }
    }

    const originalLabel = new TableElemRef(TableType.Variable, varIndex)
    let currentLabel = originalLabel
    if (promotedReference.NodeId !== SPPF.EPSILON) {
      // a promotion occurred
      currentLabel = promotedSymbol
    } else if (headAction === TreeAction.ReplaceByEpsilon) {
      // this variable must be replaced in the final AST
      currentLabel = new TableElemRef(TableType.None, 0)
    }
    return this.sppf.NewNode(originalLabel, currentLabel, this.cacheChildren, insertion)
  }

  /// <summary>
  /// Executes the reduction as the reduction of a replaceable variable
  /// </summary>
  /// <param name="varIndex">The reduced variable index</param>
  /// <returns>The identifier of the produced SPPF node</returns>
  private ReduceReplaceable(varIndex: int): int {
    let insertion = 0
    for (let i = 0; i < this.handleNext; ++i) {
      if (insertion !== this.handleIndices[i]) {
        this.cacheChildren[insertion] = this.cacheChildren[this.handleIndices[i]!]!
      }
      insertion++
    }
    const originalLabel = new TableElemRef(TableType.Variable, varIndex)
    return this.sppf.NewReplaceableNode(originalLabel, this.cacheChildren, this.handleActions, this.handleNext)
  }

  /// <summary>
  /// Adds the specified GSS label to the current history
  /// </summary>
  /// <param name="generation">The current generation</param>
  /// <param name="label">The label identifier of the SPPF node to use as a GSS label</param>
  private AddToHistory(generation: int, label: int): void {
    let hp = this.GetHistoryPart(generation)
    if (hp == null) {
      hp = this.poolHPs.Acquire()
      hp.generation = generation
      hp.next = 0
      if (this.history.length === this.nextHP) {
        this.history.length = this.history.length + SPPFBuilder.INIT_HISTORY_SIZE
      }
      this.history[this.nextHP++] = hp
    }
    if (hp.next === hp.data.length) {
      hp.data.length = hp.data.length + SPPFBuilder.INIT_HISTORY_PART_SIZE
    }
    hp.data[hp.next++] = label
  }

  /// <summary>
  /// Finalizes the parse tree and returns it
  /// </summary>
  /// <param name="root">The identifier of the SPPF node that serves as root</param>
  /// <returns>The final parse tree</returns>
  GetTree(root: int): AST {
    const astRoot = this.BuildFinalAST(new SPPFNodeRef(root, 0))
    this.result.StoreRoot(astRoot)
    return this.result
  }

  /// <summary>
  /// Builds the final AST for the specified SPPF node reference
  /// </summary>
  /// <param name="reference">A reference to an SPPF node in a specific version</param>
  /// <returns>The AST node for the SPPF reference</returns>
  BuildFinalAST(reference: SPPFNodeRef): AST.Node {
    const sppfNode = this.sppf.GetNode(reference.NodeId)
    const version = (sppfNode as SPPFNodeNormal).GetVersion(reference.Version)

    if (version.ChildrenCount === 0) {
      return new AST.Node(version.Label)
    }

    const buffer = new Array<AST.Node>(version.ChildrenCount)
    for (let i = 0; i < version.ChildrenCount; ++i) {
      buffer[i] = this.BuildFinalAST(version.Children![i]!)
    }
    const first = this.result.Store(buffer, 0, version.ChildrenCount)
    return new AST.Node(version.Label, version.ChildrenCount, first)
  }
}

export namespace SPPFBuilder {
  /// <summary>
  /// Represents a generation of GSS edges in the current history
  /// The history is used to quickly find pre-existing matching GSS edges
  /// </summary>
  export class HistoryPart {
    /// <summary>
    /// The GSS labels in this part
    /// </summary>
    public data: int[]
    /// <summary>
    /// The index of the represented GSS generation
    /// </summary>
    public generation: int
    /// <summary>
    /// The next available slot in the data
    /// </summary>
    public next: int

    /// <summary>
    /// Initializes a new instance
    /// </summary>
    constructor() {
      this.generation = 0
      this.data = new Array<int>(SPPFBuilder.INIT_HISTORY_PART_SIZE)
      this.next = 0
    }
  }

  /// <summary>
  /// Represents a factory of history parts
  /// </summary>
  export class HistoryPartFactory implements Factory<HistoryPart> {
    /// <summary>
    ///  Creates a new object
    /// </summary>
    /// <param name="pool">The enclosing pool</param>
    /// <returns>The created object</returns>
    CreateNew(_: Pool<HistoryPart>): HistoryPart {
      return new HistoryPart()
    }
  }
}
