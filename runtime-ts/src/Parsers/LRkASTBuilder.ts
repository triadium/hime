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
import { ROList } from '../Utils'
import { Pool } from '../Utils/Pool'

import { LRkParser } from './LRkParser'
import { SubTree } from './SubTree'
import { SubTreeFactory } from './SubTreeFactory'

/// <summary>
/// Represents the builder of Parse Trees for LR(k) parsers
/// </summary>
export class LRkASTBuilder implements SemanticBody {
  /// <summary>
  /// The initial size of the reduction handle
  /// </summary>
  private static readonly INIT_HANDLE_SIZE = 1024
  /// <summary>
  /// The bias for estimating the size of the reduced sub-tree
  /// </summary>
  private static readonly ESTIMATION_BIAS = 5

  /// <summary>
  /// The pool of single node sub-trees
  /// </summary>
  private readonly poolSingle: Pool<SubTree>
  /// <summary>
  /// The pool of sub-tree with a capacity of 128 nodes
  /// </summary>
  private readonly pool128: Pool<SubTree>
  /// <summary>
  /// The pool of sub-tree with a capacity of 1024 nodes
  /// </summary>
  private readonly pool1024: Pool<SubTree>
  /// <summary>
  /// The stack of semantic objects
  /// </summary>
  private stack: SubTree[]
  /// <summary>
  /// Index of the available cell on top of the stack's head
  /// </summary>
  private stackNext: int
  /// <summary>
  /// The sub-tree build-up cache
  /// </summary>
  private cache!: SubTree
  /// <summary>
  /// The new available node in the current cache
  /// </summary>
  private cacheNext: int
  /// <summary>
  /// The number of items popped from the stack
  /// </summary>
  private popCount: int
  /// <summary>
  /// The reduction handle represented as the indices of the sub-trees in the cache
  /// </summary>
  private handle: int[]
  /// <summary>
  /// The index of the next available slot in the handle
  /// </summary>
  private handleNext: int
  /// <summary>
  /// The AST being built
  /// </summary>
  private readonly result: AST;

  [index: int]: SemanticElement

  /// <summary>
  /// Gets the length of this body
  /// </summary>
  get Length(): int {
    return this.handleNext
  }

  /// <summary>
  /// Initializes the builder with the given stack size
  /// </summary>
  /// <param name="tokens">The table of tokens</param>
  /// <param name="variables">The table of parser variables</param>
  /// <param name="virtuals">The table of parser virtuals</param>
  constructor(tokens: TokenRepository, variables: ROList<GSymbol>, virtuals: ROList<GSymbol>) {
    this.poolSingle = new Pool<SubTree>(new SubTreeFactory(1), 512)
    this.pool128 = new Pool<SubTree>(new SubTreeFactory(128), 128)
    this.pool1024 = new Pool<SubTree>(new SubTreeFactory(1024), 16)
    this.stack = new Array<SubTree>(LRkParser.INIT_STACK_SIZE)
    this.stackNext = 0
    this.handle = new Array<int>(LRkASTBuilder.INIT_HANDLE_SIZE)
    this.result = new AST(tokens, variables, virtuals)

    this.cacheNext = 0
    this.handleNext = 0
    this.popCount = 0

    return new Proxy(this, {
      /// <summary>
      /// Gets the symbol at the i-th index
      /// </summary>
      /// <param name="index">Index of the symbol</param>
      /// <returns>The symbol at the given index</returns>
      get: (target, prop) => {
        const index = typeof prop === 'string' ? parseInt(prop, 10) : Number.NaN
        if (typeof index === 'number' && !isNaN(index)) {
          return this.result.GetSemanticElementForLabel(this.cache.GetLabelAt(this.handle[index]!))
        }
        return (target as unknown as any)[prop]
      },
    })
  }

  /// <summary>
  /// Push a token onto the stack
  /// </summary>
  /// <param name="index">The token's index in the parsed text</param>
  StackPushToken(index: int): void {
    const single = this.poolSingle.Acquire()
    single.SetupRoot(new TableElemRef(TableType.Token, index), TreeAction.None)

    if (this.stackNext === this.stack.length) {
      this.stack.length = this.stack.length + LRkParser.INIT_STACK_SIZE
    }

    this.stack[this.stackNext++] = single
  }

  /// <summary>
  /// Prepares for the forthcoming reduction operations
  /// </summary>
  /// <param name="varIndex">The reduced variable index</param>
  /// <param name="length">The length of the reduction</param>
  /// <param name="action">The tree action applied onto the symbol</param>
  ReductionPrepare(varIndex: int, length: int, action: TreeAction): void {
    this.stackNext -= length
    let estimation = LRkASTBuilder.ESTIMATION_BIAS
    for (let i = 0; i < length; ++i) {
      estimation += this.stack[this.stackNext + i]!.GetSize()
    }
    this.cache = this.GetSubTree(estimation)
    this.cache.SetupRoot(new TableElemRef(TableType.Variable, varIndex), action)
    this.cacheNext = 1
    this.handleNext = 0
    this.popCount = 0
  }

