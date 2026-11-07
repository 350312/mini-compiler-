/**
 * CSE 2210: Compiler Laboratory - Lab-07
 * Full Flex (.l) & Bison (.y) C Implementation Package
 */

export interface SourceArtifact {
  filename: string;
  description: string;
  language: string;
  content: string;
}

export const FLEX_BISON_PACKAGE: SourceArtifact[] = [
  {
    filename: 'lexer.l',
    description: 'Flex Token Specification with line-tracking and error detection',
    language: 'c',
    content: `%{
/*
 * CSE 2210: Compiler Laboratory - Lab-07
 * Part A: Lexical Analyzer (Flex Specification)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"
#include "parser.tab.h"

extern int yylineno;
int lexical_error_count = 0;

void report_lex_error(int line, const char* msg) {
    lexical_error_count++;
    fprintf(stderr, "Lexical Error at line %d: %s\\n", line, msg);
}
%}

%option noyywrap
%option yylineno

DIGIT       [0-9]
LETTER      [a-zA-Z_]
ID          {LETTER}({LETTER}|{DIGIT})*
INT_LIT     {DIGIT}+
FLOAT_LIT   {DIGIT}+\\.{DIGIT}+
MALFORMED_NUM {DIGIT}+\\.{DIGIT}+\\.{DIGIT}+|{DIGIT}+{LETTER}+

%x STRING_STATE
%x BLOCK_COMMENT

%%

[ \\t\\r]+              { /* Skip whitespace */ }
\\n                     { /* yylineno is handled automatically by %option yylineno */ }

"//".*                  { /* Skip single-line comments */ }

"/*"                    { BEGIN(BLOCK_COMMENT); }
<BLOCK_COMMENT>"*/"     { BEGIN(INITIAL); }
<BLOCK_COMMENT>\\n      { /* track lines in comment */ }
<BLOCK_COMMENT>.        { /* skip comment content */ }
<BLOCK_COMMENT><<EOF>>  {
    report_lex_error(yylineno, "unterminated block comment");
    BEGIN(INITIAL);
}

"int"                   { return KW_INT; }
"float"                 { return KW_FLOAT; }
"string"                { return KW_STRING; }
"bool"                  { return KW_BOOL; }
"if"                    { return KW_IF; }
"else"                  { return KW_ELSE; }
"do"                    { return KW_DO; }
"while"                 { return KW_WHILE; }
"print"                 { return KW_PRINT; }

"true"                  { yylval.bool_val = 1; return BOOL_LIT; }
"false"                 { yylval.bool_val = 0; return BOOL_LIT; }

{MALFORMED_NUM} {
    char err_buf[256];
    snprintf(err_buf, sizeof(err_buf), "mistake in numeric literal '%s'", yytext);
    report_lex_error(yylineno, err_buf);
}

{INT_LIT} {
    yylval.int_val = atoi(yytext);
    return INT_LIT;
}

{FLOAT_LIT} {
    yylval.float_val = atof(yytext);
    return FLOAT_LIT;
}

{ID} {
    yylval.str_val = strdup(yytext);
    return IDENTIFIER;
}

\\\" {
    /* String literal scanning */
    char buffer[1024];
    int buf_idx = 0;
    int c;
    int start_line = yylineno;

    while ((c = input()) != '\"' && c != EOF && c != '\\n') {
        if (c == '\\\\') {
            int next = input();
            if (next == 'n') buffer[buf_idx++] = '\\n';
            else if (next == 't') buffer[buf_idx++] = '\\t';
            else if (next == '\"') buffer[buf_idx++] = '\"';
            else if (next == '\\\\') buffer[buf_idx++] = '\\\\';
            else buffer[buf_idx++] = (char)next;
        } else {
            buffer[buf_idx++] = (char)c;
        }
        if (buf_idx >= 1023) break;
    }

    if (c != '\"') {
        report_lex_error(start_line, "unterminated string literal");
    } else {
        buffer[buf_idx] = '\\0';
        yylval.str_val = strdup(buffer);
        return STRING_LIT;
    }
}

"+"                     { return OP_PLUS; }
"-"                     { return OP_MINUS; }
"*"                     { return OP_MUL; }
"/"                     { return OP_DIV; }
"%"                     { return OP_MOD; }

"=="                    { return OP_EQ; }
"!="                    { return OP_NE; }
"<="                    { return OP_LE; }
">="                    { return OP_GE; }
"<"                     { return OP_LT; }
">"                     { return OP_GT; }

"&&"                    { return OP_AND; }
"||"                    { return OP_OR; }
"!"                     { return OP_NOT; }
"="                     { return OP_ASSIGN; }

";"                     { return SEMI; }
","                     { return COMMA; }
"("                     { return LPAREN; }
")"                     { return RPAREN; }
"{"                     { return LBRACE; }
"}"                     { return RBRACE; }

. {
    char err_buf[128];
    snprintf(err_buf, sizeof(err_buf), "unrecognized character '%s'", yytext);
    report_lex_error(yylineno, err_buf);
}

%%
`,
  },
  {
    filename: 'parser.y',
    description: 'Bison/Yacc Grammar Specification with AST construction and error recovery',
    language: 'c',
    content: `%{
/*
 * CSE 2210: Compiler Laboratory - Lab-07
 * Part B: Parser + AST Construction (Bison Specification)
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"
#include "symbol_table.h"
#include "semantic.h"

extern int yylex();
extern int yylineno;
extern FILE* yyin;

ASTNode* root_ast = NULL;
int syntax_error_count = 0;

void yyerror(const char* s) {
    syntax_error_count++;
    fprintf(stderr, "Syntax Error at line %d: %s\\n", yylineno, s);
}
%}

%define parse.error verbose

%union {
    int int_val;
    float float_val;
    int bool_val;
    char* str_val;
    ASTNode* node;
    DataType data_type;
}

/* Tokens */
%token KW_INT KW_FLOAT KW_STRING KW_BOOL
%token KW_IF KW_ELSE KW_DO KW_WHILE KW_PRINT
%token <int_val> INT_LIT
%token <float_val> FLOAT_LIT
%token <bool_val> BOOL_LIT
%token <str_val> STRING_LIT IDENTIFIER

%token OP_PLUS OP_MINUS OP_MUL OP_DIV OP_MOD
%token OP_EQ OP_NE OP_LT OP_LE OP_GT OP_GE
%token OP_AND OP_OR OP_NOT OP_ASSIGN
%token SEMI COMMA LPAREN RPAREN LBRACE RBRACE

/* Precedence and Associativity */
%left OP_OR
%left OP_AND
%left OP_EQ OP_NE
%left OP_LT OP_LE OP_GT OP_GE
%left OP_PLUS OP_MINUS
%left OP_MUL OP_DIV OP_MOD
%right OP_NOT UMINUS
%nonassoc LOWER_THAN_ELSE
%nonassoc KW_ELSE

/* Non-terminal types */
%type <node> program statement_list statement var_decl assignment if_stmt while_stmt do_while_stmt print_stmt block expr
%type <data_type> type

%%

program:
    statement_list {
        root_ast = $1;
        $$ = $1;
    }
    ;

statement_list:
    statement_list statement {
        $$ = append_statement($1, $2);
    }
    | /* empty */ {
        $$ = create_program_node(yylineno);
    }
    ;

statement:
    var_decl            { $$ = $1; }
    | assignment        { $$ = $1; }
    | if_stmt           { $$ = $1; }
    | while_stmt        { $$ = $1; }
    | do_while_stmt     { $$ = $1; }
    | print_stmt        { $$ = $1; }
    | block             { $$ = $1; }
    | error SEMI {
        /* Panic-mode synchronization at semicolon */
        yyerrok;
        $$ = NULL;
    }
    ;

type:
    KW_INT      { $$ = TYPE_INT; }
    | KW_FLOAT  { $$ = TYPE_FLOAT; }
    | KW_STRING { $$ = TYPE_STRING; }
    | KW_BOOL   { $$ = TYPE_BOOL; }
    ;

var_decl:
    type IDENTIFIER SEMI {
        $$ = create_decl_node($1, $2, NULL, yylineno);
    }
    | type IDENTIFIER OP_ASSIGN expr SEMI {
        $$ = create_decl_node($1, $2, $4, yylineno);
    }
    ;

assignment:
    IDENTIFIER OP_ASSIGN expr SEMI {
        $$ = create_assign_node($1, $3, yylineno);
    }
    ;

if_stmt:
    KW_IF LPAREN expr RPAREN statement %prec LOWER_THAN_ELSE {
        $$ = create_if_node($3, $5, NULL, yylineno);
    }
    | KW_IF LPAREN expr RPAREN statement KW_ELSE statement {
        $$ = create_if_node($3, $5, $7, yylineno);
    }
    ;

while_stmt:
    KW_WHILE LPAREN expr RPAREN statement {
        $$ = create_while_node($3, $5, 0, yylineno);
    }
    ;

do_while_stmt:
    KW_DO statement KW_WHILE LPAREN expr RPAREN SEMI {
        $$ = create_while_node($5, $2, 1, yylineno);
    }
    ;

print_stmt:
    KW_PRINT LPAREN expr RPAREN SEMI {
        $$ = create_print_node($3, yylineno);
    }
    ;

block:
    LBRACE statement_list RBRACE {
        $$ = create_block_node($2, yylineno);
    }
    ;

expr:
    expr OP_PLUS expr   { $$ = create_binop_node("+", $1, $3, yylineno); }
    | expr OP_MINUS expr  { $$ = create_binop_node("-", $1, $3, yylineno); }
    | expr OP_MUL expr    { $$ = create_binop_node("*", $1, $3, yylineno); }
    | expr OP_DIV expr    { $$ = create_binop_node("/", $1, $3, yylineno); }
    | expr OP_MOD expr    { $$ = create_binop_node("%", $1, $3, yylineno); }
    | expr OP_EQ expr     { $$ = create_binop_node("==", $1, $3, yylineno); }
    | expr OP_NE expr     { $$ = create_binop_node("!=", $1, $3, yylineno); }
    | expr OP_LT expr     { $$ = create_binop_node("<", $1, $3, yylineno); }
    | expr OP_LE expr     { $$ = create_binop_node("<=", $1, $3, yylineno); }
    | expr OP_GT expr     { $$ = create_binop_node(">", $1, $3, yylineno); }
    | expr OP_GE expr     { $$ = create_binop_node(">=", $1, $3, yylineno); }
    | expr OP_AND expr    { $$ = create_binop_node("&&", $1, $3, yylineno); }
    | expr OP_OR expr     { $$ = create_binop_node("||", $1, $3, yylineno); }
    | OP_NOT expr         { $$ = create_unaryop_node("!", $2, yylineno); }
    | OP_MINUS expr %prec UMINUS { $$ = create_unaryop_node("-", $2, yylineno); }
    | LPAREN expr RPAREN  { $$ = $2; }
    | INT_LIT             { $$ = create_int_literal_node($1, yylineno); }
    | FLOAT_LIT           { $$ = create_float_literal_node($1, yylineno); }
    | BOOL_LIT            { $$ = create_bool_literal_node($1, yylineno); }
    | STRING_LIT          { $$ = create_string_literal_node($1, yylineno); }
    | IDENTIFIER          { $$ = create_var_node($1, yylineno); }
    ;

%%
`,
  },
  {
    filename: 'ast.h',
    description: 'C Header defining Abstract Syntax Tree node types and constructors',
    language: 'c',
    content: `#ifndef AST_H
#define AST_H

typedef enum {
    TYPE_INT,
    TYPE_FLOAT,
    TYPE_STRING,
    TYPE_BOOL,
    TYPE_VOID,
    TYPE_UNKNOWN
} DataType;

typedef enum {
    NODE_PROGRAM,
    NODE_DECL,
    NODE_ASSIGN,
    NODE_IF,
    NODE_WHILE,
    NODE_PRINT,
    NODE_BLOCK,
    NODE_BINOP,
    NODE_UNARYOP,
    NODE_LITERAL,
    NODE_VARIABLE
} ASTNodeType;

typedef struct ASTNode {
    ASTNodeType type;
    int line;
    DataType inferred_type;
    union {
        struct {
            struct ASTNode** stmts;
            int count;
            int capacity;
        } program;
        struct {
            DataType var_type;
            char* name;
            struct ASTNode* init_expr;
        } decl;
        struct {
            char* name;
            struct ASTNode* expr;
        } assign;
        struct {
            struct ASTNode* condition;
            struct ASTNode* then_branch;
            struct ASTNode* else_branch;
        } if_stmt;
        struct {
            struct ASTNode* condition;
            struct ASTNode* body;
            int is_do_while;
        } while_stmt;
        struct {
            struct ASTNode* expr;
        } print_stmt;
        struct {
            struct ASTNode* body;
        } block;
        struct {
            char* op;
            struct ASTNode* left;
            struct ASTNode* right;
        } binop;
        struct {
            char* op;
            struct ASTNode* operand;
        } unaryop;
        struct {
            DataType lit_type;
            union {
                int int_val;
                float float_val;
                int bool_val;
                char* str_val;
            } val;
        } literal;
        struct {
            char* name;
        } variable;
    } data;
} ASTNode;

ASTNode* create_program_node(int line);
ASTNode* append_statement(ASTNode* prog, ASTNode* stmt);
ASTNode* create_decl_node(DataType type, char* name, ASTNode* init, int line);
ASTNode* create_assign_node(char* name, ASTNode* expr, int line);
ASTNode* create_if_node(ASTNode* cond, ASTNode* then_b, ASTNode* else_b, int line);
ASTNode* create_while_node(ASTNode* cond, ASTNode* body, int is_do_while, int line);
ASTNode* create_print_node(ASTNode* expr, int line);
ASTNode* create_block_node(ASTNode* body, int line);
ASTNode* create_binop_node(const char* op, ASTNode* left, ASTNode* right, int line);
ASTNode* create_unaryop_node(const char* op, ASTNode* operand, int line);
ASTNode* create_int_literal_node(int val, int line);
ASTNode* create_float_literal_node(float val, int line);
ASTNode* create_bool_literal_node(int val, int line);
ASTNode* create_string_literal_node(char* val, int line);
ASTNode* create_var_node(char* name, int line);

void print_ast(ASTNode* node, int indent);

#endif
`,
  },
  {
    filename: 'symbol_table.h',
    description: 'Scoped Symbol Table with hierarchy and state tracking',
    language: 'c',
    content: `#ifndef SYMBOL_TABLE_H
#define SYMBOL_TABLE_H

#include "ast.h"

typedef struct SymbolEntry {
    char* name;
    DataType data_type;
    int scope_level;
    int declared_line;
    int initialized;
    struct SymbolEntry* next;
} SymbolEntry;

typedef struct Scope {
    int level;
    char* name;
    SymbolEntry* entries;
    struct Scope* parent;
} Scope;

Scope* create_scope(const char* name, int level, Scope* parent);
void enter_scope(const char* name);
void exit_scope();
int insert_symbol(const char* name, DataType type, int line, int initialized);
SymbolEntry* lookup_current_scope(const char* name);
SymbolEntry* lookup_all_scopes(const char* name);
int mark_symbol_initialized(const char* name);
void print_symbol_table();

#endif
`,
  },
  {
    filename: 'semantic.h',
    description: 'Semantic Analysis checks, type verification, and error formatting',
    language: 'c',
    content: `#ifndef SEMANTIC_H
#define SEMANTIC_H

#include "ast.h"

int run_semantic_analysis(ASTNode* root);
const char* type_to_string(DataType type);

#endif
`,
  },
  {
    filename: 'main.c',
    description: 'Compiler Driver pipeline execution and error tally',
    language: 'c',
    content: `/*
 * CSE 2210: Compiler Laboratory - Main Driver
 */
#include <stdio.h>
#include <stdlib.h>
#include "ast.h"
#include "symbol_table.h"
#include "semantic.h"

extern FILE* yyin;
extern int yyparse();
extern ASTNode* root_ast;
extern int lexical_error_count;
extern int syntax_error_count;

int main(int argc, char** argv) {
    if (argc > 1) {
        FILE* file = fopen(argv[1], "r");
        if (!file) {
            fprintf(stderr, "Error: Could not open file %s\\n", argv[1]);
            return 1;
        }
        yyin = file;
    }

    printf("=== CSE 2210 Compiler Front-End Execution ===\\n");
    yyparse();

    if (lexical_error_count > 0 || syntax_error_count > 0) {
        fprintf(stderr, "\\nCompilation halted with %d lexical and %d syntax errors.\\n",
                lexical_error_count, syntax_error_count);
        return 1;
    }

    printf("Lexical and Syntax Analysis passed successfully!\\n");
    printf("Building Symbol Table and running Semantic Analysis...\\n");

    int sem_errors = run_semantic_analysis(root_ast);
    if (sem_errors > 0) {
        fprintf(stderr, "\\nCompilation failed with %d semantic errors.\\n", sem_errors);
        return 1;
    }

    printf("Semantic Analysis passed with 0 errors!\\n");
    print_symbol_table();

    return 0;
}
`,
  },
  {
    filename: 'Makefile',
    description: 'Build automation compiling Lexer, Parser, AST, and Semantic checks',
    language: 'makefile',
    content: `CC = gcc
CFLAGS = -Wall -Wextra -g

all: compiler

parser.tab.c parser.tab.h: parser.y
\tbison -d -v parser.y

lex.yy.c: lexer.l parser.tab.h
\tflex lexer.l

compiler: lex.yy.c parser.tab.c ast.c symbol_table.c semantic.c main.c
\t$(CC) $(CFLAGS) -o compiler lex.yy.c parser.tab.c ast.c symbol_table.c semantic.c main.c

clean:
\trm -f compiler lex.yy.c parser.tab.c parser.tab.h parser.output *.o
`,
  },
];
