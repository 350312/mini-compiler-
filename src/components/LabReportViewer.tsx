/**
 * CSE 2210: Lab Report Viewer & Generator Component
 * Compliant with Lab-07 submission checklist item (c).
 */

import React, { useState } from 'react';
import { DEFAULT_TEAM_MEMBERS, LAB_REPORT_CONTENT, TeamMember } from '../compiler/labReportData';
import { FileText, Copy, Check, Download, Printer, UserPlus, Trash2, Edit3 } from 'lucide-react';

export const LabReportViewer: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [copied, setCopied] = useState(false);
  const [isEditingMembers, setIsEditingMembers] = useState(false);

  const handleCopyMarkdown = () => {
    let md = `# ${LAB_REPORT_CONTENT.courseTitle}\n## ${LAB_REPORT_CONTENT.labTitle}\n\n`;
    md += `### Team Members & Contributions\n\n`;
    members.forEach((m, idx) => {
      md += `${idx + 1}. **${m.name}** (ID: ${m.studentId}) — *${m.role}*\n   Contribution: ${m.contributions}\n\n`;
    });
    md += `### Project Overview\n${LAB_REPORT_CONTENT.projectOverview}\n\n`;
    md += `${LAB_REPORT_CONTENT.grammarDecisions}\n\n`;
    md += `${LAB_REPORT_CONTENT.errorRecovery}\n\n`;
    md += `${LAB_REPORT_CONTENT.typeMatrix}\n\n`;
    md += `${LAB_REPORT_CONTENT.symbolTableDesign}\n\n`;
    md += `${LAB_REPORT_CONTENT.limitations}\n\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    let md = `# ${LAB_REPORT_CONTENT.courseTitle}\n## ${LAB_REPORT_CONTENT.labTitle}\n\n`;
    md += `### Team Members & Contributions\n\n`;
    members.forEach((m, idx) => {
      md += `${idx + 1}. **${m.name}** (ID: ${m.studentId}) — *${m.role}*\n   Contribution: ${m.contributions}\n\n`;
    });
    md += `### Project Overview\n${LAB_REPORT_CONTENT.projectOverview}\n\n`;
    md += `${LAB_REPORT_CONTENT.grammarDecisions}\n\n`;
    md += `${LAB_REPORT_CONTENT.errorRecovery}\n\n`;
    md += `${LAB_REPORT_CONTENT.typeMatrix}\n\n`;
    md += `${LAB_REPORT_CONTENT.symbolTableDesign}\n\n`;
    md += `${LAB_REPORT_CONTENT.limitations}\n\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CSE2210_Lab07_Compiler_Report.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const updateMember = (index: number, field: keyof TeamMember, val: string) => {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        name: `Student Name ${prev.length + 1}`,
        studentId: `2022-CSE-00${prev.length + 1}`,
        role: 'Compiler Engineer',
        contributions: 'Contributed to lexical/parser testing and validation.',
      },
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden text-slate-200">
      {/* Top Action Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">
            Project Academic Report (Submission Item C)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingMembers(!isEditingMembers)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
              isEditingMembers
                ? 'bg-sky-600 text-white font-medium'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingMembers ? 'Done Editing' : 'Edit Team Members'}</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            title="Print report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Report Content Body */}
      <div className="flex-1 overflow-auto p-6 md:p-8 space-y-8 bg-slate-950 font-sans text-sm leading-relaxed">
        {/* Title Header */}
        <div className="border-b border-slate-800 pb-6 text-center max-w-3xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-sky-400 font-semibold mb-2">
            Compiler Laboratory Laboratory Project
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {LAB_REPORT_CONTENT.labTitle}
          </h1>
          <p className="text-slate-400 text-xs mt-2">{LAB_REPORT_CONTENT.courseTitle}</p>
        </div>

        {/* Team Members Section */}
        <div className="max-w-3xl mx-auto bg-slate-900/60 p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Team Members & Contributions
            </h3>
            {isEditingMembers && (
              <button
                onClick={addMember}
                className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          <div className="space-y-4">
            {members.map((member, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2"
              >
                {isEditingMembers ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(idx, 'name', e.target.value)}
                      placeholder="Name"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={member.studentId}
                      onChange={(e) => updateMember(idx, 'studentId', e.target.value)}
                      placeholder="Student ID"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateMember(idx, 'role', e.target.value)}
                        placeholder="Role"
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                      />
                      <button
                        onClick={() => removeMember(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={member.contributions}
                      onChange={(e) => updateMember(idx, 'contributions', e.target.value)}
                      placeholder="Contributions"
                      rows={2}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white col-span-1 md:col-span-3"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{member.name}</span>
                        <span className="text-slate-500 font-mono">[{member.studentId}]</span>
                      </div>
                      <span className="text-sky-400 text-[11px] bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/30">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      <span className="text-slate-300 font-medium">Contributions: </span>
                      {member.contributions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Project Overview */}
        <div className="max-w-3xl mx-auto space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">
            01. Project Overview & Scope
          </h2>
          <p className="text-slate-300 leading-relaxed">{LAB_REPORT_CONTENT.projectOverview}</p>
        </div>

        {/* Grammar Design */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">
            02. Grammar Design Decisions & Precedence
          </h2>
          <div className="text-slate-300 space-y-3 text-xs leading-relaxed">
            <p>
              The mini-language is defined via an LALR(1) context-free grammar parsed using Bison.
              Operator precedence is enforced through Bison precedence declarations:
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="py-2 px-3">Level</th>
                    <th className="py-2 px-3">Operators</th>
                    <th className="py-2 px-3">Associativity</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr><td className="py-1.5 px-3">1</td><td className="py-1.5 px-3 text-sky-300">=</td><td className="py-1.5 px-3 font-sans">Right</td><td className="py-1.5 px-3 font-sans">Assignment</td></tr>
                  <tr><td className="py-1.5 px-3">2</td><td className="py-1.5 px-3 text-sky-300">||</td><td className="py-1.5 px-3 font-sans">Left</td><td className="py-1.5 px-3 font-sans">Logical OR</td></tr>
                  <tr><td className="py-1.5 px-3">3</td><td className="py-1.5 px-3 text-sky-300">&&</td><td className="py-1.5 px-3 font-sans">Left</td><td className="py-1.5 px-3 font-sans">Logical AND</td></tr>
                  <tr><td className="py-1.5 px-3">4</td><td className="py-1.5 px-3 text-sky-300">== !=</td><td className="py-1.5 px-3 font-sans">Left</td><td className="py-1.5 px-3 font-sans">Equality</td></tr>
                  <tr><td className="py-1.5 px-3">5</td><td className="py-1.5 px-3 text-sky-300">&lt; &lt;= &gt; &gt;=</td><td className="py-1.5 px-3 font-sans">Left</td><td className="py-1.5 px-3 font-sans">Relational</td></tr>
                  <tr><td className="py-1.5 px-3">6</td><td className="py-1.5 px-3 text-sky-300">+ -</td><td className="py-1.5 px-3 font-sans">Left</td><td className="py-1.5 px-3 font-sans">Additive & String Concat</td></tr>
                  <tr><td className="py-1.5 px-3">7</td><td className="py-1.5 px-3 text-sky-300">* / %</td><td className="py-1.5 px-3 font-sans">Left</td><td className="py-1.5 px-3 font-sans">Multiplicative & Modulo</td></tr>
                  <tr><td className="py-1.5 px-3">8</td><td className="py-1.5 px-3 text-sky-300">! - (unary)</td><td className="py-1.5 px-3 font-sans">Right</td><td className="py-1.5 px-3 font-sans">Unary NOT & Negation</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Error Recovery Strategy */}
        <div className="max-w-3xl mx-auto space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">
            03. Error Recovery Strategy
          </h2>
          <div className="text-slate-300 text-xs space-y-3 leading-relaxed">
            <p>
              We implemented <strong className="text-white">Panic-Mode Error Recovery</strong>. When the parser encounters an unexpected or missing token:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>An error is logged immediately in the required format: <code className="text-rose-300">Syntax Error at line N: expected X but found Y</code>.</li>
              <li>The parser enters recovery mode and discards remaining tokens until reaching a synchronization anchor: semicolons (<code className="text-sky-300">;</code>), closing braces (<code className="text-sky-300">{'}'}</code>), or statement keywords (<code className="text-purple-300">if</code>, <code className="text-purple-300">while</code>, <code className="text-purple-300">do</code>, <code className="text-purple-300">print</code>, type declarations).</li>
              <li>Once synchronized, parsing resumes normally, allowing the compiler to report multiple discrete syntax errors in one pass without cascading spurious errors.</li>
              <li>A configuration toggle is also provided to test strict single-error halting.</li>
            </ul>
          </div>
        </div>

        {/* Type Compatibility Matrix */}
        <div className="max-w-3xl mx-auto space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">
            04. Type Compatibility Rules Matrix
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800 text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="py-2 px-3">Operation</th>
                  <th className="py-2 px-3">Operand 1</th>
                  <th className="py-2 px-3">Operand 2</th>
                  <th className="py-2 px-3">Result</th>
                  <th className="py-2 px-3">Enforced Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-400 font-mono text-[11px]">
                <tr><td className="py-1.5 px-3 font-sans">Arithmetic (+, -, *, /)</td><td className="py-1.5 px-3">int</td><td className="py-1.5 px-3">int</td><td className="py-1.5 px-3 text-emerald-400">int</td><td className="py-1.5 px-3 font-sans">Integer arithmetic</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Arithmetic (+, -, *, /)</td><td className="py-1.5 px-3">float</td><td className="py-1.5 px-3">float</td><td className="py-1.5 px-3 text-emerald-400">float</td><td className="py-1.5 px-3 font-sans">Float arithmetic</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Mixed Arithmetic</td><td className="py-1.5 px-3">int / float</td><td className="py-1.5 px-3">float / int</td><td className="py-1.5 px-3 text-emerald-400">float</td><td className="py-1.5 px-3 font-sans">Implicit int &rarr; float widening</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Concatenation (+)</td><td className="py-1.5 px-3">string</td><td className="py-1.5 px-3">string</td><td className="py-1.5 px-3 text-emerald-400">string</td><td className="py-1.5 px-3 font-sans">String concatenation</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Modulo (%)</td><td className="py-1.5 px-3">int</td><td className="py-1.5 px-3">int</td><td className="py-1.5 px-3 text-emerald-400">int</td><td className="py-1.5 px-3 font-sans">Requires integer operands only</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Relational (&lt;, &lt;=, &gt;, &gt;=)</td><td className="py-1.5 px-3">numeric</td><td className="py-1.5 px-3">numeric</td><td className="py-1.5 px-3 text-emerald-400">bool</td><td className="py-1.5 px-3 font-sans">Numeric ordering evaluation</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Logical (&&, ||)</td><td className="py-1.5 px-3">bool</td><td className="py-1.5 px-3">bool</td><td className="py-1.5 px-3 text-emerald-400">bool</td><td className="py-1.5 px-3 font-sans">Strict boolean operands</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Condition (if / while / do)</td><td className="py-1.5 px-3">bool</td><td className="py-1.5 px-3">—</td><td className="py-1.5 px-3 text-emerald-400">—</td><td className="py-1.5 px-3 font-sans">Expression must evaluate to bool</td></tr>
                <tr><td className="py-1.5 px-3 font-sans">Assignment (=)</td><td className="py-1.5 px-3">int</td><td className="py-1.5 px-3">string</td><td className="py-1.5 px-3 text-rose-400">ERROR</td><td className="py-1.5 px-3 font-sans">Bonus: type mismatch assigned to int</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Limitations */}
        <div className="max-w-3xl mx-auto space-y-3">
          <h2 className="text-lg font-bold text-white border-b border-slate-800/80 pb-2">
            05. Limitations & Future Development
          </h2>
          <div className="text-slate-300 text-xs space-y-2 leading-relaxed">
            <p>1. <strong>Function Invocations:</strong> The language does not currently support function definitions or parameter passing frames.</p>
            <p>2. <strong>Complex Data Structures:</strong> Arrays, structs, and pointers are targeted for subsequent laboratory milestones.</p>
            <p>3. <strong>Intermediate Representation:</strong> Future work will integrate Three-Address Code (TAC) and basic block generation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
