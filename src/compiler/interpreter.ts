/**
 * CSE 2210: Mini-Language Runtime Interpreter
 * Executes semantically verified AST and captures print outputs.
 */

import {
  AssignNode,
  BinaryOpNode,
  BlockNode,
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

interface Environment {
  parent: Environment | null;
  bindings: Map<string, any>;
}

export interface ExecutionResult {
  output: string[];
  executionError?: string;
  stepsCount: number;
}

export function executeProgram(ast: ProgramNode): ExecutionResult {
  const output: string[] = [];
  let stepsCount = 0;
  const MAX_STEPS = 50000;

  function createEnv(parent: Environment | null = null): Environment {
    return {
      parent,
      bindings: new Map(),
    };
  }

  function getVar(env: Environment, name: string): any {
    let curr: Environment | null = env;
    while (curr) {
      if (curr.bindings.has(name)) {
        return curr.bindings.get(name);
      }
      curr = curr.parent;
    }
    throw new Error(`Runtime error: variable '${name}' not found.`);
  }

  function setVar(env: Environment, name: string, value: any) {
    let curr: Environment | null = env;
    while (curr) {
      if (curr.bindings.has(name)) {
        curr.bindings.set(name, value);
        return;
      }
      curr = curr.parent;
    }
    // If not found anywhere, define in current env
    env.bindings.set(name, value);
  }

  function executeBlock(block: BlockNode, parentEnv: Environment) {
    const blockEnv = createEnv(parentEnv);
    for (const stmt of block.statements) {
      executeStatement(stmt, blockEnv);
    }
  }

  function executeStatement(stmt: StatementNode, env: Environment) {
    stepsCount++;
    if (stepsCount > MAX_STEPS) {
      throw new Error(`Infinite loop detected! Exceeded maximum step limit (${MAX_STEPS} steps).`);
    }

    switch (stmt.kind) {
      case 'VarDecl': {
        const decl = stmt as VarDeclNode;
        let val: any = undefined;
        if (decl.initExpr) {
          val = evaluateExpression(decl.initExpr, env);
        } else {
          // Defaults
          if (decl.varType === 'int') val = 0;
          else if (decl.varType === 'float') val = 0.0;
          else if (decl.varType === 'string') val = '';
          else if (decl.varType === 'bool') val = false;
        }
        env.bindings.set(decl.identifier, val);
        break;
      }

      case 'Assign': {
        const assign = stmt as AssignNode;
        const val = evaluateExpression(assign.expr, env);
        setVar(env, assign.identifier, val);
        break;
      }

      case 'If': {
        const ifNode = stmt as IfNode;
        const condVal = evaluateExpression(ifNode.condition, env);
        if (Boolean(condVal)) {
          executeStatement(ifNode.thenBranch, env);
        } else if (ifNode.elseBranch) {
          executeStatement(ifNode.elseBranch, env);
        }
        break;
      }

      case 'While': {
        const whileNode = stmt as WhileNode;
        while (Boolean(evaluateExpression(whileNode.condition, env))) {
          executeStatement(whileNode.body, env);
          stepsCount++;
          if (stepsCount > MAX_STEPS) {
            throw new Error(`Infinite loop detected in 'while' loop! Exceeded ${MAX_STEPS} steps.`);
          }
        }
        break;
      }

      case 'DoWhile': {
        const doWhileNode = stmt as DoWhileNode;
        do {
          executeStatement(doWhileNode.body, env);
          stepsCount++;
          if (stepsCount > MAX_STEPS) {
            throw new Error(`Infinite loop detected in 'do-while' loop! Exceeded ${MAX_STEPS} steps.`);
          }
        } while (Boolean(evaluateExpression(doWhileNode.condition, env)));
        break;
      }

      case 'Print': {
        const printNode = stmt as PrintNode;
        const val = evaluateExpression(printNode.expr, env);
        output.push(String(val));
        break;
      }

      case 'Block': {
        executeBlock(stmt as BlockNode, env);
        break;
      }
    }
  }

  function evaluateExpression(expr: ExpressionNode, env: Environment): any {
    switch (expr.kind) {
      case 'Literal': {
        return (expr as LiteralNode).value;
      }

      case 'Variable': {
        return getVar(env, (expr as VariableNode).identifier);
      }

      case 'UnaryOp': {
        const u = expr as UnaryOpNode;
        const operand = evaluateExpression(u.operand, env);
        if (u.operator === '!') return !operand;
        if (u.operator === '-') return -operand;
        return operand;
      }

      case 'BinaryOp': {
        const b = expr as BinaryOpNode;
        const left = evaluateExpression(b.left, env);
        const right = evaluateExpression(b.right, env);

        switch (b.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            if (right === 0) throw new Error(`Division by zero at line ${b.line}`);
            return left / right;
          case '%':
            if (right === 0) throw new Error(`Modulo by zero at line ${b.line}`);
            return left % right;
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '<':
            return left < right;
          case '<=':
            return left <= right;
          case '>':
            return left > right;
          case '>=':
            return left >= right;
          case '&&':
            return Boolean(left) && Boolean(right);
          case '||':
            return Boolean(left) || Boolean(right);
        }
      }
    }
  }

  const globalEnv = createEnv();
  try {
    for (const stmt of ast.statements) {
      executeStatement(stmt, globalEnv);
    }
    return { output, stepsCount };
  } catch (err: any) {
    return {
      output,
      executionError: err.message || 'Execution error occurred',
      stepsCount,
    };
  }
}
