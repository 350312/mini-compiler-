/**
 * CSE 2210: Compiler Laboratory - Part A: Lexer (Flex Specification Logic)
 */

import { CompilerError, Token, TokenType } from './types';

const KEYWORDS = new Set([
  'int',
  'float',
  'string',
  'bool',
  'if',
  'else',
  'do',
  'while',
  'print',
]);

const BOOLEAN_LITERALS = new Set(['true', 'false']);

export interface LexerResult {
  tokens: Token[];
  errors: CompilerError[];
}

export function tokenize(source: string): LexerResult {
  const tokens: Token[] = [];
  const errors: CompilerError[] = [];

  let i = 0;
  let line = 1;
  let column = 1;
  let tokenIdCounter = 1;

  function addToken(type: TokenType, value: string, tokenLine: number, tokenCol: number, raw?: string) {
    tokens.push({
      id: `tok_${tokenIdCounter++}`,
      type,
      value,
      line: tokenLine,
      column: tokenCol,
      raw: raw ?? value,
    });
  }

  function addError(message: string, errorLine: number, errorCol: number) {
    const formattedText = `Lexical Error at line ${errorLine}: ${message}`;
    errors.push({
      id: `lex_err_${errors.length + 1}`,
      phase: 'lexical',
      line: errorLine,
      column: errorCol,
      message,
      formattedText,
      severity: 'error',
    });
  }

  const len = source.length;

  while (i < len) {
    const char = source[i];

    // Track newlines
    if (char === '\n') {
      line++;
      column = 1;
      i++;
      continue;
    }

    // Skip carriage return and other whitespaces
    if (char === '\r') {
      i++;
      continue;
    }

    if (char === ' ' || char === '\t') {
      column++;
      i++;
      continue;
    }

    // Single-line or block comments
    if (char === '/' && i + 1 < len) {
      const nextChar = source[i + 1];

      // Single line comment: //
      if (nextChar === '/') {
        i += 2;
        column += 2;
        while (i < len && source[i] !== '\n') {
          i++;
          column++;
        }
        continue;
      }

      // Block comment: /* ... */
      if (nextChar === '*') {
        const commentStartLine = line;
        const commentStartCol = column;
        i += 2;
        column += 2;
        let closed = false;

        while (i < len) {
          if (source[i] === '\n') {
            line++;
            column = 1;
            i++;
          } else if (source[i] === '*' && i + 1 < len && source[i + 1] === '/') {
            i += 2;
            column += 2;
            closed = true;
            break;
          } else {
            i++;
            column++;
          }
        }

        if (!closed) {
          addError('unterminated block comment', commentStartLine, commentStartCol);
        }
        continue;
      }
    }

    // String literals: "..."
    if (char === '"') {
      const strStartLine = line;
      const strStartCol = column;
      let strVal = '';
      let rawStr = '"';
      i++;
      column++;
      let terminated = false;

      while (i < len) {
        const c = source[i];
        if (c === '\n' || c === '\r') {
          // Unterminated string literal before newline
          break;
        }

        if (c === '\\') {
          // Escape sequences
          rawStr += c;
          i++;
          column++;
          if (i < len) {
            const escaped = source[i];
            rawStr += escaped;
            if (escaped === 'n') strVal += '\n';
            else if (escaped === 't') strVal += '\t';
            else if (escaped === '"') strVal += '"';
            else if (escaped === '\\') strVal += '\\';
            else strVal += escaped;
            i++;
            column++;
          }
        } else if (c === '"') {
          rawStr += '"';
          i++;
          column++;
          terminated = true;
          break;
        } else {
          rawStr += c;
          strVal += c;
          i++;
          column++;
        }
      }

      if (!terminated) {
        addError('unterminated string literal', strStartLine, strStartCol);
      } else {
        addToken('STRING_LITERAL', strVal, strStartLine, strStartCol, rawStr);
      }
      continue;
    }

    // Numeric literals and mistakes in numeric literals (e.g. 12.3.4, 12abc)
    if (/[0-9]/.test(char)) {
      const numStartLine = line;
      const numStartCol = column;
      let numStr = '';

      while (i < len && /[0-9]/.test(source[i])) {
        numStr += source[i];
        i++;
        column++;
      }

      // Check if followed by dot
      let hasDot = false;
      if (i < len && source[i] === '.') {
        // Look ahead: is it a float or multiple dots?
        hasDot = true;
        numStr += '.';
        i++;
        column++;

        while (i < len && /[0-9]/.test(source[i])) {
          numStr += source[i];
          i++;
          column++;
        }

        // Check for multiple dots like 12.3.4 or 12..5
        if (i < len && source[i] === '.') {
          while (i < len && (source[i] === '.' || /[0-9a-zA-Z_]/.test(source[i]))) {
            numStr += source[i];
            i++;
            column++;
          }
          addError(`mistake in numeric literal '${numStr}' (multiple decimal points)`, numStartLine, numStartCol);
          continue;
        }
      }

      // Check for illegal suffix like 12abc or 3.14px
      if (i < len && /[a-zA-Z_]/.test(source[i])) {
        while (i < len && /[a-zA-Z0-9_.]/.test(source[i])) {
          numStr += source[i];
          i++;
          column++;
        }
        addError(`mistake in numeric literal '${numStr}' (identifier cannot start with a digit)`, numStartLine, numStartCol);
        continue;
      }

      if (hasDot) {
        addToken('FLOAT_LITERAL', numStr, numStartLine, numStartCol);
      } else {
        addToken('INT_LITERAL', numStr, numStartLine, numStartCol);
      }
      continue;
    }

    // Identifiers and Keywords
    if (/[a-zA-Z_]/.test(char)) {
      const idStartLine = line;
      const idStartCol = column;
      let ident = '';

      while (i < len && /[a-zA-Z0-9_]/.test(source[i])) {
        ident += source[i];
        i++;
        column++;
      }

      if (KEYWORDS.has(ident)) {
        addToken('KEYWORD', ident, idStartLine, idStartCol);
      } else if (BOOLEAN_LITERALS.has(ident)) {
        addToken('BOOL_LITERAL', ident, idStartLine, idStartCol);
      } else {
        addToken('IDENTIFIER', ident, idStartLine, idStartCol);
      }
      continue;
    }

    // Two-character operators: ==, !=, <=, >=, &&, ||
    const twoChar = source.slice(i, i + 2);
    if (twoChar === '==' || twoChar === '!=' || twoChar === '<=' || twoChar === '>=' || twoChar === '&&' || twoChar === '||') {
      addToken('OPERATOR', twoChar, line, column);
      i += 2;
      column += 2;
      continue;
    }

    // Single-character operators
    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '%' || char === '<' || char === '>' || char === '!' || char === '=') {
      addToken('OPERATOR', char, line, column);
      i++;
      column++;
      continue;
    }

    // Punctuation: (, ), {, }, ;, ,
    if (char === '(' || char === ')' || char === '{' || char === '}' || char === ';' || char === ',') {
      addToken('PUNCTUATION', char, line, column);
      i++;
      column++;
      continue;
    }

    // Illegal / unrecognized character
    addError(`unrecognized character '${char}'`, line, column);
    i++;
    column++;
  }

  // Add EOF token
  addToken('EOF', '<EOF>', line, column);

  return { tokens, errors };
}
