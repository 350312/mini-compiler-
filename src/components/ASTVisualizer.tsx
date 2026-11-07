/**
 * CSE 2210: Interactive Abstract Syntax Tree (AST) Visualizer
 * Visualizes the tree structure with node badges, line numbers, and collapsible branches.
 */

import React, { useState } from 'react';
import { ASTNode, ProgramNode } from '../compiler/types';
import { ChevronDown, ChevronRight, Code2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ASTVisualizerProps {
  ast: ProgramNode | null;
  onSelectLine?: (line: number) => void;
}

export const ASTVisualizer: React.FC<ASTVisualizerProps> = ({ ast, onSelectLine }) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  if (!ast) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
        <Code2 className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-300">No AST available</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Fix any syntax or lexical errors, or click "Compile & Analyze" to construct the Abstract Syntax Tree.
        </p>
      </div>
    );
  }

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsedNodes(new Set());

  const collapseAll = () => {
    const allIds = new Set<string>();
    const collectIds = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.id) allIds.add(node.id);
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(collectIds);
        } else if (typeof node[key] === 'object') {
          collectIds(node[key]);
        }
      }
    };
    collectIds(ast);
    setCollapsedNodes(allIds);
  };

  const renderNode = (node: ASTNode, label?: string, depth: number = 0): React.ReactNode => {
    const isCollapsed = collapsedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    let title: string = node.kind;
    let badge = '';
    let details = '';
    const children: { label: string; node: ASTNode }[] = [];

    switch (node.kind) {
      case 'Program':
        title = 'Program';
        details = `${(node as ProgramNode).statements.length} statement(s)`;
        (node as ProgramNode).statements.forEach((stmt, idx) => {
          children.push({ label: `stmt[${idx}]`, node: stmt });
        });
        break;

      case 'VarDecl':
        title = 'VarDecl';
        badge = node.varType;
        details = `${node.identifier}${node.initExpr ? ' = ...' : ''}`;
        if (node.initExpr) {
          children.push({ label: 'init', node: node.initExpr });
        }
        break;

      case 'Assign':
        title = 'Assign';
        details = `${node.identifier} =`;
        children.push({ label: 'expr', node: node.expr });
        break;

      case 'If':
        title = 'If';
        children.push({ label: 'condition', node: node.condition });
        children.push({ label: 'then', node: node.thenBranch });
        if (node.elseBranch) {
          children.push({ label: 'else', node: node.elseBranch });
        }
        break;

      case 'While':
        title = 'While';
        children.push({ label: 'condition', node: node.condition });
        children.push({ label: 'body', node: node.body });
        break;

      case 'DoWhile':
        title = 'DoWhile';
        children.push({ label: 'body', node: node.body });
        children.push({ label: 'condition', node: node.condition });
        break;

      case 'Print':
        title = 'Print';
        children.push({ label: 'arg', node: node.expr });
        break;

      case 'Block':
        title = 'Block';
        details = `${node.statements.length} stmt(s)`;
        node.statements.forEach((s, idx) => {
          children.push({ label: `[${idx}]`, node: s });
        });
        break;

      case 'BinaryOp':
        title = `BinaryOp (${node.operator})`;
        badge = node.inferredType || '';
        children.push({ label: 'left', node: node.left });
        children.push({ label: 'right', node: node.right });
        break;

      case 'UnaryOp':
        title = `UnaryOp (${node.operator})`;
        badge = node.inferredType || '';
        children.push({ label: 'operand', node: node.operand });
        break;

      case 'Literal':
        title = `Literal`;
        badge = node.dataType;
        details = JSON.stringify(node.value);
        break;

      case 'Variable':
        title = `Variable`;
        badge = node.inferredType || '';
        details = node.identifier;
        break;
    }

    const hasChildren = children.length > 0;

    return (
      <div key={node.id} className="relative pl-4 select-none">
        {/* Branch line */}
        {depth > 0 && (
          <div className="absolute -left-2 top-3 w-4 h-px bg-slate-700/60" />
        )}

        <div
          onClick={() => {
            setSelectedNodeId(node.id);
            if (node.line && onSelectLine) {
              onSelectLine(node.line);
            }
          }}
          className={`group flex items-center gap-2 py-1 px-2.5 my-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
            isSelected
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-sm'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300'
          }`}
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className="p-0.5 text-slate-400 hover:text-slate-100 rounded"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 inline-block text-slate-600">·</span>
          )}

          {label && (
            <span className="text-slate-400 font-sans text-[11px] uppercase tracking-wider">
              {label}:
            </span>
          )}

          <span className="font-semibold text-sky-400">{title}</span>

          {badge && (
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-800 text-amber-300 border border-amber-500/20 font-sans">
              {badge}
            </span>
          )}

          {details && (
            <span className="text-emerald-400 bg-emerald-950/30 px-1 rounded truncate max-w-xs">
              {details}
            </span>
          )}

          {node.line && (
            <span className="ml-auto text-[10px] text-slate-400 font-sans tabular-nums">
              line {node.line}
            </span>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <div className="border-l border-slate-800/80 ml-2 pl-2">
            {children.map((child, idx) => (
              <React.Fragment key={idx}>
                {renderNode(child.node, child.label, depth + 1)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
      {/* Visualizer Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-300">Abstract Syntax Tree (AST)</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            {ast.statements.length} Root Statements
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
          >
            Collapse All
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <button
            onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono w-9 text-center tabular-nums">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950/60 font-mono text-xs">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
          className="transition-transform duration-150 inline-block min-w-full"
        >
          {renderNode(ast)}
        </div>
      </div>
    </div>
  );
};
