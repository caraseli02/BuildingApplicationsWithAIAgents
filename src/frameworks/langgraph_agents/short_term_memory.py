from typing import Annotated, Sequence
from typing_extensions import TypedDict

from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langchain_core.messages import BaseMessage
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(model="gpt-5.4-nano")


class MessagesState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda left, right: list(left) + list(right)]


def call_model(state: MessagesState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


builder = StateGraph(MessagesState)
builder.add_node("call_model", call_model)
builder.set_entry_point("call_model")
builder.add_edge("call_model", END)
graph = builder.compile()

# Fails to maintain state across the conversation
input_message = {"type": "user", "content": "hi! I'm bob"}
result = graph.invoke({"messages": [input_message]})
result["messages"][-1].pretty_print()

input_message = {"type": "user", "content": "what's my name?"}
result = graph.invoke({"messages": [input_message]})
result["messages"][-1].pretty_print()

from langgraph.checkpoint.memory import MemorySaver

# Memory is now persisted across the graph
memory = MemorySaver()
graph = builder.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "1"}}
input_message = {"type": "user", "content": "hi! I'm bob"}
result = graph.invoke({"messages": [input_message]}, config)
result["messages"][-1].pretty_print()

input_message = {"type": "user", "content": "what's my name?"}
result = graph.invoke({"messages": [input_message]}, config)
result["messages"][-1].pretty_print()
