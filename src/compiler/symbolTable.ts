/**
 * CSE 2210: Compiler Laboratory - Part C: Scoped Symbol Table
 */

import { DataType, Scope, SymbolEntry } from './types';

export class SymbolTableManager {
  private scopeCounter = 0;
  private currentScope: Scope;
  private allScopes: Map<string, Scope> = new Map();
  private flatEntries: SymbolEntry[] = [];

  constructor() {
    this.currentScope = this.createScope('Global (Scope 0)', 0, null);
  }

  public createScope(name: string, level: number, parentId: string | null): Scope {
    const scopeId = `scope_${this.scopeCounter++}`;
    const scope: Scope = {
      id: scopeId,
      name,
      level,
      parentId,
      symbols: new Map(),
      childrenIds: [],
    };
    this.allScopes.set(scopeId, scope);

    if (parentId && this.allScopes.has(parentId)) {
      this.allScopes.get(parentId)!.childrenIds.push(scopeId);
    }

    return scope;
  }

  public enterScope(scopeName: string): Scope {
    const newScope = this.createScope(
      `${scopeName} (Scope ${this.currentScope.level + 1})`,
      this.currentScope.level + 1,
      this.currentScope.id
    );
    this.currentScope = newScope;
    return newScope;
  }

  public exitScope(): Scope | null {
    if (this.currentScope.parentId && this.allScopes.has(this.currentScope.parentId)) {
      this.currentScope = this.allScopes.get(this.currentScope.parentId)!;
      return this.currentScope;
    }
    return null;
  }

  public getCurrentScope(): Scope {
    return this.currentScope;
  }

  public getRootScope(): Scope {
    return this.allScopes.get('scope_0') || this.currentScope;
  }

  public getAllScopes(): Map<string, Scope> {
    return this.allScopes;
  }

  public getFlatSymbols(): SymbolEntry[] {
    return this.flatEntries;
  }

  /**
   * Check if identifier is already declared in the CURRENT scope.
   */
  public isDeclaredInCurrentScope(name: string): boolean {
    return this.currentScope.symbols.has(name);
  }

  /**
   * Look up symbol from current scope outward to root.
   */
  public lookup(name: string): { entry: SymbolEntry; foundInCurrentScope: boolean; foundInScope: Scope } | null {
    let curr: Scope | null = this.currentScope;
    let inCurrent = true;

    while (curr) {
      if (curr.symbols.has(name)) {
        return {
          entry: curr.symbols.get(name)!,
          foundInCurrentScope: inCurrent,
          foundInScope: curr,
        };
      }
      inCurrent = false;
      curr = curr.parentId ? this.allScopes.get(curr.parentId) || null : null;
    }

    return null;
  }

  /**
   * Check if identifier exists anywhere in any scope (useful for detecting scope violation bonus error).
   */
  public findAnywhere(name: string): SymbolEntry | null {
    for (const scope of this.allScopes.values()) {
      if (scope.symbols.has(name)) {
        return scope.symbols.get(name)!;
      }
    }
    return null;
  }

  /**
   * Insert a symbol into the current scope.
   */
  public insert(
    name: string,
    dataType: DataType,
    line: number,
    initialized: boolean = false,
    value?: number | string | boolean
  ): SymbolEntry {
    const entryId = `sym_${this.flatEntries.length + 1}`;
    const entry: SymbolEntry = {
      id: entryId,
      name,
      dataType,
      scopeLevel: this.currentScope.level,
      scopeId: this.currentScope.id,
      scopeName: this.currentScope.name,
      declaredLine: line,
      initialized,
      value,
      parentScopeId: this.currentScope.parentId,
    };

    this.currentScope.symbols.set(name, entry);
    this.flatEntries.push(entry);
    return entry;
  }

  /**
   * Mark a symbol as initialized after assignment.
   */
  public markInitialized(name: string, value?: any): boolean {
    const res = this.lookup(name);
    if (res) {
      res.entry.initialized = true;
      if (value !== undefined) {
        res.entry.value = value;
      }
      return true;
    }
    return false;
  }

  /**
   * Reset symbol table.
   */
  public reset() {
    this.scopeCounter = 0;
    this.allScopes.clear();
    this.flatEntries = [];
    this.currentScope = this.createScope('Global (Scope 0)', 0, null);
  }
}