  /// <summary>
  /// Gets a pooled sub-tree with the given maximal size
  /// </summary>
  /// <param name="size">The size of the sub-tree</param>
  private GetSubTree(size: int): SubTree {
    if (size <= 128) {
      return this.pool128.Acquire()
    } else if (size <= 1024) {
      return this.pool1024.Acquire()
    } else {
      return new SubTree(null, size)
    }
  }

  /// <summary>
  /// During a reduction, insert the given sub-tree
  /// </summary>
  /// <param name="sub">The sub-tree</param>
  /// <param name="action">The tree action applied onto the symbol</param>
  private ReductionAddSub(sub: SubTree, action: TreeAction): void {
    if (sub.GetActionAt(0) === TreeAction.ReplaceByChildren) {
      const directChildrenCount = sub.GetChildrenCountAt(0)
      while (this.handleNext + directChildrenCount >= this.handle.length) {
        this.handle.length = this.handle.length + LRkASTBuilder.INIT_HANDLE_SIZE
      }
      // copy the children to the cache
      sub.CopyChildrenTo(this.cache, this.cacheNext)
      // setup the handle
      let index = 1
      for (let i = 0; i != directChildrenCount; i++) {
        const size = sub.GetChildrenCountAt(index) + 1
        this.handle[this.handleNext++] = this.cacheNext
        this.cacheNext += size
        index += size
      }
    } else if (action === TreeAction.Drop) {
    } else {
      if (action !== TreeAction.None) {
        sub.SetActionAt(0, action)
      }
      // copy the complete sub-tree to the cache
      if (this.handleNext === this.handle.length) {
        this.handle.length = this.handle.length + LRkASTBuilder.INIT_HANDLE_SIZE
      }
      sub.CopyTo(this.cache, this.cacheNext)
      this.handle[this.handleNext++] = this.cacheNext
      this.cacheNext += sub.GetChildrenCountAt(0) + 1
    }
  }

  /// <summary>
  /// During a redution, pops the top symbol from the stack and gives it a tree action
  /// </summary>
  /// <param name="action">The tree action to apply to the symbol</param>
  ReductionPop(action: TreeAction): void {
    const sub = this.stack[this.stackNext + this.popCount]!
    this.ReductionAddSub(sub, action)
    sub.Free()
    this.popCount++
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
    this.cache.SetAt(this.cacheNext, new TableElemRef(TableType.Virtual, index), action)
    this.handle[this.handleNext++] = this.cacheNext++
  }

  /// <summary>
  /// Finalizes the reduction operation
  /// </summary>
  Reduce(): void {
    if (this.cache.GetActionAt(0) === TreeAction.ReplaceByChildren) {
      this.cache.SetChildrenCountAt(0, this.handleNext)
    } else {
      this.ReduceTree()
    }
    // Put it on the stack
    if (this.stackNext === this.stack.length) {
      this.stack.length = this.stack.length + LRkParser.INIT_STACK_SIZE
    }
    this.stack[this.stackNext++] = this.cache
  }

  /// <summary>
  /// Applies the promotion tree actions to the cache and commits to the final AST
  /// </summary>
  private ReduceTree(): void {
    // apply the epsilon replace, if any
    if (this.cache.GetActionAt(0) === TreeAction.ReplaceByEpsilon) {
      this.cache.SetAt(0, new TableElemRef(TableType.None, 0), TreeAction.None)
    }
    // promotion data
    let promotion = false
    let insertion = 1
    for (let i = 0; i < this.handleNext; ++i) {
      switch (this.cache.GetActionAt(this.handle[i]!)) {
        case TreeAction.Promote:
          if (promotion) {
            // This is not the first promotion
            // Commit the previously promoted node's children
            this.cache.SetChildrenCountAt(0, insertion - 1)
            this.cache.CommitChildrenOf(0, this.result)
            // Reput the previously promoted node in the cache
            this.cache.Move(0, 1)
            insertion = 2
          }
          promotion = true
          // Save the new promoted node
          this.cache.Move(this.handle[i]!, 0)
          // Repack the children on the left if any
          const nb = this.cache.GetChildrenCountAt(0)
          this.cache.MoveRange(this.handle[i]! + 1, insertion, nb)
          insertion += nb
          break
        default:
          // Commit the children if any
          this.cache.CommitChildrenOf(this.handle[i]!, this.result)
          // Repack the sub-root on the left
          if (insertion !== this.handle[i]) {
            this.cache.Move(this.handle[i]!, insertion)
          }
          insertion++
          break
      }
    }
    // finalize the sub-tree data
    this.cache.SetChildrenCountAt(0, insertion - 1)
  }

  /// <summary>
  /// Finalizes the parse tree and returns it
  /// </summary>
  /// <returns>The final parse tree</returns>
  GetTree(): AST {
    // Get the axiom's sub tree
    const sub = this.stack[this.stackNext - 2]!
    // Commit the remaining sub-tree
    sub.Commit(this.result)
    return this.result
  }
}
