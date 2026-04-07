import pytest
from langchain_core.messages import AIMessage, HumanMessage

from frameworks.langgraph_agents.ecommerce_customer_support import customer_support_agent


class FakeToolCallingModel:
    def __init__(self, first_call, final_reply):
        self._first_call = first_call
        self._final_reply = final_reply
        self._calls = 0

    def invoke(self, _messages):
        self._calls += 1
        if self._calls == 1:
            return AIMessage(content="", tool_calls=[self._first_call])
        return AIMessage(content=self._final_reply)


def test_refund_flow(monkeypatch):
    fake_model = FakeToolCallingModel(
        {
            "name": "issue_refund",
            "args": {"order_id": "A12345", "amount": 19.99},
            "id": "tool-refund",
        },
        "Your refund has been queued.",
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
        {
            "name": "cancel_order",
            "args": {"order_id": "B54321"},
            "id": "tool-cancel",
        },
        "Your order has been cancelled.",
    )
    monkeypatch.setattr(customer_support_agent, "get_llm", lambda: fake_model)

    order = {"order_id": "B54321", "status": "Processing", "total": 59.99}
    user_msg = [HumanMessage(content="Please cancel my order, I don't need it anymore.")]

    result = customer_support_agent.graph.invoke({"order": order, "messages": user_msg})
    messages = result["messages"]

    assert any("cancel" in m.content.lower() for m in messages), "Should confirm cancellation"


if __name__ == "__main__":
    pytest.main([__file__])
