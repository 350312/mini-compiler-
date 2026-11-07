/**
 * CSE 2210: Compiler Laboratory - Part D: Semantic Analysis
 */

import { SymbolTableManager } from './symbolTable';
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
  UnaryOpNode,
  VarDeclNode,
  VariableNode,
  WhileNode,
} from './types';

export interface SemanticAnalysisResult {
  symbolTableManager: SymbolTableManager;
  errors: CompilerError[];
  warnings: CompilerError[];
}

export function analyzeSemantics(ast: ProgramNode): SemanticAnalysisResult {
  const symTable = new SymbolTableManager();
  const errors: CompilerError[] = [];
  const warnings: CompilerError[] = [];

  function addError(message: string, line: number, column?: number) {
    const formattedText = `Semantic Error at line ${line}: ${message}`;
    errors.push({
      id: `sem_err_${errors.length + 1}`,
      phase: 'semantic',
      line,
      column,
      message,
      formattedText,
      severity: 'error',
    });
  }

  function addWarning(message: string, line: number, column?: number) {
    const formattedText = `Semantic Warning at line ${line}: ${message}`;
    warnings.push({
      id: `sem_warn_${warnings.length + 1}`,
      phase: 'semantic',
      line,
      column,
      message,
      formattedText,
      severity: 'warning',
    });
  }

  function analyzeProgram(node: ProgramNode) {
    for (const stmt of node.statements) {
      analyzeStatement(stmt);
    }
  }

  function analyzeStatement(stmt: StatementNode) {
    switch (stmt.kind) {
      case 'VarDecl':
        analyzeVarDecl(stmt);
        break;
      case 'Assign':
        analyzeAssign(stmt);
        break;
      case 'If':
        analyzeIf(stmt);
        break;
      case 'While':
        analyzeWhile(stmt);
        break;
      case 'DoWhile':
        analyzeDoWhile(stmt);
        break;
      case 'Print':
        analyzePrint(stmt);
        break;
      case 'Block':
        analyzeBlock(stmt, 'Block');
        break;
    }
  }

  function analyzeVarDecl(node: VarDeclNode) {
    // 1. Check duplicate declaration in the CURRENT scope
    if (symTable.isDeclaredInCurrentScope(node.identifier)) {
      addError(
        `duplicate declaration of identifier '${node.identifier}' in the same scope`,
        node.line,
        node.column
      );
      return;
    }

    let isInit = false;
    let initVal: any = undefined;

    if (node.initExpr) {
      const exprType = analyzeExpression(node.initExpr);
      isInit = true;

      // Bonus check: Assignment / Initialization type mismatch
      if (exprType !== 'error' && !isTypeCompatible(node.varType, exprType)) {
        addError(
          `type mismatch — cannot assign '${exprType}' to variable of type '${node.varType}'`,
          node.line,
          node.column
        );
      }

      if (node.initExpr.kind === 'Literal') {
        initVal = (node.initExpr as LiteralNode).value;
      }
    }

    // Insert into symbol table
    symTable.insert(node.identifier, node.varType, node.line, isInit, initVal);
  }

  function analyzeAssign(node: AssignNode) {
    const lookupRes = symTable.lookup(node.identifier);

    if (!lookupRes) {
      // Check if it exists in an inner or dead scope (Scope violation bonus check)
      const anywhere = symTable.findAnywhere(node.identifier);
      if (anywhere) {
        addError(
          `scope violation — variable '${node.identifier}' declared in inner scope (line ${anywhere.declaredLine}) is not accessible in this scope`,
          node.line,
          node.column
        );
      } else {
        // Undeclared variable
        addError(`variable '${node.identifier}' used before declaration`, node.line, node.column);
      }
      return;
    }

    const exprType = analyzeExpression(node.expr);
    const targetType = lookupRes.entry.dataType;

    // Bonus check: Assignment type mismatches
    if (exprType !== 'error' && !isTypeCompatible(targetType, exprType)) {
      addError(
        `type mismatch — cannot assign '${exprType}' to variable of type '${targetType}'`,
        node.line,
        node.column
      );
    }

    // Mark as initialized
    symTable.markInitialized(
      node.identifier,
      node.expr.kind === 'Literal' ? (node.expr as LiteralNode).value : undefined
    );
  }

  function analyzeIf(node: IfNode) {
    const condType = analyzeExpression(node.condition);
    if (condType !== 'error' && condType !== 'bool') {
      addError(
        `type mismatch — condition expression must be of type 'bool', found '${condType}'`,
        node.condition.line,
        node.condition.column
      );
    }

    if (node.thenBranch.kind === 'Block') {
      analyzeBlock(node.thenBranch as BlockNode, 'If Then');
    } else {
      symTable.enterScope('If Then');
      analyzeStatement(node.thenBranch);
      symTable.exitScope();
    }

    if (node.elseBranch) {
      if (node.elseBranch.kind === 'Block') {
        analyzeBlock(node.elseBranch as BlockNode, 'If Else');
      } else {
        symTable.enterScope('If Else');
        analyzeStatement(node.elseBranch);
        symTable.exitScope();
      }
    }
  }

  function analyzeWhile(node: WhileNode) {
    const condType = analyzeExpression(node.condition);
    if (condType !== 'error' && condType !== 'bool') {
      addError(
        `type mismatch — condition expression must be of type 'bool', found '${condType}'`,
        node.condition.line,
        node.condition.column
      );
    }

    if (node.body.kind === 'Block') {
      analyzeBlock(node.body as BlockNode, 'While Body');
    } else {
      symTable.enterScope('While Body');
      analyzeStatement(node.body);
      symTable.exitScope();
    }
  }

  function analyzeDoWhile(node: DoWhileNode) {
    if (node.body.kind === 'Block') {
      analyzeBlock(node.body as BlockNode, 'Do-While Body');
    } else {
      symTable.enterScope('Do-While Body');
      analyzeStatement(node.body);
      symTable.exitScope();
    }

    const condType = analyzeExpression(node.condition);
    if (condType !== 'error' && condType !== 'bool') {
      addError(
        `type mismatch — condition expression must be of type 'bool', found '${condType}'`,
        node.condition.line,
        node.condition.column
      );
    }
  }

  function analyzePrint(node: PrintNode) {
    analyzeExpression(node.expr);
  }

  function analyzeBlock(node: BlockNode, scopeTitle: string = 'Block') {
    const newScope = symTable.enterScope(scopeTitle);
    node.scopeId = newScope.id;

    for (const stmt of node.statements) {
      analyzeStatement(stmt);
    }

    symTable.exitScope();
  }

  function analyzeExpression(expr: ExpressionNode): DataType {
    switch (expr.kind) {
      case 'Literal': {
        const lit = expr as LiteralNode;
        lit.inferredType = lit.dataType;
        return lit.dataType;
      }

      case 'Variable': {
        const v = expr as VariableNode;
        const lookupRes = symTable.lookup(v.identifier);

        if (!lookupRes) {
          const anywhere = symTable.findAnywhere(v.identifier);
          if (anywhere) {
            addError(
              `scope violation — variable '${v.identifier}' declared in inner scope (line ${anywhere.declaredLine}) is not accessible in this scope`,
              v.line,
              v.column
            );
          } else {
            addError(`variable '${v.identifier}' used before declaration`, v.line, v.column);
          }
          v.inferredType = 'error';
          return 'error';
        }

        // Bonus check: Uninitialized variable use
        if (!lookupRes.entry.initialized) {
          addError(
            `variable '${v.identifier}' used before initialization`,
            v.line,
            v.column
          );
        }

        v.inferredType = lookupRes.entry.dataType;
        return lookupRes.entry.dataType;
      }

      case 'UnaryOp': {
        const u = expr as UnaryOpNode;
        const operandType = analyzeExpression(u.operand);

        if (operandType === 'error') {
          u.inferredType = 'error';
          return 'error';
        }

        if (u.operator === '!') {
          if (operandType !== 'bool') {
            addError(
              `type mismatch — operator '!' requires operand of type 'bool', found '${operandType}'`,
              u.line,
              u.column
            );
            u.inferredType = 'error';
            return 'error';
          }
          u.inferredType = 'bool';
          return 'bool';
        }

        if (u.operator === '-') {
          if (operandType !== 'int' && operandType !== 'float') {
            addError(
              `type mismatch — unary operator '-' requires numeric operand ('int' or 'float'), found '${operandType}'`,
              u.line,
              u.column
            );
            u.inferredType = 'error';
            return 'error';
          }
          u.inferredType = operandType;
          return operandType;
        }

        u.inferredType = 'error';
        return 'error';
      }

      case 'BinaryOp': {
        const b = expr as BinaryOpNode;
        const leftType = analyzeExpression(b.left);
        const rightType = analyzeExpression(b.right);

        if (leftType === 'error' || rightType === 'error') {
          b.inferredType = 'error';
          return 'error';
        }

        const op = b.operator;

        // 1. Arithmetic: +, -, *, /
        if (op === '+' || op === '-' || op === '*' || op === '/') {
          // Special case: string concatenation with +
          if (op === '+' && leftType === 'string' && rightType === 'string') {
            b.inferredType = 'string';
            return 'string';
          }

          const isLeftNumeric = leftType === 'int' || leftType === 'float';
          const isRightNumeric = rightType === 'int' || rightType === 'float';

          if (!isLeftNumeric || !isRightNumeric) {
            addError(
              `type mismatch in expression — operator '${op}' cannot operate on '${leftType}' and '${rightType}'`,
              b.line,
              b.column
            );
            b.inferredType = 'error';
            return 'error';
          }

          const resultType: DataType = leftType === 'float' || rightType === 'float' ? 'float' : 'int';
          b.inferredType = resultType;
          return resultType;
        }

        // 2. Modulo: %
        if (op === '%') {
          if (leftType !== 'int' || rightType !== 'int') {
            addError(
              `type mismatch in expression — modulo operator '%' requires integer operands, found '${leftType}' and '${rightType}'`,
              b.line,
              b.column
            );
            b.inferredType = 'error';
            return 'error';
          }
          b.inferredType = 'int';
          return 'int';
        }

        // 3. Relational: <, <=, >, >=
        if (op === '<' || op === '<=' || op === '>' || op === '>=') {
          const isLeftNumeric = leftType === 'int' || leftType === 'float';
          const isRightNumeric = rightType === 'int' || rightType === 'float';

          if (!isLeftNumeric || !isRightNumeric) {
            addError(
              `type mismatch in expression — relational operator '${op}' requires numeric operands, found '${leftType}' and '${rightType}'`,
              b.line,
              b.column
            );
            b.inferredType = 'error';
            return 'error';
          }
          b.inferredType = 'bool';
          return 'bool';
        }

        // 4. Equality: ==, !=
        if (op === '==' || op === '!=') {
          const bothNumeric = (leftType === 'int' || leftType === 'float') && (rightType === 'int' || rightType === 'float');
          const bothSame = leftType === rightType;

          if (!bothNumeric && !bothSame) {
            addError(
              `type mismatch in expression — equality operator '${op}' cannot compare '${leftType}' with '${rightType}'`,
              b.line,
              b.column
            );
            b.inferredType = 'error';
            return 'error';
          }
          b.inferredType = 'bool';
          return 'bool';
        }

        // 5. Logical: &&, ||
        if (op === '&&' || op === '||') {
          if (leftType !== 'bool' || rightType !== 'bool') {
            addError(
              `type mismatch in expression — logical operator '${op}' requires boolean operands, found '${leftType}' and '${rightType}'`,
              b.line,
              b.column
            );
            b.inferredType = 'error';
            return 'error';
          }
          b.inferredType = 'bool';
          return 'bool';
        }

        b.inferredType = 'error';
        return 'error';
      }
    }
  }

  function isTypeCompatible(target: DataType, source: DataType): boolean {
    if (target === source) return true;
    // Implicit widening: int can be assigned to float
    if (target === 'float' && source === 'int') return true;
    return false;
  }

  analyzeProgram(ast);

  return {
    symbolTableManager: symTable,
    errors,
    warnings,
  };
}
