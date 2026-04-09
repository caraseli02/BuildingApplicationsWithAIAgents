from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from frameworks.langgraph_agents.ecommerce_customer_support import customer_support_agent


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _event(
    event_type: str,
    title: str,
    summary: str,
    status: str = "info",
    **kwargs: Any,
) -> dict[str, Any]:
    payload = {
        "id": f"evt-{uuid4()}",
        "type": event_type,
        "title": title,
        "summary": summary,
        "at": _timestamp(),
        "status": status,
    }
    payload.update({key: value for key, value in kwargs.items() if value is not None})
    return payload


def _serialize_message_content(content: Any) -> Any:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return [dict(item) if isinstance(item, dict) else str(item) for item in content]
    return str(content)


def _tool_routing_note(tool_name: str) -> str:
    return f"Agent selected `{tool_name}` as the concrete business action for this request."


def _build_run(input_payload: dict[str, Any], timeline: list[dict[str, Any]], **kwargs: Any) -> dict[str, Any]:
    payload = {
        "schemaVersion": 2,
        "id": f"run-{uuid4()}",
        "scenarioKey": "ecommerce_customer_support",
        "title": "Ecommerce support run",
        "createdAt": _timestamp(),
        "input": input_payload,
        "timeline": timeline,
    }
    payload.update(kwargs)
    return payload


def run_customer_support(input_payload: dict[str, Any]) -> dict[str, Any]:
    order = input_payload["order"]
    customer_message = input_payload["customerMessage"]
    history = [HumanMessage(content=customer_message)]
    state: dict[str, Any] = {"order": order, "messages": history}

    timeline = [
        _event(
            "run_started",
            "Run started",
            "The adapter packaged the browser input and began the Python scenario.",
            details={"input": input_payload},
        )
    ]

    try:
        loyalty_result = customer_support_agent.loyalty_check(state)
        if loyalty_result.get("loyalty_points") is not None:
            state.update(loyalty_result)
            timeline.append(
                _event(
                    "loyalty_checked",
                    "Loyalty checked",
                    f"Loaded loyalty points for {order.get('customer_id', 'UNKNOWN')}.",
                    status="success",
                    details={"loyalty_points": loyalty_result["loyalty_points"]},
                )
            )

        assistant_result = customer_support_agent.call_model(state)
        messages = assistant_result["messages"]

        planned_tool_calls: dict[str, dict[str, Any]] = {}
        final_response = ""

        for message in messages:
            if isinstance(message, AIMessage) and getattr(message, "tool_calls", None):
                for tool_call in message.tool_calls:
                    planned_tool_calls[tool_call["id"]] = tool_call
                    timeline.append(
                        _event(
                            "tool_called",
                            "Tool call planned",
                            f"Prepared `{tool_call['name']}` with concrete arguments.",
                            status="success",
                            toolName=tool_call["name"],
                            args=tool_call.get("args", {}),
                            routingNote=_tool_routing_note(tool_call["name"]),
                        )
                    )
            elif isinstance(message, ToolMessage):
                tool_call = planned_tool_calls.get(message.tool_call_id, {})
                timeline.append(
                    _event(
                        "tool_result",
                        "Tool result returned",
                        f"`{tool_call.get('name', 'tool')}` returned its result.",
                        status="success",
                        toolName=tool_call.get("name"),
                        output=_serialize_message_content(message.content),
                    )
                )
            elif isinstance(message, AIMessage):
                final_response = str(message.content)
                timeline.append(
                    _event(
                        "assistant_reply",
                        "Assistant reply",
                        "The agent turned the tool outcome into a customer-facing answer.",
                        status="success",
                        output=_serialize_message_content(message.content),
                    )
                )

        timeline.append(
            _event(
                "run_finished",
                "Run finished",
                "The live Python flow completed and returned a normalized run record.",
                status="success",
                details={"event_count": len(timeline) + 1},
            )
        )

        return _build_run(
            input_payload,
            timeline,
            status="completed",
            dataOrigin="real",
            modeUsed=input_payload.get("mode", "auto"),
            finalResponse=final_response or "Live run completed without a final assistant reply.",
            observability={
                "logs": "unavailable",
                "traces": "unavailable",
                "note": "The timeline is real. Loki and Tempo remain optional in V1 and are not yet stitched into this screen.",
            },
        )
    except Exception as exc:
        timeline.append(
            _event(
                "run_failed",
                "Run failed",
                str(exc),
                status="error",
                details={"exception_type": type(exc).__name__},
            )
        )

        return _build_run(
            input_payload,
            timeline,
            status="failed",
            dataOrigin="real",
            modeUsed=input_payload.get("mode", "auto"),
            finalResponse="The live Python flow did not finish successfully.",
            errorMessage=str(exc),
            observability={
                "logs": "unavailable",
                "traces": "unavailable",
                "note": "Observability remains unavailable for failed live runs until the adapter collects it explicitly.",
            },
        )


def main(raw_input: str) -> str:
    payload = json.loads(raw_input)
    result = run_customer_support(payload)
    return json.dumps(result)
