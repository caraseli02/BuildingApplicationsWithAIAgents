from typing import Annotated, Sequence

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from typing_extensions import TypedDict

load_dotenv()

llm = ChatOpenAI(model="gpt-5.4-nano")


class MessagesState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda left, right: list(left) + list(right)]


def call_model(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


def build_graph():
    builder = StateGraph(MessagesState)
    builder.add_node("call_model", call_model)
    builder.set_entry_point("call_model")
    builder.add_edge("call_model", END)
    return builder


builder = build_graph()
graph_without_memory = builder.compile()
graph = graph_without_memory


def run_demo():
    # Fails to maintain state across the conversation
    input_message = {"type": "user", "content": "hi! I'm bob"}
    result = graph_without_memory.invoke({"messages": [input_message]})
    result["messages"][-1].pretty_print()

    input_message = {"type": "user", "content": "what's my name?"}
    result = graph_without_memory.invoke({"messages": [input_message]})
    result["messages"][-1].pretty_print()

    # Memory is now persisted across the graph
    memory_graph = builder.compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "1"}}
    input_message = {"type": "user", "content": "hi! I'm bob"}
    result = memory_graph.invoke({"messages": [input_message]}, config)
    result["messages"][-1].pretty_print()

    input_message = {"type": "user", "content": "what's my name?"}
    result = memory_graph.invoke({"messages": [input_message]}, config)
    result["messages"][-1].pretty_print()


if __name__ == "__main__":
    run_demo()
