from langchain_core.messages import AIMessage, ToolMessage

from common.frontend.run_explorer import run_customer_support
from frameworks.langgraph_agents.ecommerce_customer_support import customer_support_agent


def test_run_customer_support_normalizes_tool_calls(monkeypatch):
    monkeypatch.setattr(
        customer_support_agent,
        "loyalty_check",
        lambda state: {"loyalty_points": "2500"},
    )
    monkeypatch.setattr(
        customer_support_agent,
        "call_model",
        lambda state: {
            "messages": [
                AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "name": "issue_refund",
                            "args": {"order_id": "A12345", "amount": 19.99},
                            "id": "tool-refund",
                        }
                    ],
                ),
                ToolMessage(content="refund_queued", tool_call_id="tool-refund"),
                AIMessage(content="Your refund has been queued."),
            ]
        },
    )

    result = run_customer_support(
        {
            "presetId": "refund-broken-mug",
            "mode": "auto",
            "customerMessage": "My mug arrived broken. Refund?",
            "order": {
                "order_id": "A12345",
                "status": "Delivered",
                "total": 19.99,
                "customer_id": "CUST123",
            },
        }
    )

    event_types = [event["type"] for event in result["timeline"]]

    assert result["status"] == "completed"
    assert result["dataOrigin"] == "real"
    assert result["finalResponse"] == "Your refund has been queued."
    assert event_types == [
        "run_started",
        "loyalty_checked",
        "tool_called",
        "tool_result",
        "assistant_reply",
        "run_finished",
    ]
    assert result["timeline"][2]["toolName"] == "issue_refund"
    assert result["timeline"][3]["output"] == "refund_queued"


def test_run_customer_support_normalizes_multi_round_tool_calls(monkeypatch):
    monkeypatch.setattr(
        customer_support_agent,
        "loyalty_check",
        lambda state: {"loyalty_points": "2500"},
    )
    monkeypatch.setattr(
        customer_support_agent,
        "call_model",
        lambda state: {
            "messages": [
                AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "name": "cancel_order",
                            "args": {"order_id": "B54321"},
                            "id": "tool-cancel",
                        }
                    ],
                ),
                ToolMessage(content="cancelled", tool_call_id="tool-cancel"),
                AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "name": "send_customer_message",
                            "args": {"order_id": "B54321", "text": "Your order has been cancelled."},
                            "id": "tool-message",
                        }
                    ],
                ),
                ToolMessage(content="sent", tool_call_id="tool-message"),
                AIMessage(content="Your order has been cancelled."),
            ]
        },
    )

    result = run_customer_support(
        {
            "presetId": "cancel-processing-order",
            "mode": "auto",
            "customerMessage": "Please cancel my order, I don't need it anymore.",
            "order": {
                "order_id": "B54321",
                "status": "Processing",
                "total": 59.99,
                "customer_id": "CUST123",
            },
        }
    )

    event_types = [event["type"] for event in result["timeline"]]
    tool_names = [event.get("toolName") for event in result["timeline"] if event["type"] == "tool_called"]

    assert result["finalResponse"] == "Your order has been cancelled."
    assert event_types == [
        "run_started",
        "loyalty_checked",
        "tool_called",
        "tool_result",
        "tool_called",
        "tool_result",
        "assistant_reply",
        "run_finished",
    ]
    assert tool_names == ["cancel_order", "send_customer_message"]
