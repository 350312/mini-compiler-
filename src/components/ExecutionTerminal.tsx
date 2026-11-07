/**
 * CSE 2210: Execution Terminal Component
 * Executes valid AST programs and displays standard print outputs.
 */

import React from 'react';
import { Terminal, Play, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ExecutionTerminalProps {
  output?: string[];
  executionError?: string;
  hasErrors: boolean;
  onRunAgain: () => void;
}

export const ExecutionTerminal: React.FC<ExecutionTerminalProps> = ({
  output = [],
  executionError,
  hasErrors,
  onRunAgain,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Mini-Language Output Console</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunAgain}
            disabled={hasErrors}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-sans transition-colors ${
              hasErrors
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Re-Run</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-auto p-4 space-y-1.5 text-slate-200">
        {hasErrors ? (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Execution Blocked</p>
              <p className="text-slate-400 mt-1">
                The program cannot execute because it contains compiler errors. Review and resolve all issues in the Diagnostics tab.
              </p>
            </div>
          </div>
        ) : executionError ? (
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <AlertCircle className="w-4 h-4" />
              Runtime Exception
            </div>
            <p className="text-rose-200">{executionError}</p>
          </div>
        ) : output.length === 0 ? (
          <div className="text-slate-500 italic p-4 text-center">
            Program completed with no print(...) output. Use print("message") or print(var) to emit output.
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-slate-400 text-[11px] pb-2 mb-2 border-b border-slate-900 flex items-center justify-between font-sans">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Execution Succeeded (exit code 0)
              </span>
              <span>{output.length} line(s) printed</span>
            </div>

            {output.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3 py-0.5">
                <span className="text-slate-600 select-none w-6 text-right tabular-nums">{idx + 1}</span>
                <span className="text-emerald-300 whitespace-pre-wrap">{line}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
