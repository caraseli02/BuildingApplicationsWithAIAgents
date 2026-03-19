#!/usr/bin/env python
"""
Test the ecommerce support agent with different scenarios
Run: python test_agent.py
"""
import sys
sys.path.insert(0, 'src')

from langchain.schema import HumanMessage
from frameworks.langgraph_agents.ecommerce_customer_support.customer_support_agent import graph

def test_scenario(name, order, customer_message):
    print(f"\n{'='*60}")
    print(f"SCENARIO: {name}")
    print(f"{'='*60}")
    print(f"Order: {order}")
    print(f"Customer: {customer_message}")
    print(f"{'-'*60}")

    result = graph.invoke({
        "order": order,
        "messages": [HumanMessage(content=customer_message)]
    })

    print("\nAgent Response:")
    for msg in result["messages"]:
        print(f"  [{msg.type}] {msg.content[:100] if msg.content else '(tool call)'}")

# Test scenarios
scenarios = [
    (
        "Broken item - request refund",
        {"order_id": "A12345", "status": "Delivered", "total": 19.99},
        "My mug arrived broken. Refund?"
    ),
    (
        "Change shipping address",
        {"order_id": "B98765", "status": "Processing", "total": 49.99},
        "I need to change my shipping address to 123 Main St, New York, NY 10001"
    ),
    (
        "Cancel order before shipment",
        {"order_id": "C55555", "status": "Processing", "total": 99.99},
        "I want to cancel my order, I found a better price elsewhere"
    ),
    (
        "General question",
        {"order_id": "D11111", "status": "Shipped", "total": 29.99},
        "When will my order arrive?"
    ),
    (
        "Multiple issues",
        {"order_id": "E22222", "status": "Delivered", "total": 150.00},
        "The package arrived damaged and it's not what I ordered"
    ),
]

if __name__ == "__main__":
    for name, order, message in scenarios:
        test_scenario(name, order, message)
