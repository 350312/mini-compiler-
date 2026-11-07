/**
 * CSE 2210: Diagnostics & Error Console
 * Strict implementation of required error formatting across Lexical, Syntax, and Semantic phases.
 */

import React from 'react';
import { CompilerError } from '../compiler/types';
import { AlertTriangle, CheckCircle, Copy, Check, Terminal } from 'lucide-react';

interface DiagnosticsPanelProps {
  errors: CompilerError[];
  warnings: CompilerError[];
  onSelectLine?: (line: number) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  errors,
  warnings,
  onSelectLine,
}) => {
  const [copied, setCopied] = React.useState(false);

  const lexicalErrors = errors.filter((e) => e.phase === 'lexical');
  const syntaxErrors = errors.filter((e) => e.phase === 'syntax');
  const semanticErrors = errors.filter((e) => e.phase === 'semantic');

  const copyErrorReport = () => {
    const reportText = [
      '=== CSE 2210 Compiler Diagnostics Log ===',
      `Total Errors: ${errors.length} (Lexical: ${lexicalErrors.length}, Syntax: ${syntaxErrors.length}, Semantic: ${semanticErrors.length})`,
      '',
      ...errors.map((e) => e.formattedText),
      ...warnings.map((w) => w.formattedText),
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center p-8 bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">Zero Compiler Errors</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          All compilation phases passed cleanly: Lexical analysis (0 errors), Syntax validation (0 errors), and Semantic type checking (0 errors).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      {/* Diagnostics Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {errors.length} Compiler Error{errors.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-3 text-slate-400 font-sans text-[11px]">
            <span>Lexical: <strong className="text-slate-200 font-mono">{lexicalErrors.length}</strong></span>
            <span>·</span>
            <span>Syntax: <strong className="text-slate-200 font-mono">{syntaxErrors.length}</strong></span>
            <span>·</span>
            <span>Semantic: <strong className="text-slate-200 font-mono">{semanticErrors.length}</strong></span>
          </div>
        </div>

        <button
          onClick={copyErrorReport}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          title="Copy formatted diagnostic log"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Log'}</span>
        </button>
      </div>

      {/* Terminal-Style Error Stream */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800/80 text-slate-400 text-[11px]">
          <Terminal className="w-3.5 h-3.5" />
          <span>Uniform Diagnostic Output (Lab-07 Specification)</span>
        </div>

        {errors.map((err) => (
          <div
            key={err.id}
            onClick={() => onSelectLine && onSelectLine(err.line)}
            className="p-3 rounded-lg border transition-all cursor-pointer group bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30 hover:border-rose-700/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-sans font-semibold tracking-wide shrink-0 ${
                    err.phase === 'lexical'
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                      : err.phase === 'syntax'
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                      : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                  }`}
                >
                  {err.phase}
                </span>
                <span className="text-rose-200 group-hover:text-white leading-relaxed">
                  {err.formattedText}
                </span>
              </div>

              <span className="text-slate-400 group-hover:text-sky-400 text-[11px] shrink-0 font-sans tabular-nums underline decoration-slate-700 group-hover:decoration-sky-400">
                Jump to line {err.line} &rarr;
              </span>
            </div>
          </div>
        ))}

        {warnings.map((warn) => (
          <div
            key={warn.id}
            onClick={() => onSelectLine && onSelectLine(warn.line)}
            className="p-3 rounded-lg border transition-all cursor-pointer group bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/30 hover:border-amber-700/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-sans font-semibold tracking-wide shrink-0 bg-amber-900/60 text-amber-300 border border-amber-700/50">
                  Warning
                </span>
                <span className="text-amber-200 group-hover:text-white leading-relaxed">
                  {warn.formattedText}
                </span>
              </div>
              <span className="text-slate-400 group-hover:text-amber-300 text-[11px] shrink-0 font-sans tabular-nums underline">
                Jump to line {warn.line} &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
