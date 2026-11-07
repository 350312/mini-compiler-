/**
 * CSE 2210: Compiler Laboratory - Lab-07 Project
 * Implementation of a Mini-Language Compiler
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { compileSource } from './compiler';
import { CompilationResult } from './compiler/types';
import { TEST_PROGRAMS } from './compiler/testPrograms';
import { CodeEditor } from './components/CodeEditor';
import { ASTVisualizer } from './components/ASTVisualizer';
import { SymbolTableViewer } from './components/SymbolTableViewer';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { TokenStreamViewer } from './components/TokenStreamViewer';
import { ExecutionTerminal } from './components/ExecutionTerminal';
import { SourceArtifactsViewer } from './components/SourceArtifactsViewer';
import { LabReportViewer } from './components/LabReportViewer';
import {
  Code2,
  Terminal,
  Database,
  AlertTriangle,
  FileCode,
  FileText,
  ListFilter,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Active test program
  const [selectedTestId, setSelectedTestId] = useState<string>(TEST_PROGRAMS[0].id);
  const [code, setCode] = useState<string>(TEST_PROGRAMS[0].code);

  // Recovery mode: panic vs stop_at_first
  const [recoveryMode, setRecoveryMode] = useState<'panic' | 'stop_at_first'>('panic');

  // Active right pane tab
  type TabType = 'diagnostics' | 'ast' | 'symbol_table' | 'tokens' | 'terminal' | 'source_artifacts' | 'report';
  const [activeTab, setActiveTab] = useState<TabType>('diagnostics');

  // Highlighted line from diagnostic click
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  // Compilation result state
  const [result, setResult] = useState<CompilationResult>(() =>
    compileSource(TEST_PROGRAMS[0].code, { recoveryMode: 'panic', autoRun: true })
  );

  // Run compilation
  const handleCompile = useCallback(() => {
    const res = compileSource(code, { recoveryMode, autoRun: true });
    setResult(res);

    // Auto-switch tab intelligently if user compiles
    if (res.allErrors.length > 0) {
      setActiveTab('diagnostics');
    } else if (res.executionOutput && res.executionOutput.length > 0) {
      setActiveTab('terminal');
    } else if (res.ast) {
      setActiveTab('ast');
    }
  }, [code, recoveryMode]);

  // Load a test program
  const handleSelectTest = (testId: string) => {
    const test = TEST_PROGRAMS.find((t) => t.id === testId);
    if (!test) return;
    setSelectedTestId(testId);
    setCode(test.code);
    setHighlightedLine(null);

    const res = compileSource(test.code, { recoveryMode, autoRun: true });
    setResult(res);

    if (res.allErrors.length > 0) {
      setActiveTab('diagnostics');
    } else {
      setActiveTab('terminal');
    }
  };

  const handleResetCode = () => {
    const test = TEST_PROGRAMS.find((t) => t.id === selectedTestId);
    if (test) {
      setCode(test.code);
      setHighlightedLine(null);
      const res = compileSource(test.code, { recoveryMode, autoRun: true });
      setResult(res);
    }
  };

  // When clicking an error or token line, highlight in code
  const handleSelectLine = (line: number) => {
    setHighlightedLine(line);
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedLine(null);
    }, 4000);
  };

  const currentTest = TEST_PROGRAMS.find((t) => t.id === selectedTestId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* Top Bar Contract (3 Zones: Brand wordmark - Nav tabs - Primary CTA) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
            CSE 2210 Mini-Language Compiler Laboratory
          </span>
        </div>

        {/* Zone 2: Single-line clean navigation tabs */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'diagnostics' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Diagnostics ({result.allErrors.length})
          </button>
          <button
            onClick={() => setActiveTab('ast')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'ast' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Interactive AST
          </button>
          <button
            onClick={() => setActiveTab('symbol_table')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'symbol_table' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Symbol Table ({result.flatSymbols.length})
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tokens' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Token Stream
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'terminal' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Terminal Output
          </button>
          <button
            onClick={() => setActiveTab('source_artifacts')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'source_artifacts' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Flex & Bison Source
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'report' ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Lab Report
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCompile}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Compile & Run</span>
          </button>
        </div>
      </header>

      {/* Test Program Selector Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium whitespace-nowrap">
            Submission Test Suite (14 Programs):
          </span>
          <select
            value={selectedTestId}
            onChange={(e) => handleSelectTest(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-sky-300 font-medium focus:outline-none focus:border-sky-500 cursor-pointer max-w-sm md:max-w-md truncate"
          >
            {TEST_PROGRAMS.map((prog) => (
              <option key={prog.id} value={prog.id}>
                [{prog.categoryLabel}] {prog.title}
              </option>
            ))}
          </select>
        </div>

        {currentTest && (
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span
              className={`px-2 py-0.5 rounded font-medium ${
                currentTest.category === 'valid'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                  : currentTest.category === 'lexical_error'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                  : currentTest.category === 'syntax_error'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-800/40'
              }`}
            >
              {currentTest.categoryLabel}
            </span>
            <span className="hidden md:inline max-w-md truncate">
              {currentTest.expectedBehavior}
            </span>
          </div>
        )}
      </div>

      {/* Main Workspace Grid */}
      <main className="flex-1 px-4 lg:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left Side: Code Editor (5 cols on lg) */}
        <section className="lg:col-span-5 h-[560px] lg:h-[calc(100vh-140px)] flex flex-col">
          <CodeEditor
            code={code}
            onChange={setCode}
            onCompile={handleCompile}
            onReset={handleResetCode}
            errors={result.allErrors}
            warnings={result.semanticWarnings}
            highlightedLine={highlightedLine}
            recoveryMode={recoveryMode}
            setRecoveryMode={(mode) => {
              setRecoveryMode(mode);
              // re-compile with new recovery mode
              setResult(compileSource(code, { recoveryMode: mode, autoRun: true }));
            }}
          />
        </section>

        {/* Right Side: Tabbed Compiler Inspector (7 cols on lg) */}
        <section className="lg:col-span-7 h-[560px] lg:h-[calc(100vh-140px)] flex flex-col bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
          {/* Tab Navigation Strip */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-2 overflow-x-auto text-xs shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'diagnostics'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Diagnostics</span>
                {result.allErrors.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-900/60 text-rose-300">
                    {result.allErrors.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ast')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'ast'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Interactive AST</span>
              </button>

              <button
                onClick={() => setActiveTab('symbol_table')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'symbol_table'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Symbol Table</span>
                {result.flatSymbols.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                    {result.flatSymbols.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('tokens')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'tokens'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Token Stream</span>
              </button>

              <button
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'terminal'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Output</span>
                {result.executionOutput && result.executionOutput.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-900/60 text-emerald-300">
                    {result.executionOutput.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('source_artifacts')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'source_artifacts'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Flex & Bison</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'report'
                    ? 'border-sky-500 text-sky-400 bg-slate-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Project Report</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === 'diagnostics' && (
              <DiagnosticsPanel
                errors={result.allErrors}
                warnings={result.semanticWarnings}
                onSelectLine={handleSelectLine}
              />
            )}

            {activeTab === 'ast' && (
              <ASTVisualizer ast={result.ast} onSelectLine={handleSelectLine} />
            )}

            {activeTab === 'symbol_table' && (
              <SymbolTableViewer
                symbolTable={result.symbolTable}
                flatSymbols={result.flatSymbols}
                onSelectLine={handleSelectLine}
              />
            )}

            {activeTab === 'tokens' && (
              <TokenStreamViewer tokens={result.tokens} onSelectLine={handleSelectLine} />
            )}

            {activeTab === 'terminal' && (
              <ExecutionTerminal
                output={result.executionOutput}
                executionError={result.executionError}
                hasErrors={result.allErrors.length > 0}
                onRunAgain={handleCompile}
              />
            )}

            {activeTab === 'source_artifacts' && <SourceArtifactsViewer />}

            {activeTab === 'report' && <LabReportViewer />}
          </div>
        </section>
      </main>
    </div>
  );
}
