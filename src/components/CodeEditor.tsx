/**
 * CSE 2210: Code Editor Component with Line Numbers, Error Markers, and Presets
 */

import React, { useRef, useEffect } from 'react';
import { CompilerError } from '../compiler/types';
import { Play, RotateCcw, AlertTriangle, CheckCircle, Sparkles, BookOpen } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  onCompile: () => void;
  onReset: () => void;
  errors: CompilerError[];
  warnings: CompilerError[];
  highlightedLine?: number | null;
  recoveryMode: 'panic' | 'stop_at_first';
  setRecoveryMode: (mode: 'panic' | 'stop_at_first') => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onCompile,
  onReset,
  errors,
  warnings,
  highlightedLine,
  recoveryMode,
  setRecoveryMode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');

  // Map errors and warnings by line number
  const errorsByLine = new Map<number, CompilerError>();
  errors.forEach((err) => {
    if (!errorsByLine.has(err.line)) {
      errorsByLine.set(err.line, err);
    }
  });

  const warningsByLine = new Map<number, CompilerError>();
  warnings.forEach((w) => {
    if (!warningsByLine.has(w.line)) {
      warningsByLine.set(w.line, w);
    }
  });

  // Keep scroll in sync between textarea and gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Scroll to highlighted line if passed
  useEffect(() => {
    if (highlightedLine && textareaRef.current) {
      const lineHeight = 20; // approximate line height in px
      const scrollPos = (highlightedLine - 3) * lineHeight;
      textareaRef.current.scrollTop = Math.max(0, scrollPos);
    }
  }, [highlightedLine]);

  // Handle Cmd+Enter / Ctrl+Enter to compile
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onCompile();
    }
  };

  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const nextCode = code.substring(0, start) + snippet + code.substring(end);
    onChange(nextCode);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + snippet.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Editor Controls Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onCompile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-sm transition-all active:scale-95"
            title="Compile and analyze source (Ctrl+Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Compile & Analyze</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Error Recovery Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
          <span className="text-slate-400">Recovery:</span>
          <button
            onClick={() => setRecoveryMode('panic')}
            className={`px-2 py-0.5 rounded transition-colors ${
              recoveryMode === 'panic'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Continues parsing after syntax error to discover multiple errors"
          >
            Panic-Mode
          </button>
          <button
            onClick={() => setRecoveryMode('stop_at_first')}
            className={`px-2 py-0.5 rounded transition-colors ${
              recoveryMode === 'stop_at_first'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Halts parsing at the very first syntax error"
          >
            Stop-at-First
          </button>
        </div>
      </div>

      {/* Snippet Bar */}
      <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 text-[11px] overflow-x-auto">
        <span className="text-slate-500 text-[10px] uppercase font-semibold shrink-0">Snippets:</span>
        <button
          onClick={() => insertSnippet('int count = 10;\n')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
        >
          + int decl
        </button>
        <button
          onClick={() => insertSnippet('float rate = 2.5;\n')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
        >
          + float decl
        </button>
        <button
          onClick={() => insertSnippet('if (x > 0) {\n  print("positive");\n} else {\n  print("non-positive");\n}\n')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
        >
          + if-else
        </button>
        <button
          onClick={() => insertSnippet('do {\n  sum = sum + 1;\n} while (sum < 10);\n')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
        >
          + do-while
        </button>
        <button
          onClick={() => insertSnippet('print("Result: ");\n')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors whitespace-nowrap"
        >
          + print
        </button>
      </div>

      {/* Editor Main Canvas: Gutter + Textarea */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-xs">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 bg-slate-900/80 border-r border-slate-800 text-slate-400 select-none py-3 overflow-hidden text-right pr-2 space-y-[2px]"
          style={{ lineHeight: '20px' }}
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const hasError = errorsByLine.has(lineNum);
            const hasWarning = warningsByLine.has(lineNum);
            const isHighlighted = highlightedLine === lineNum;

            return (
              <div
                key={lineNum}
                className={`h-[20px] flex items-center justify-end gap-1 px-1 transition-colors ${
                  isHighlighted
                    ? 'bg-sky-500/20 text-sky-300 font-bold'
                    : hasError
                    ? 'text-rose-400 font-bold bg-rose-950/40'
                    : hasWarning
                    ? 'text-amber-400 font-bold bg-amber-950/40'
                    : 'text-slate-400'
                }`}
                title={
                  hasError
                    ? errorsByLine.get(lineNum)?.formattedText
                    : hasWarning
                    ? warningsByLine.get(lineNum)?.formattedText
                    : undefined
                }
              >
                {hasError && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                {hasWarning && !hasError && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                <span className="tabular-nums">{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Code Input Area */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-100 p-3 outline-none resize-none overflow-auto font-mono text-xs leading-[20px] selection:bg-sky-500/30 whitespace-pre"
          placeholder="// Type or paste your Mini-Language program here..."
        />
      </div>

      {/* Editor Status Bar */}
      <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{code.length} characters</span>
          <span>·</span>
          <span className="text-slate-400">Ctrl+Enter to compile</span>
        </div>

        <div>
          {errors.length > 0 ? (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.length} Error{errors.length !== 1 ? 's' : ''} detected
            </span>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
