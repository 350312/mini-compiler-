/**
 * CSE 2210: Symbol Table Viewer Component
 * Displays identifier name, data type, scope level/reference, line of declaration, and initialization status.
 */

import React, { useState } from 'react';
import { Scope, SymbolEntry } from '../compiler/types';
import { Database, Search, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

interface SymbolTableViewerProps {
  symbolTable: Scope | null;
  flatSymbols: SymbolEntry[];
  onSelectLine?: (line: number) => void;
}

export const SymbolTableViewer: React.FC<SymbolTableViewerProps> = ({
  symbolTable,
  flatSymbols,
  onSelectLine,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScopeLevel, setSelectedScopeLevel] = useState<string>('all');

  if (!symbolTable || flatSymbols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
        <Database className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-300">Symbol Table is Empty</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Declare variables (e.g. `int count = 5;`) to populate the symbol table entries.
        </p>
      </div>
    );
  }

  // Get distinct scope levels
  const scopeLevels = Array.from(new Set(flatSymbols.map((s) => s.scopeLevel))).sort();

  const filteredSymbols = flatSymbols.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.dataType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.scopeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScope =
      selectedScopeLevel === 'all' || entry.scopeLevel === parseInt(selectedScopeLevel, 10);

    return matchesSearch && matchesScope;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      {/* Controls Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search symbols or types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Scope Filter:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedScopeLevel('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedScopeLevel === 'all'
                  ? 'bg-slate-800 text-sky-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Scopes ({flatSymbols.length})
            </button>
            {scopeLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedScopeLevel(lvl.toString())}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedScopeLevel === lvl.toString()
                    ? 'bg-slate-800 text-sky-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scope {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium sticky top-0 z-10">
              <th className="py-2.5 px-4 font-mono">Identifier Name</th>
              <th className="py-2.5 px-4">Data Type</th>
              <th className="py-2.5 px-4">Scope Level & Reference</th>
              <th className="py-2.5 px-4">Line Declared</th>
              <th className="py-2.5 px-4">Initialization Status</th>
              <th className="py-2.5 px-4">Evaluated Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredSymbols.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => onSelectLine && onSelectLine(entry.declaredLine)}
                className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                {/* Identifier */}
                <td className="py-2.5 px-4 font-semibold text-sky-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400/80" />
                  {entry.name}
                </td>

                {/* Data Type */}
                <td className="py-2.5 px-4 font-sans">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                      entry.dataType === 'int'
                        ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40'
                        : entry.dataType === 'float'
                        ? 'bg-teal-950/70 text-teal-300 border border-teal-800/40'
                        : entry.dataType === 'string'
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                        : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                    }`}
                  >
                    {entry.dataType}
                  </span>
                </td>

                {/* Scope */}
                <td className="py-2.5 px-4 font-sans text-slate-300">
                  <span className="text-slate-400 font-mono text-[11px] bg-slate-800/60 px-1.5 py-0.5 rounded mr-1.5">
                    Level {entry.scopeLevel}
                  </span>
                  <span>{entry.scopeName}</span>
                </td>

                {/* Line */}
                <td className="py-2.5 px-4 text-slate-400 font-sans tabular-nums">
                  <span className="text-sky-400 group-hover:underline">
                    line {entry.declaredLine}
                  </span>
                </td>

                {/* Initialization status */}
                <td className="py-2.5 px-4 font-sans">
                  {entry.initialized ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Initialized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-amber-400 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Uninitialized
                    </span>
                  )}
                </td>

                {/* Evaluated Value */}
                <td className="py-2.5 px-4 text-slate-300 font-mono">
                  {entry.value !== undefined ? (
                    <span className="text-emerald-300">{JSON.stringify(entry.value)}</span>
                  ) : (
                    <span className="text-slate-600 italic font-sans text-[11px]">undefined</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scope Details Footer */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Showing {filteredSymbols.length} of {flatSymbols.length} entries
        </span>
        <span className="font-sans">
          Click row to jump to declaration line in source
        </span>
      </div>
    </div>
  );
};
