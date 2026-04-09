import pytest
from langchain_core.messages import AIMessage, HumanMessage

from frameworks.langgraph_agents.ecommerce_customer_support import customer_support_agent


class FakeToolCallingModel:
    def __init__(self, responses):
        self._responses = responses
        self._calls = 0

    def invoke(self, _messages):
        response = self._responses[self._calls]
        self._calls += 1
        return response


def test_refund_flow(monkeypatch):
    fake_model = FakeToolCallingModel(
        [
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
            AIMessage(content="Your refund has been queued."),
        ],
    )
    monkeypatch.setattr(customer_support_agent, "get_llm", lambda: fake_model)

    order = {"order_id": "A12345", "status": "Delivered", "total": 19.99}
    user_msg = [HumanMessage(content="My mug arrived broken. Refund?")]

    result = customer_support_agent.graph.invoke({"order": order, "messages": user_msg})
    messages = result["messages"]

    assert len(messages) >= 3, "Should return at least 3 messages"
    assert any("refund" in m.content.lower() for m in messages), "Should confirm refund in user message"


def test_cancel_flow(monkeypatch):
    fake_model = FakeToolCallingModel(
        [
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
            AIMessage(content="Your order has been cancelled."),
        ],
    )
    monkeypatch.setattr(customer_support_agent, "get_llm", lambda: fake_model)

    order = {"order_id": "B54321", "status": "Processing", "total": 59.99}
    user_msg = [HumanMessage(content="Please cancel my order, I don't need it anymore.")]

    result = customer_support_agent.graph.invoke({"order": order, "messages": user_msg})
    messages = result["messages"]

    assert any("cancel" in m.content.lower() for m in messages), "Should confirm cancellation"
    assert any(getattr(m, "tool_call_id", None) == "tool-message" for m in messages), "Should execute send_customer_message before final reply"


if __name__ == "__main__":
    pytest.main([__file__])
