/**
 * CSE 2210: Compiler Laboratory - Main Compiler Pipeline Interface
 */

import { executeProgram } from './interpreter';
import { tokenize } from './lexer';
import { parse, ParserOptions } from './parser';
import { analyzeSemantics } from './semantic';
import { CompilationResult, CompilerError } from './types';

export function compileSource(
  sourceCode: string,
  options: { recoveryMode: 'panic' | 'stop_at_first'; autoRun?: boolean } = {
    recoveryMode: 'panic',
    autoRun: true,
  }
): CompilationResult {
  // 1. Lexical Analysis
  const lexResult = tokenize(sourceCode);
  const lexicalErrors = lexResult.errors;

  // 2. Syntax Analysis & AST Construction
  const parserOptions: ParserOptions = { recoveryMode: options.recoveryMode };
  const parseResult = parse(lexResult.tokens, parserOptions);
  const syntaxErrors = parseResult.errors;
  const ast = parseResult.ast;

  // 3. Semantic Analysis & Symbol Table
  let semanticErrors: CompilerError[] = [];
  let semanticWarnings: CompilerError[] = [];
  let symbolTableManager = null;

  if (ast) {
    const semResult = analyzeSemantics(ast);
    semanticErrors = semResult.errors;
    semanticWarnings = semResult.warnings;
    symbolTableManager = semResult.symbolTableManager;
  }

  const allErrors: CompilerError[] = [
    ...lexicalErrors,
    ...syntaxErrors,
    ...semanticErrors,
  ];

  const success = allErrors.length === 0 && ast !== null;

  // 4. Execution (if compilation succeeded)
  let executionOutput: string[] | undefined;
  let executionError: string | undefined;

  if (success && ast && options.autoRun !== false) {
    const execRes = executeProgram(ast);
    executionOutput = execRes.output;
    executionError = execRes.executionError;
  }

  return {
    sourceCode,
    tokens: lexResult.tokens,
    lexicalErrors,
    ast,
    syntaxErrors,
    symbolTable: symbolTableManager ? symbolTableManager.getRootScope() : null,
    flatSymbols: symbolTableManager ? symbolTableManager.getFlatSymbols() : [],
    semanticErrors,
    semanticWarnings,
    allErrors,
    success,
    executionOutput,
    executionError,
  };
}
