# MCP Weather Aggregator

AI-powered weather aggregation using MCP (Model Context Protocol).

## Features

- 🌤️ Weather data from Open-Meteo (more providers coming)
- 🔍 Location search by city name
- 📅 Daily forecast (up to 16 days)
- ⏰ Hourly forecast (24 hours)
- 🌅 Sunrise/sunset times
- 🤖 MCP tools for AI integration

## Installation

```bash
# Clone repository
git clone <repo-url>
cd mcp-weather

# Install dependencies
python -m uv sync
```

## Usage

### Run MCP Server

```bash
python -m uv run python -m src.server
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `search_location` | Search for cities by name |
| `get_current_weather` | Get current weather conditions |
| `get_weather_forecast` | Get multi-day forecast |
| `get_weather_by_coordinates` | Get weather by lat/lon |

## Tech Stack

- Python 3.14+
- FastMCP (MCP Server)
- Open-Meteo API (free, no key required)
- httpx (async HTTP)
- Pydantic (data validation)

## License

MIT
