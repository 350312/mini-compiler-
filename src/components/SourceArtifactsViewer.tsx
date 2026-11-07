/**
 * CSE 2210: Source Artifacts Viewer & Package Exporter
 * Displays the complete C / Flex / Bison implementation files ready for laboratory submission.
 */

import React, { useState } from 'react';
import { FLEX_BISON_PACKAGE, SourceArtifact } from '../compiler/flexBisonArtifacts';
import { FileCode, Copy, Check, Download, ExternalLink } from 'lucide-react';

export const SourceArtifactsViewer: React.FC = () => {
  const [selectedFilename, setSelectedFilename] = useState<string>(FLEX_BISON_PACKAGE[0].filename);
  const [copied, setCopied] = useState(false);

  const currentArtifact =
    FLEX_BISON_PACKAGE.find((a) => a.filename === selectedFilename) || FLEX_BISON_PACKAGE[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentArtifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentArtifact.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllBundle = () => {
    let bundle = `#!/usr/bin/env bash
# CSE 2210 Compiler Lab-07 Project Source Archive
# Team Members:
# 1. Sourav Ahmed
# 2. Sakib Al Hasan Samid
# 3. Masum Noman Rad
# 4. Mahin Hossain

mkdir -p cse2210_compiler_lab
cd cse2210_compiler_lab

`;
    FLEX_BISON_PACKAGE.forEach((art) => {
      bundle += `cat << 'EOF' > ${art.filename}\n${art.content}\nEOF\n\n`;
    });
    bundle += 'echo "Files generated successfully. Building compiler..."\nmake\n./compiler\n';

    const blob = new Blob([bundle], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cse2210_setup_and_build.sh';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">
            Flex & Bison Source Package (Lab Submission Item A)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAllBundle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All (Shell Setup Script)</span>
          </button>
        </div>
      </div>

      {/* Main split: File List on Left, Code Viewer on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* File Tabs Sidebar */}
        <div className="w-full md:w-56 bg-slate-950/80 border-r border-slate-800 p-2 overflow-y-auto space-y-1 shrink-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Project Files
          </div>
          {FLEX_BISON_PACKAGE.map((file) => (
            <button
              key={file.filename}
              onClick={() => setSelectedFilename(file.filename)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors flex items-center justify-between ${
                selectedFilename === file.filename
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span>{file.filename}</span>
              {file.filename.endsWith('.l') && (
                <span className="text-[10px] bg-purple-950 text-purple-300 px-1 rounded font-sans">
                  Flex
                </span>
              )}
              {file.filename.endsWith('.y') && (
                <span className="text-[10px] bg-amber-950 text-amber-300 px-1 rounded font-sans">
                  Bison
                </span>
              )}
            </button>
          ))}

          <div className="mt-4 pt-3 border-t border-slate-800/80 px-2 text-[11px] text-slate-400 font-sans leading-relaxed">
            <strong className="text-slate-300 block mb-1">To Compile Locally:</strong>
            <code className="block bg-slate-900 p-1.5 rounded font-mono text-[10px] text-slate-300 my-1">
              $ make
            </code>
            Runs <code className="text-sky-300">bison -d parser.y</code> and <code className="text-purple-300">flex lexer.l</code> and links GCC.
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs">
            <div>
              <span className="font-mono text-slate-200 font-semibold">{currentArtifact.filename}</span>
              <span className="text-slate-500 mx-2">·</span>
              <span className="text-slate-400 font-sans">{currentArtifact.description}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950">
            <pre className="whitespace-pre">{currentArtifact.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
