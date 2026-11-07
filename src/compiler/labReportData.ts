/**
 * CSE 2210: Compiler Laboratory - Lab-07 Project Report Data
 * Covers all required report sections:
 * - Grammar design decisions
 * - Error recovery strategy
 * - Type compatibility rules
 * - Limitations of the project
 * - Team member contributions
 */

export interface TeamMember {
  name: string;
  studentId: string;
  role: string;
  contributions: string;
}

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Sourav Ahmed',
    studentId: '2022-CSE-007',
    role: 'Lead Compiler Architect',
    contributions: 'Flex lexical specification, token stream tracking, Bison grammar architecture, and panic-mode error recovery synchronization.',
  },
  {
    name: 'Sakib Al Hasan Samid',
    studentId: '2022-CSE-018',
    role: 'AST & Grammar Design Specialist',
    contributions: 'Context-free grammar formalization, precedence resolution, Abstract Syntax Tree node modeling, and AST construction actions.',
  },
  {
    name: 'Masum Noman Rad',
    studentId: '2022-CSE-029',
    role: 'Symbol Table & Scoping Engineer',
    contributions: 'Hierarchical symbol table implementation, lexical scope nesting and resolution chain, line tracking, and declaration integrity.',
  },
  {
    name: 'Mahin Hossain',
    studentId: '2022-CSE-045',
    role: 'Semantic Analysis & Test Suite Lead',
    contributions: 'Static type checking, expression validation, bonus checks (assignment type mismatches, scope violations, uninitialized variables), and 14 comprehensive test suites.',
  },
];

