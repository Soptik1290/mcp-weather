# MCP Weather Aggregator

AI-powered weather aggregation using MCP (Model Context Protocol).

## Features

- 🌤️ Weather data from Open-Meteo (more providers coming)
- 🤖 **AI-powered summaries** via GPT-5-mini
- 🎨 **Ambient theming** based on weather/time
- 🔍 Location search by city name
- 📅 Daily forecast (up to 16 days)
- ⏰ Hourly forecast (24 hours)
- 🌅 Sunrise/sunset times
- 🌙 Moon phases
- 🌍 Multi-language support (EN, CZ)

## Installation

```bash
# Clone repository
git clone https://github.com/Soptik1290/mcp-weather.git
cd mcp-weather

# Install dependencies
python -m uv sync

# Set up environment
cp .env.example .env
# Edit .env with your OpenAI API key
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
| `get_current_weather` | Current weather + AI summary |
| `get_weather_forecast` | Multi-day forecast + AI analysis |
| `get_weather_by_coordinates` | Weather by lat/lon |
| `get_ambient_theme` | Get theme colors for UI |

### Ambient Themes

| Weather | Theme |
|---------|-------|
| ☀️ Sunny | `sunny` - orange/gold |
| 🌧️ Rain | `rain` - blue/gray |
| ❄️ Snow | `snow` - white/blue |
| ⛈️ Storm | `storm` - purple/black + ⚡ |
| 🌅 Sunrise | `sunrise` - pink/coral |
| 🌇 Sunset | `sunset` - coral/purple |
| 🌙 Night | `clear_night` / `cloudy_night` |

## Tech Stack

- Python 3.14+
- FastMCP (MCP Server)
- Open-Meteo API (free, no key required)
- OpenAI GPT-5-mini (for AI summaries)
- httpx (async HTTP)
- Pydantic (data validation)

## License

MIT

