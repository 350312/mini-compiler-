/**
 * CSE 2210: Compiler Laboratory - Part B: Parser + AST Construction (Bison/Yacc Logic)
 */

import {
  AssignNode,
  BinaryOpNode,
  BlockNode,
  CompilerError,
  DataType,
  DoWhileNode,
  ExpressionNode,
  IfNode,
  LiteralNode,
  PrintNode,
  ProgramNode,
  StatementNode,
  Token,
  UnaryOpNode,
  VarDeclNode,
  VariableNode,
  WhileNode,
} from './types';

export interface ParserOptions {
  recoveryMode: 'panic' | 'stop_at_first';
}

export interface ParserResult {
  ast: ProgramNode | null;
  errors: CompilerError[];
}

export function parse(tokens: Token[], options: ParserOptions = { recoveryMode: 'panic' }): ParserResult {
  let current = 0;
  const errors: CompilerError[] = [];
  let astIdCounter = 1;

  function nextId(): string {
    return `ast_node_${astIdCounter++}`;
  }

  function peek(): Token {
    return tokens[current] || {
      id: 'eof',
      type: 'EOF',
      value: '<EOF>',
      line: tokens[tokens.length - 1]?.line || 1,
      column: 1,
    };
  }

  function previous(): Token {
    return tokens[current - 1] || peek();
  }

  function isAtEnd(): boolean {
    return peek().type === 'EOF';
  }

  function advance(): Token {
    if (!isAtEnd()) current++;
    return previous();
  }

  function check(type: string, value?: string): boolean {
    if (isAtEnd()) return false;
    const token = peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  function match(type: string, ...values: string[]): boolean {
    if (values.length === 0) {
      if (check(type)) {
        advance();
        return true;
      }
      return false;
    }
    for (const val of values) {
      if (check(type, val)) {
        advance();
        return true;
      }
    }
    return false;
  }

  function recordSyntaxError(expected: string, foundToken: Token): CompilerError {
    const foundStr = foundToken.type === 'EOF' ? 'end of file' : `'${foundToken.value}'`;
    const message = `expected ${expected} but found ${foundStr}`;
    const formattedText = `Syntax Error at line ${foundToken.line}: ${message}`;

    const err: CompilerError = {
      id: `syn_err_${errors.length + 1}`,
      phase: 'syntax',
      line: foundToken.line,
      column: foundToken.column,
      message,
      formattedText,
      severity: 'error',
    };
    errors.push(err);
    return err;
  }

  function consume(type: string, expectedDesc: string, value?: string): Token | null {
    if (check(type, value)) {
      return advance();
    }

    const found = peek();
    recordSyntaxError(expectedDesc, found);

    if (options.recoveryMode === 'stop_at_first') {
      throw new Error('Stop at first syntax error');
    }
    return null;
  }

  /**
   * Panic-mode error recovery:
   * Discards tokens until reaching a statement boundary or synchronization point.
   */
  function synchronize() {
    advance();

    while (!isAtEnd()) {
      if (previous().value === ';') return;
      if (previous().value === '}') return;

      switch (peek().value) {
        case 'int':
        case 'float':
        case 'string':
        case 'bool':
        case 'if':
        case 'while':
        case 'do':
        case 'print':
        case '{':
          return;
      }

      advance();
    }
  }

  // Grammar Parsing functions
  function parseProgram(): ProgramNode {
    const statements: StatementNode[] = [];
    const startLine = peek().line;

    while (!isAtEnd()) {
      try {
        const stmt = parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch {
        if (options.recoveryMode === 'stop_at_first') {
          break;
        }
        synchronize();
      }
    }

    return {
      id: nextId(),
      kind: 'Program',
      line: startLine,
      column: 1,
      statements,
    };
  }

  function parseStatement(): StatementNode | null {
    const token = peek();

    // Variable declaration: int, float, string, bool
    if (token.type === 'KEYWORD' && ['int', 'float', 'string', 'bool'].includes(token.value)) {
      return parseDeclaration();
    }

    // If statement: if ( condition ) stmt [else stmt]
    if (token.type === 'KEYWORD' && token.value === 'if') {
      return parseIfStatement();
    }

    // While statement: while ( condition ) stmt
    if (token.type === 'KEYWORD' && token.value === 'while') {
      return parseWhileStatement();
    }

    // Do-While statement: do stmt while ( condition ) ;
    if (token.type === 'KEYWORD' && token.value === 'do') {
      return parseDoWhileStatement();
    }

    // Print statement: print ( expr ) ;
    if (token.type === 'KEYWORD' && token.value === 'print') {
      return parsePrintStatement();
    }

    // Block statement: { stmt* }
    if (token.type === 'PUNCTUATION' && token.value === '{') {
      return parseBlock();
    }

    // Assignment or expression statement starting with identifier: x = expr ;
    if (token.type === 'IDENTIFIER') {
      return parseAssignment();
    }

    // Unexpected statement start
    const unexpectedToken = advance();
    recordSyntaxError("statement (declaration, assignment, if, while, do, print, or '{')", unexpectedToken);
    synchronize();
    return null;
  }

  function parseDeclaration(): VarDeclNode | null {
    const typeToken = advance();
    const line = typeToken.line;
    const col = typeToken.column;
    const varType = typeToken.value as DataType;

    const idToken = consume('IDENTIFIER', 'identifier name');
    if (!idToken) {
      synchronize();
      return null;
    }

    let initExpr: ExpressionNode | undefined;

    if (match('OPERATOR', '=')) {
      const expr = parseExpression();
      if (!expr) {
        synchronize();
        return null;
      }
      initExpr = expr;
    }

    const semiToken = consume('PUNCTUATION', "';'", ';');
    if (!semiToken && options.recoveryMode === 'panic') {
      // Lookahead: if next token starts another statement, don't cascade wildly
    }

    return {
      id: nextId(),
      kind: 'VarDecl',
      line,
      column: col,
      varType,
      identifier: idToken.value,
      initExpr,
    };
  }

  function parseAssignment(): AssignNode | null {
    const idToken = advance();
    const line = idToken.line;
    const col = idToken.column;

    const eqToken = consume('OPERATOR', "'='", '=');
    if (!eqToken) {
      synchronize();
      return null;
    }

    const expr = parseExpression();
    if (!expr) {
      synchronize();
      return null;
    }

    consume('PUNCTUATION', "';'", ';');

    return {
      id: nextId(),
      kind: 'Assign',
      line,
      column: col,
      identifier: idToken.value,
      expr,
    };
  }

  function parseIfStatement(): IfNode | null {
    const ifToken = advance(); // 'if'
    const line = ifToken.line;
    const col = ifToken.column;

    if (!consume('PUNCTUATION', "'('", '(')) {
      synchronize();
      return null;
    }

    const condition = parseExpression();
    if (!condition) {
      synchronize();
      return null;
    }

    if (!consume('PUNCTUATION', "')'", ')')) {
      synchronize();
      return null;
    }

    const thenBranch = parseStatement();
    if (!thenBranch) {
      return null;
    }

    let elseBranch: StatementNode | undefined;
    if (check('KEYWORD', 'else')) {
      advance(); // consume 'else'
      const elseStmt = parseStatement();
      if (elseStmt) {
        elseBranch = elseStmt;
      }
    }

    return {
      id: nextId(),
      kind: 'If',
      line,
      column: col,
      condition,
      thenBranch,
      elseBranch,
    };
  }

  function parseWhileStatement(): WhileNode | null {
    const whileToken = advance(); // 'while'
    const line = whileToken.line;
    const col = whileToken.column;

    if (!consume('PUNCTUATION', "'('", '(')) {
      synchronize();
      return null;
    }

    const condition = parseExpression();
    if (!condition) {
      synchronize();
      return null;
    }

    if (!consume('PUNCTUATION', "')'", ')')) {
      synchronize();
      return null;
    }

    const body = parseStatement();
    if (!body) return null;

    return {
      id: nextId(),
      kind: 'While',
      line,
      column: col,
      condition,
      body,
    };
  }

  function parseDoWhileStatement(): DoWhileNode | null {
    const doToken = advance(); // 'do'
    const line = doToken.line;
    const col = doToken.column;

    const body = parseStatement();
    if (!body) {
      synchronize();
      return null;
    }

    if (!consume('KEYWORD', "'while'", 'while')) {
      synchronize();
      return null;
    }

    if (!consume('PUNCTUATION', "'('", '(')) {
      synchronize();
      return null;
    }

    const condition = parseExpression();
    if (!condition) {
      synchronize();
      return null;
    }

    if (!consume('PUNCTUATION', "')'", ')')) {
      synchronize();
      return null;
    }

    consume('PUNCTUATION', "';'", ';');

    return {
      id: nextId(),
      kind: 'DoWhile',
      line,
      column: col,
      condition,
      body,
    };
  }

  function parsePrintStatement(): PrintNode | null {
    const printToken = advance(); // 'print'
    const line = printToken.line;
    const col = printToken.column;

    if (!consume('PUNCTUATION', "'('", '(')) {
      synchronize();
      return null;
    }

    const expr = parseExpression();
    if (!expr) {
      synchronize();
      return null;
    }

    if (!consume('PUNCTUATION', "')'", ')')) {
      synchronize();
      return null;
    }

    consume('PUNCTUATION', "';'", ';');

    return {
      id: nextId(),
      kind: 'Print',
      line,
      column: col,
      expr,
    };
  }

  function parseBlock(): BlockNode | null {
    const openBrace = advance(); // '{'
    const line = openBrace.line;
    const col = openBrace.column;
    const statements: StatementNode[] = [];

    while (!check('PUNCTUATION', '}') && !isAtEnd()) {
      try {
        const stmt = parseStatement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch {
        if (options.recoveryMode === 'stop_at_first') break;
        synchronize();
      }
    }

    consume('PUNCTUATION', "'}'", '}');

    return {
      id: nextId(),
      kind: 'Block',
      line,
      column: col,
      statements,
    };
  }

  // Precedence Parsing for Expressions
  // Logical OR -> Logical AND -> Equality -> Relational -> Additive -> Multiplicative -> Unary -> Primary

  function parseExpression(): ExpressionNode | null {
    return parseLogicalOr();
  }

  function parseLogicalOr(): ExpressionNode | null {
    let expr = parseLogicalAnd();
    if (!expr) return null;

    while (match('OPERATOR', '||')) {
      const op = previous().value as '||';
      const opLine = previous().line;
      const opCol = previous().column;
      const right = parseLogicalAnd();
      if (!right) return null;
      expr = {
        id: nextId(),
        kind: 'BinaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        left: expr,
        right,
      };
    }
    return expr;
  }

  function parseLogicalAnd(): ExpressionNode | null {
    let expr = parseEquality();
    if (!expr) return null;

    while (match('OPERATOR', '&&')) {
      const op = previous().value as '&&';
      const opLine = previous().line;
      const opCol = previous().column;
      const right = parseEquality();
      if (!right) return null;
      expr = {
        id: nextId(),
        kind: 'BinaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        left: expr,
        right,
      };
    }
    return expr;
  }

  function parseEquality(): ExpressionNode | null {
    let expr = parseRelational();
    if (!expr) return null;

    while (match('OPERATOR', '==', '!=')) {
      const op = previous().value as '==' | '!=';
      const opLine = previous().line;
      const opCol = previous().column;
      const right = parseRelational();
      if (!right) return null;
      expr = {
        id: nextId(),
        kind: 'BinaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        left: expr,
        right,
      };
    }
    return expr;
  }

  function parseRelational(): ExpressionNode | null {
    let expr = parseAdditive();
    if (!expr) return null;

    while (match('OPERATOR', '<', '<=', '>', '>=')) {
      const op = previous().value as '<' | '<=' | '>' | '>=';
      const opLine = previous().line;
      const opCol = previous().column;
      const right = parseAdditive();
      if (!right) return null;
      expr = {
        id: nextId(),
        kind: 'BinaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        left: expr,
        right,
      };
    }
    return expr;
  }

  function parseAdditive(): ExpressionNode | null {
    let expr = parseMultiplicative();
    if (!expr) return null;

    while (match('OPERATOR', '+', '-')) {
      const op = previous().value as '+' | '-';
      const opLine = previous().line;
      const opCol = previous().column;
      const right = parseMultiplicative();
      if (!right) return null;
      expr = {
        id: nextId(),
        kind: 'BinaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        left: expr,
        right,
      };
    }
    return expr;
  }

  function parseMultiplicative(): ExpressionNode | null {
    let expr = parseUnary();
    if (!expr) return null;

    while (match('OPERATOR', '*', '/', '%')) {
      const op = previous().value as '*' | '/' | '%';
      const opLine = previous().line;
      const opCol = previous().column;
      const right = parseUnary();
      if (!right) return null;
      expr = {
        id: nextId(),
        kind: 'BinaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        left: expr,
        right,
      };
    }
    return expr;
  }

  function parseUnary(): ExpressionNode | null {
    if (match('OPERATOR', '!', '-')) {
      const op = previous().value as '!' | '-';
      const opLine = previous().line;
      const opCol = previous().column;
      const operand = parseUnary();
      if (!operand) return null;
      return {
        id: nextId(),
        kind: 'UnaryOp',
        line: opLine,
        column: opCol,
        operator: op,
        operand,
      };
    }
    return parsePrimary();
  }

  function parsePrimary(): ExpressionNode | null {
    const token = peek();

    // Integer literal
    if (match('INT_LITERAL')) {
      const prev = previous();
      return {
        id: nextId(),
        kind: 'Literal',
        line: prev.line,
        column: prev.column,
        dataType: 'int',
        value: parseInt(prev.value, 10),
      };
    }

    // Float literal
    if (match('FLOAT_LITERAL')) {
      const prev = previous();
      return {
        id: nextId(),
        kind: 'Literal',
        line: prev.line,
        column: prev.column,
        dataType: 'float',
        value: parseFloat(prev.value),
      };
    }

    // String literal
    if (match('STRING_LITERAL')) {
      const prev = previous();
      return {
        id: nextId(),
        kind: 'Literal',
        line: prev.line,
        column: prev.column,
        dataType: 'string',
        value: prev.value,
      };
    }

    // Boolean literal
    if (match('BOOL_LITERAL')) {
      const prev = previous();
      return {
        id: nextId(),
        kind: 'Literal',
        line: prev.line,
        column: prev.column,
        dataType: 'bool',
        value: prev.value === 'true',
      };
    }

    // Variable reference
    if (match('IDENTIFIER')) {
      const prev = previous();
      return {
        id: nextId(),
        kind: 'Variable',
        line: prev.line,
        column: prev.column,
        identifier: prev.value,
      };
    }

    // Grouping: ( expr )
    if (match('PUNCTUATION', '(')) {
      const parenToken = previous();
      const expr = parseExpression();
      if (!expr) return null;
      consume('PUNCTUATION', "')' after expression", ')');
      return expr;
    }

    // Malformed expression
    const foundToken = advance();
    recordSyntaxError("expression (literal, identifier, or '(')", foundToken);
    return null;
  }

  let ast: ProgramNode | null = null;
  try {
    ast = parseProgram();
  } catch (err: any) {
    if (options.recoveryMode !== 'stop_at_first') {
      console.error('Parser crash:', err);
    }
  }

  return { ast, errors };
}
