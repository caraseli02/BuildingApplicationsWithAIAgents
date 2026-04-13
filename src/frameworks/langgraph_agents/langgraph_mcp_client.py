import asyncio
import sys

from langchain_core.messages import HumanMessage
from langchain.tools import Tool
from langchain_mcp_adapters.client import MultiServerMCPClient

from langgraph.graph import StateGraph, END
from typing import TypedDict, Sequence, Any

class AgentState(TypedDict):
    messages: Sequence[Any]  # A list of BaseMessage/HumanMessage/…


MCP_CONFIG = {
    "math": {
        "command": sys.executable,
        "args": ["src/common/mcp/MCP_math_server.py"],
        "transport": "stdio",
    },
    "weather": {
        # Ensure MCP_weather_server.py is running on port 8000.
        "url": "http://localhost:8000/mcp",
        "transport": "streamable_http",
    },
}

async def call_mcp_tools(state: AgentState) -> dict[str, Any]:
    """
    Given AgentState with state["messages"], decide which MCP tool to call.
    For demonstration, if the user message mentions 'weather', call weather tool;
    if it contains a math expression (digits/operators), call math tool.
    Otherwise, return a fallback message.
    """
    messages = state["messages"]
    last_msg = messages[-1].content.lower()

    if any(token in last_msg for token in ["+", "-", "*", "/", "(", ")"]):
        tool_name = "math"
    elif "weather" in last_msg:
        tool_name = "weather"
    else:
        return {
            "messages": [
                {
                    "role": "assistant",
                    "content": "Sorry, I can only answer math or weather queries.",
                }
            ]
        }

    async with MultiServerMCPClient(MCP_CONFIG) as mcp_client:
        mcp_tools = mcp_client.get_tools()
        tool_obj = next(
            (tool for tool in mcp_tools if tool.name == tool_name),
            None,
        )
        if tool_obj is None:
            available_tools = ", ".join(tool.name for tool in mcp_tools) or "<none>"
            raise RuntimeError(
                f"MCP tool '{tool_name}' was not discovered. Available tools: {available_tools}"
            )

        user_input = messages[-1].content
        arg_names = list(getattr(tool_obj, "args", {}).keys())
        if len(arg_names) != 1:
            raise RuntimeError(
                f"Expected one MCP tool argument for '{tool_name}', got: {arg_names}"
            )

        mcp_result: str = await tool_obj.arun({arg_names[0]: user_input})

    return {
        "messages": [
            {"role": "assistant", "content": mcp_result}
        ]
    }

def construct_graph():
    g = StateGraph(AgentState)
    g.add_node("assistant", call_mcp_tools)
    g.set_entry_point("assistant")
    return g.compile()

GRAPH = construct_graph()


def extract_content(message: Any) -> str:
    if isinstance(message, dict):
        return str(message.get("content", ""))
    return str(getattr(message, "content", message))

async def run_math_query():
    initial_state = {
        "messages": [
            HumanMessage(content="What is (3 + 5) * 12?")
        ]
    }
    result = await GRAPH.ainvoke(initial_state)
    assistant_msg = result["messages"][-1]
    print("Math answer:", extract_content(assistant_msg))


async def run_weather_query():
    initial_state = {
        "messages": [
            HumanMessage(content="What is the weather in Mallorca?")
        ]
    }
    result = await GRAPH.ainvoke(initial_state)
    assistant_msg = result["messages"][-1]
    print("Weather answer:", extract_content(assistant_msg))


async def main():
    await run_math_query()
    await run_weather_query()


if __name__ == "__main__":
    asyncio.run(main())
