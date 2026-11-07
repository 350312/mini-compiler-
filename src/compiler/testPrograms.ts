/**
 * CSE 2210: Test Suite Programs matching Lab-07 Submission Checklist
 * Contains >= 10 categorized test programs (Valid, Lexical Errors, Syntax Errors, Semantic Errors)
 */

import { TestProgram } from './types';

export const TEST_PROGRAMS: TestProgram[] = [
  {
    id: 'test_1_valid_full',
    title: '1. Valid Full Mini Program',
    category: 'valid',
    categoryLabel: 'Valid Program',
    description: 'Demonstrates declarations, arithmetic, if-else branch, do-while loop, nested block scopes, and print output.',
    expectedBehavior: 'Compiles cleanly with 0 errors, constructs full AST, builds scoped symbol table, and executes correctly.',
    code: `// CSE 2210 Lab-07: Full Valid Mini Program
int count = 5;
int sum = 0;
float pi = 3.14159;
string message = "Compiler Lab CSE 2210";
bool active = true;

print(message);

/* Calculate sum from 1 to 5 using do-while */
int i = 1;
do {
  sum = sum + i;
  i = i + 1;
} while (i <= count);

print("Accumulated sum:");
print(sum);

// Control flow with nested block scope
if (sum > 10 && active) {
  int bonus = 100;
  sum = sum + bonus;
  print("Sum after bonus applied in block:");
  print(sum);
} else {
  print("No bonus applied");
}

print("Execution complete!");
`,
  },
  {
    id: 'test_2_valid_math',
    title: '2. Valid Math, Modulo & Logic',
    category: 'valid',
    categoryLabel: 'Valid Program',
    description: 'Validates float division, modulo operator %, relational comparisons, boolean algebra, and precedence.',
    expectedBehavior: 'Compiles cleanly. Validates operator precedence and type widening from int to float.',
    code: `// Test mathematical operators, modulo, and boolean logic
int a = 25;
int b = 7;
int remainder = a % b;

float radius = 4.5;
float area = 3.1416 * radius * radius;

bool check1 = (a > b) && (remainder == 4);
bool check2 = !(a < b) || (b == 0);

print("Remainder of 25 % 7:");
print(remainder);

print("Area of circle:");
print(area);

if (check1 && check2) {
  print("Logical tests all passed successfully!");
}
`,
  },
  {
    id: 'test_3_lex_illegal_char',
    title: '3. Lexical Error: Illegal Characters',
    category: 'lexical_error',
    categoryLabel: 'Lexical Error',
    description: 'Introduces unrecognized characters (@, #, $, ~) into the token stream.',
    expectedBehavior: 'Reports Lexical Error at corresponding lines: unrecognized character.',
    code: `// Deliberate Lexical Error: Illegal/unrecognized characters
int score = 95;
float rate = 3.5;

// Illegal symbol '@'
int @invalidSymbol = 10;

// Illegal symbol '#' and '$'
float total# = 50.0;
string price = "$100"; // String literal is fine
string bad = ~tilde;   // '~' is unrecognized

print(score);
`,
  },
  {
    id: 'test_4_lex_malformed_number',
    title: '4. Lexical Error: Malformed Numbers',
    category: 'lexical_error',
    categoryLabel: 'Lexical Error',
    description: 'Introduces numeric literals with multiple decimal points (12.3.4) and digits immediately followed by letters (12abc).',
    expectedBehavior: 'Reports Lexical Error: mistake in numeric literal (multiple decimal points / identifier cannot start with digit).',
    code: `// Deliberate Lexical Error: Mistake in numeric literals
int validInt = 42;
float validFloat = 3.14159;

// Mistake: multiple decimal points
float invalidNumber = 12.3.4;

// Mistake: identifier starting with digit
int 12abc = 99;

print(validInt);
`,
  },
  {
    id: 'test_5_lex_unterminated_str',
    title: '5. Lexical Error: Unterminated String',
    category: 'lexical_error',
    categoryLabel: 'Lexical Error',
    description: 'Contains a string literal without a closing quotation mark before the newline.',
    expectedBehavior: 'Reports: Lexical Error at line 4: unterminated string literal (exact matching assignment example).',
    code: `// Deliberate Lexical Error: Unterminated string literal
int code = 100;
string validStr = "This string is closed correctly";
string broken = "unterminated string literal

int nextVar = 200;
print(code);
`,
  },
  {
    id: 'test_6_syn_missing_semi',
    title: '6. Syntax Error: Missing Semicolon',
    category: 'syntax_error',
    categoryLabel: 'Syntax Error',
    description: 'Missing semicolon after variable declaration, directly preceding next statement.',
    expectedBehavior: "Reports: Syntax Error at line 7: expected ';' but found 'if' (as given in lab prompt).",
    code: `// Deliberate Syntax Error: Missing semicolon before keyword
int score = 85;
float ratio = 1.5;
bool status = true

if (score > 50) {
  print("Passed");
}
`,
  },
  {
    id: 'test_7_syn_unmatched_braces',
    title: '7. Syntax Error: Unmatched Braces & Parens',
    category: 'syntax_error',
    categoryLabel: 'Syntax Error',
    description: 'Malformed control flow expression with missing closing parenthesis and unclosed block brace.',
    expectedBehavior: "Reports: Syntax Error at line 5: expected ')' after expression.",
    code: `// Deliberate Syntax Error: Malformed if condition and unclosed brace
int x = 10;
int y = 20;

if (x < y {
  print("x is smaller");
}
`,
  },
  {
    id: 'test_8_syn_malformed_expr',
    title: '8. Syntax Error: Malformed Expression',
    category: 'syntax_error',
    categoryLabel: 'Syntax Error',
    description: 'Incomplete binary expression where right-hand operand is omitted.',
    expectedBehavior: "Reports: Syntax Error: expected expression but found ';'.",
    code: `// Deliberate Syntax Error: Malformed expression
int a = 10;
int b = 20;

// Missing operand after '+'
int c = a + ;

print(c);
`,
  },
  {
    id: 'test_9_sem_undeclared',
    title: '9. Semantic Error: Undeclared Variable',
    category: 'semantic_error',
    categoryLabel: 'Semantic Error',
    description: 'Using identifier before declaration or accessing variable that was never declared.',
    expectedBehavior: "Reports: Semantic Error at line 10: variable 'x' used before declaration (assignment example).",
    code: `// Deliberate Semantic Error: Variable used before declaration
int a = 10;
int b = 20;
int total = a + b;

print(total);

// Variable 'x' has not been declared anywhere
x = total * 2;

print(x);
`,
  },
  {
    id: 'test_10_sem_duplicate_decl',
    title: '10. Semantic Error: Duplicate Declaration',
    category: 'semantic_error',
    categoryLabel: 'Semantic Error',
    description: 'Declaring the same variable identifier twice in the same scope level.',
    expectedBehavior: "Reports: Semantic Error: duplicate declaration of identifier 'counter' in the same scope.",
    code: `// Deliberate Semantic Error: Duplicate declaration in same scope
int counter = 0;
string title = "Execution Trace";

// Redeclaration of 'counter' in the same global scope
float counter = 3.14;

print(counter);
`,
  },
  {
    id: 'test_11_sem_type_mismatch_assign',
    title: '11. Semantic Error: Assign Type Mismatch',
    category: 'semantic_error',
    categoryLabel: 'Semantic Error',
    description: 'Assigning a string literal to a variable declared as integer.',
    expectedBehavior: "Reports: Semantic Error at line 6: type mismatch — cannot assign 'string' to variable of type 'int'.",
    code: `// Deliberate Semantic Error: Assignment type mismatch
int age = 22;
string name = "Alice";

// Attempting to assign string to int variable
age = "twenty two";

print(age);
`,
  },
  {
    id: 'test_12_sem_expr_type_mismatch',
    title: '12. Semantic Error: Expression Type Mismatch',
    category: 'semantic_error',
    categoryLabel: 'Semantic Error',
    description: 'Invalid binary operation combining int and bool in arithmetic, plus non-bool if condition.',
    expectedBehavior: "Reports: Semantic Error: operator '+' cannot operate on 'int' and 'bool', and condition must be of type 'bool'.",
    code: `// Deliberate Semantic Error: Expression type mismatch
int x = 10;
bool flag = true;

// Cannot add int and bool
int result = x + flag;

// Condition must evaluate to bool, found int
if (x) {
  print("Invalid condition");
}
`,
  },
  {
    id: 'test_13_sem_scope_violation',
    title: '13. Semantic Error: Scope Violation',
    category: 'semantic_error',
    categoryLabel: 'Semantic Error',
    description: 'Accessing variable declared inside an inner block after the block has closed (Bonus check).',
    expectedBehavior: "Reports: Semantic Error: scope violation — variable 'tempSecret' declared in inner scope is not accessible in this scope.",
    code: `// Deliberate Semantic Error (Bonus): Scope violation
int globalVal = 100;

if (globalVal > 50) {
  int tempSecret = 42;
  print("Inside inner block:");
  print(tempSecret);
}

// tempSecret was declared inside the if-block scope and cannot be accessed here!
print("Trying to access out-of-scope variable:");
globalVal = globalVal + tempSecret;
`,
  },
  {
    id: 'test_14_sem_uninitialized',
    title: '14. Semantic Error: Uninitialized Variable',
    category: 'semantic_error',
    categoryLabel: 'Semantic Error',
    description: 'Using an uninitialized variable in an expression prior to assigning any value (Bonus check).',
    expectedBehavior: "Reports: Semantic Error: variable 'uninitializedSum' used before initialization.",
    code: `// Deliberate Semantic Error (Bonus): Uninitialized variable usage
int x = 10;
int uninitializedSum;

// Using uninitializedSum before assigning a value to it
int finalScore = x + uninitializedSum;

print(finalScore);
`,
  },
];
