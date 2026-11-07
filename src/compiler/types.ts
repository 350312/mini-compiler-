/**
 * CSE 2210: Compiler Laboratory - Lab-07 Project
 * Mini-Language Compiler Type Definitions
 */

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'INT_LITERAL'
  | 'FLOAT_LITERAL'
  | 'STRING_LITERAL'
  | 'BOOL_LITERAL'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'COMMENT'
  | 'EOF'
  | 'ERROR';

export interface Token {
  id: string;
  type: TokenType;
  value: string;
  line: number;
  column: number;
  raw?: string;
  isError?: boolean;
  errorMessage?: string;
}

export type DataType = 'int' | 'float' | 'string' | 'bool' | 'void' | 'unknown' | 'error';

export interface CompilerError {
  id: string;
  phase: 'lexical' | 'syntax' | 'semantic';
  line: number;
  column?: number;
  message: string;
  formattedText: string;
  severity: 'error' | 'warning';
}

// AST Nodes
export type ASTNodeKind =
  | 'Program'
  | 'VarDecl'
  | 'Assign'
  | 'If'
  | 'While'
  | 'DoWhile'
  | 'Print'
  | 'Block'
  | 'BinaryOp'
  | 'UnaryOp'
  | 'Literal'
  | 'Variable';

export interface BaseASTNode {
  id: string;
  kind: ASTNodeKind;
  line: number;
  column: number;
  inferredType?: DataType;
}

export interface ProgramNode extends BaseASTNode {
  kind: 'Program';
  statements: StatementNode[];
}

export interface VarDeclNode extends BaseASTNode {
  kind: 'VarDecl';
  varType: DataType;
  identifier: string;
  initExpr?: ExpressionNode;
}

export interface AssignNode extends BaseASTNode {
  kind: 'Assign';
  identifier: string;
  expr: ExpressionNode;
}

export interface IfNode extends BaseASTNode {
  kind: 'If';
  condition: ExpressionNode;
  thenBranch: StatementNode;
  elseBranch?: StatementNode;
}

export interface WhileNode extends BaseASTNode {
  kind: 'While';
  condition: ExpressionNode;
  body: StatementNode;
}

export interface DoWhileNode extends BaseASTNode {
  kind: 'DoWhile';
  condition: ExpressionNode;
  body: StatementNode;
}

export interface PrintNode extends BaseASTNode {
  kind: 'Print';
  expr: ExpressionNode;
}

export interface BlockNode extends BaseASTNode {
  kind: 'Block';
  statements: StatementNode[];
  scopeId?: string;
}

export type StatementNode =
  | VarDeclNode
  | AssignNode
  | IfNode
  | WhileNode
  | DoWhileNode
  | PrintNode
  | BlockNode;

export interface BinaryOpNode extends BaseASTNode {
  kind: 'BinaryOp';
  operator: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '<=' | '>' | '>=' | '&&' | '||';
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryOpNode extends BaseASTNode {
  kind: 'UnaryOp';
  operator: '!' | '-';
  operand: ExpressionNode;
}

export interface LiteralNode extends BaseASTNode {
  kind: 'Literal';
  dataType: DataType;
  value: number | string | boolean;
}

export interface VariableNode extends BaseASTNode {
  kind: 'Variable';
  identifier: string;
}

export type ExpressionNode =
  | BinaryOpNode
  | UnaryOpNode
  | LiteralNode
  | VariableNode;

export type ASTNode = StatementNode | ExpressionNode | ProgramNode;

// Symbol Table
export interface SymbolEntry {
  id: string;
  name: string;
  dataType: DataType;
  scopeLevel: number;
  scopeId: string;
  scopeName: string;
  declaredLine: number;
  initialized: boolean;
  value?: number | string | boolean;
  parentScopeId: string | null;
}

export interface Scope {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  symbols: Map<string, SymbolEntry>;
  childrenIds: string[];
}

export interface CompilationResult {
  sourceCode: string;
  tokens: Token[];
  lexicalErrors: CompilerError[];
  ast: ProgramNode | null;
  syntaxErrors: CompilerError[];
  symbolTable: Scope | null;
  flatSymbols: SymbolEntry[];
  semanticErrors: CompilerError[];
  semanticWarnings: CompilerError[];
  allErrors: CompilerError[];
  success: boolean;
  executionOutput?: string[];
  executionError?: string;
}

export interface TestProgram {
  id: string;
  title: string;
  category: 'valid' | 'lexical_error' | 'syntax_error' | 'semantic_error';
  categoryLabel: string;
  description: string;
  expectedBehavior: string;
  code: string;
}
