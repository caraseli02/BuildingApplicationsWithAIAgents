#!/usr/bin/env python3
from mcp.server.fastmcp import FastMCP


DUMMY_TEMPS = {
    "nyc": "58°F",
    "london": "48°F",
    "san francisco": "62°F",
    "madrid": "72°F",
}


def extract_city(query: str) -> str:
    lowered = query.lower().strip()
    if "weather in" in lowered:
        return lowered.split("weather in", 1)[1].strip().rstrip("?").strip()
    return lowered.rstrip("?").strip()


server = FastMCP("weather-server", host="127.0.0.1", port=8000)


@server.tool(name="weather", description="Return a dummy weather report for a city.")
def weather(query: str) -> str:
    city = extract_city(query) or "unknown"
    temp = DUMMY_TEMPS.get(city, "65°F (approx)")
    return f"The current temperature in {city.title()} is {temp}."


if __name__ == "__main__":
    server.run("streamable-http")
