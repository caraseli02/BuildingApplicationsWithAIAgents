from __future__ import annotations

"""
customer_support_agent.py
LangGraph workflow for an e-commerce customer-support agent,
using LangGraph's built-in tool-calling via @tool decorators.
"""
import os
import json
import operator
from typing import Annotated, Sequence, TypedDict, Optional

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - fallback for minimal environments
    def load_dotenv():
        return False

load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.messages.tool import ToolMessage
from langchain_core.callbacks import StreamingStdOutCallbackHandler

from langchain.tools import tool
from langgraph.graph import StateGraph, END

from common.observability.loki_logger import log_to_loki


os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:4317"
os.environ["OTEL_EXPORTER_OTLP_INSECURE"] = "true"


@tool
def send_customer_message(order_id: str, text: str) -> str:
    """Send a plain response to the customer."""
    print(f"[TOOL] send_customer_message → {text}")
    log_to_loki("tool.send_customer_message", f"order_id={order_id}, text={text}")
    return "sent"


@tool
def issue_refund(order_id: str, amount: float) -> str:
    """Issue a refund for the given order."""
    print(f"[TOOL] issue_refund(order_id={order_id}, amount={amount})")
    log_to_loki("tool.issue_refund", f"order_id={order_id}, amount={amount}")
    return "refund_queued"


@tool
def cancel_order(order_id: str) -> str:
    """Cancel an order that hasn't shipped."""
    print(f"[TOOL] cancel_order(order_id={order_id})")
    log_to_loki("tool.cancel_order", f"order_id={order_id}")
    return "cancelled"


@tool
def modify_order(order_id: str, shipping_address: Optional[dict] = None) -> str:
    """
    Change the shipping address for a pending order.
    The shipping_address should be a dictionary with keys: 'name', 'street1', 'city', 'state', 'zip', 'country'.
    """
    print(f"[TOOL] modify_order(order_id={order_id}, address={shipping_address})")
    log_to_loki("tool.modify_order", f"order_id={order_id}, address={shipping_address}")
    return "address_updated"


@tool
def check_loyalty_points(customer_id: str) -> str:
    """Fetch the loyalty points balance for a customer."""
    # Simulating a database lookup
    points_map = {"CUST123": "2500", "CUST456": "120", "CUST789": "0"}
    points = points_map.get(customer_id, "0")
    print(f"[TOOL] check_loyalty_points(customer_id={customer_id}) → {points}")
    log_to_loki(
        "tool.check_loyalty_points", f"customer_id={customer_id}, points={points}"
    )
    return points


TOOLS = [
    send_customer_message,
    issue_refund,
    cancel_order,
    modify_order,
    check_loyalty_points,
]

_llm = None


def get_llm():
    global _llm
    if _llm is None:
        try:
            _llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.0,
                callbacks=[StreamingStdOutCallbackHandler()],
                verbose=True,
            ).bind_tools(TOOLS)
        except Exception as exc:  # pragma: no cover - surfaces only in live runs
            raise RuntimeError(
                "Set OPENAI_API_KEY before running the customer support agent."
            ) from exc
    return _llm


class AgentState(TypedDict):
    order: Optional[dict]
    messages: Annotated[Sequence[BaseMessage], operator.add]
    loyalty_points: Optional[str]


def call_model(state: AgentState):
    llm = get_llm()
    history = state["messages"]

    # Handle missing or incomplete order data gracefully
    order = state.get("order", {})
    if not order:
        order = {"order_id": "UNKNOWN", "status": "unknown", "total": 0.0}

    order_json = json.dumps(order, ensure_ascii=False)
    loyalty_info = f"Loyalty Points: {state.get('loyalty_points', 'unknown')}"
    system_prompt = f"""You are a helpful e-commerce support agent.

For EVERY business request (refund, cancel, or address change), you MUST:
1. Call EXACTLY ONE business tool: issue_refund, cancel_order, OR modify_order.
2. Call send_customer_message with a polite confirmation.
Then STOP.

EXAMPLE (Mapping address to dictionary):
Customer: "Ship to 175 Elm St, Metropolis 95303 instead"
→ modify_order(order_id="C70109", shipping_address={{"name": "Customer2", "street1": "175 Elm St", "city": "Metropolis", "state": "CA", "zip": "95303", "country": "US"}})

Note: Use the existing ORDER data to fill in fields like "name" and "country".

LOYALTY INFO: {loyalty_info}
ORDER: {order_json}
"""

    full = [SystemMessage(content=system_prompt)] + history

    current: ToolMessage | BaseMessage = llm.invoke(full)
    messages = [current]
    tool_rounds = 0

    # The prompt requires one business action followed by send_customer_message,
    # so keep executing tool calls until the model returns a plain assistant reply.
    while getattr(current, "tool_calls", None):
        tool_rounds += 1
        if tool_rounds > 4:
            raise RuntimeError("Customer support agent exceeded tool-call round limit.")

        for tc in current.tool_calls:
            fn = next(t for t in TOOLS if t.name == tc["name"])
            out = fn.invoke(tc["args"])
            messages.append(ToolMessage(content=str(out), tool_call_id=tc["id"]))

        current = llm.invoke(full + messages)
        messages.append(current)

    return {"messages": messages}


def loyalty_check(state: AgentState):
    """Initial node to check loyalty points if not already present."""
    if state.get("loyalty_points"):
        return {}

    order = state.get("order", {})
    customer_id = order.get("customer_id", "UNKNOWN")
    points = check_loyalty_points.invoke({"customer_id": customer_id})
    return {"loyalty_points": points}


def construct_graph():
    g = StateGraph(AgentState)
    g.add_node("loyalty_check", loyalty_check)
    g.add_node("assistant", call_model)
    g.set_entry_point("loyalty_check")
    g.add_edge("loyalty_check", "assistant")
    g.add_edge("assistant", END)
    return g.compile()


graph = construct_graph()

if __name__ == "__main__":
    example = {"order_id": "A12345", "status": "Delivered", "total": 19.99}
    convo = [HumanMessage(content="My mug arrived broken. Refund?")]
    result = graph.invoke({"order": example, "messages": convo})
    for m in result["messages"]:
        print(f"{m.type}: {m.content}")
