#!/usr/bin/env python3
import ast
import operator

from mcp.server.fastmcp import FastMCP


ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def eval_expr(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.BinOp) and type(node.op) in ALLOWED_OPERATORS:
        left = eval_expr(node.left)
        right = eval_expr(node.right)
        return ALLOWED_OPERATORS[type(node.op)](left, right)
    if isinstance(node, ast.UnaryOp) and type(node.op) in ALLOWED_OPERATORS:
        operand = eval_expr(node.operand)
        return ALLOWED_OPERATORS[type(node.op)](operand)
    raise ValueError(f"Unsupported expression: {ast.dump(node)}")


def extract_expression(query: str) -> str:
    cleaned = "".join(
        ch for ch in query if ch.isdigit() or ch in "+-*/()^ ."
    ).strip()
    if not cleaned:
        raise ValueError("No arithmetic expression found in the input.")
    return cleaned.replace("^", "**")


server = FastMCP("math-server")


@server.tool(name="math", description="Evaluate a basic arithmetic expression.")
def math(query: str) -> str:
    expression = extract_expression(query)
    expr_ast = ast.parse(expression, mode="eval").body
    return str(eval_expr(expr_ast))


if __name__ == "__main__":
    server.run("stdio")