export const LAB_REPORT_CONTENT = {
  courseTitle: 'CSE 2210: Compiler Laboratory',
  labTitle: 'Lab-07: Implementation of a Mini-Language Compiler',
  projectOverview: `This project delivers a complete front-end compiler pipeline for a typed imperative mini-language. The compiler pipeline comprises four tightly coupled stages: Lexical Analysis (Flex token specification), Syntax Analysis with Abstract Syntax Tree (AST) construction (Bison/Yacc LALR parser), Scoped Symbol Table tracking with lexical scoping, and Semantic Analysis enforcing static typing, assignment validation, and scope rules. All errors across lexical, syntactical, and semantic phases are reported with unified, uniform diagnostic line numbers.`,

  grammarDecisions: `
### 1. Grammar Design Decisions

#### 1.1 Lexical Specifications & Token Categories
The mini-language defines four primary primitive data types: \`int\`, \`float\`, \`string\`, and \`bool\`. Control flow includes conditional branching (\`if\` / \`else\`) and iteration via both \`while\` and \`do-while\` loops. Standard I/O is supported through the \`print(expr)\` statement.

- **Comments**: Single-line (\`//\`) and multi-line block comments (\`/* ... */\`) are stripped during lexical analysis without polluting the parser token stream. Block comments track embedded newlines to preserve accurate line counting.
- **Literals**: Integer literals (\`[0-9]+\`), float literals (\`[0-9]+\\.[0-9]+\`), string literals (\`"([^"\\\\]|\\\\.)*"\` with escape sequence support), and boolean keywords (\`true\`, \`false\`).
- **Lexical Anomalies**: Malformed floats with multiple decimal points (e.g. \`12.3.4\`) and illegal identifiers starting with numeric digits (e.g. \`12abc\`) are explicitly flagged with line numbers.

#### 1.2 Operator Precedence & Associativity
To prevent ambiguous parse trees and avoid shift/reduce conflicts, standard C operator precedence and associativity rules are established:

| Precedence Level | Operators | Associativity | Description |
| :--- | :--- | :--- | :--- |
| 1 (Lowest) | \`=\` | Right | Assignment |
| 2 | \`\\|\\|\` | Left | Logical OR |
| 3 | \`&&\` | Left | Logical AND |
| 4 | \`==\`, \`!=\` | Left | Equality & Inequality |
| 5 | \`<\`, \`<=\`, \`>\`, \`>=\` | Left | Relational Comparisons |
| 6 | \`+\`, \`-\` | Left | Additive (also string concatenation for \`+\`) |
| 7 | \`*\`, \`/\`, \`%\` | Left | Multiplicative & Modulo |
| 8 (Highest) | \`!\`, unary \`-\` | Right | Logical NOT, Unary Negation |

#### 1.3 Resolving the Dangling-Else Ambiguity
In Bison grammar, the classic dangling-else ambiguity (\`if (e1) if (e2) s1 else s2\`) is resolved using Bison's \`%nonassoc LOWER_THAN_ELSE\` and \`%nonassoc KW_ELSE\` directives, binding the \`else\` clause to the innermost enclosing \`if\` statement.
`,

  errorRecovery: `
### 2. Error Recovery Strategy

#### 2.1 Strategy Selection: Panic-Mode Error Recovery
We implemented **Panic-Mode Error Recovery** as our primary parsing strategy. When a syntax error is encountered:
1. The parser logs the exact diagnostic: \`Syntax Error at line N: expected X but found Y\`.
2. Instead of terminating execution immediately on the first error, the parser activates error recovery mode and skips incoming tokens until a known synchronization anchor is reached.
3. **Synchronization Anchors**: Semicolons (\`;\`), closing curly braces (\`}\`), and statement-starting keywords (\`int\`, \`float\`, \`string\`, \`bool\`, \`if\`, \`while\`, \`do\`, \`print\`, \`{\`).
4. Once an anchor is reached, the parser resumes normal parsing. This allows developers to discover all syntax errors in a single compilation pass rather than fixing one error at a time.

#### 2.2 Rationale & Trade-offs
- **Advantage**: Drastically accelerates turnaround time for developer debugging by highlighting multiple syntax errors across the entire translation unit.
- **Mitigation of Cascading Errors**: The parser suppresses redundant secondary errors during synchronization until it successfully consumes a valid synchronization boundary.
- **Stop-at-First Mode**: We also implemented a configurable toggle allowing users to run in strict "Stop at First Error" mode if desired for batch grading.
`,

  typeMatrix: `
### 3. Type Compatibility Rules Matrix

Semantic analysis checks enforce static type safety across expressions, assignments, and control flow conditions:

| Operation | Left / Operand Type | Right Type | Result Type | Compatibility Rule & Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Arithmetic** \`+\`, \`-\`, \`*\`, \`/\` | \`int\` | \`int\` | \`int\` | Direct integer arithmetic. |
| **Arithmetic** \`+\`, \`-\`, \`*\`, \`/\` | \`float\` | \`float\` | \`float\` | Direct floating-point arithmetic. |
| **Mixed Numeric** | \`int\` / \`float\` | \`float\` / \`int\` | \`float\` | Automatic widening of integer to float. |
| **Concatenation** \`+\` | \`string\` | \`string\` | \`string\` | Binary \`+\` over strings yields concatenated string. |
| **Modulo** \`%\` | \`int\` | \`int\` | \`int\` | Strict constraint: Modulo is invalid on floats, strings, or booleans. |
| **Relational** \`<\`, \`<=\`, \`>\`, \`>=\` | \`int\` / \`float\` | \`int\` / \`float\` | \`bool\` | Numeric comparison resulting in boolean. |
| **Equality** \`==\`, \`!=\` | \`T\` | \`T\` | \`bool\` | Operands must share identical types (or numeric pair). |
| **Logical** \`&&\`, \`\\|\\|\` | \`bool\` | \`bool\` | \`bool\` | Both operands must strictly be boolean. |
| **Unary** \`!\` | \`bool\` | — | \`bool\` | Requires boolean operand. |
| **Unary** \`-\` | \`int\` / \`float\` | — | \`int\` / \`float\` | Requires numeric operand. |
| **Assignment** \`=\` | Target Type | Value Type | Target Type | Value must match target type. Widening allows \`float = int\`. Assigning \`string\` to \`int\` triggers bonus semantic error. |
| **Branch Conditions** | \`bool\` | — | — | Conditions in \`if\`, \`while\`, and \`do-while\` must strictly evaluate to \`bool\`. |
`,

  symbolTableDesign: `
### 4. Scoped Symbol Table Architecture

The symbol table is structured as an explicit hierarchical scope tree:
- **Global Scope (Scope 0)**: Hosts top-level variable declarations.
- **Nested Block Scopes**: Each compound block (\`{ ... }\`), loop body, or conditional branch spawns a child scope referencing its parent.
- **Symbol Records**: Store Identifier Name, Data Type, Scope Level, Line Number of Declaration, and Initialization Status (true/false).
- **Lookup Protocol**: Lookup starts at the current innermost scope and traverses parent pointers outward. An identifier not found in any enclosing scope triggers an "Undeclared variable" semantic error.
- **Bonus Scope Violation Detection**: If an identifier is found in an inner block that has already exited, the compiler flags a dedicated "Scope violation" error explaining that the variable was declared in an inner scope and is no longer accessible.
- **Uninitialized Variable Warning/Error**: Variables accessed before having a concrete value assigned trigger an uninitialized variable diagnostic.
`,

  limitations: `
### 5. Project Limitations & Future Work

While the compiler front-end completely satisfies all requirements of Lab-07, several production compiler features remain for future milestones:
1. **User-Defined Functions**: The language presently supports procedural sequential code, blocks, and control loops, but does not yet feature function prototypes, parameters, or return statements.
2. **Array and Pointer Types**: Arrays (\`int arr[10]\`), indexing (\`arr[i]\`), and pointer dereferencing are planned for Lab-08.
3. **Three-Address Code (TAC) Generation**: Intermediate representation (IR) code generation (quadruples/triples) for expression flattening and jump labels will be implemented in the back-end lab.
4. **Target Machine Code Synthesis**: Assembly synthesis (MIPS/x86-64) or LLVM bitcode emission.
`,
};
