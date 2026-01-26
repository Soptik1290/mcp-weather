# MCP Weather Aggregator

AI-powered weather aggregation from **4 sources** with intelligent deduction using GPT-5-mini. 
Works as both a **REST API** for web apps and an **MCP Server** for AI assistants (Claude, Cursor, etc.).

## ✨ Features

- 🌤️ **Multi-source aggregation** - Open-Meteo, OpenWeatherMap, WeatherAPI, Visual Crossing
- 🤖 **AI-powered deduction** - GPT-5-mini analyzes differences and deduces most accurate values
- 🔌 **Dual Mode** - Runs as REST API (FastAPI) or MCP Server (FastMCP)
- 🎨 **Ambient theming** - Dynamic gradients based on weather/time (sunny, rainy, storm, night...)
- 📊 **Confidence scores** - Based on source agreement (0-1)
- 📅 **Forecasts** - Daily (up to 16 days) + Hourly (24 hours)
- 🌅 **Astronomy** - Sunrise/sunset, moon phases
- 🌍 **Multi-language** - EN, CZ

## 🚀 Quick Start

### 1. Configure API Keys

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Required for AI deduction
OPENAI_API_KEY=sk-...

# Weather providers (add keys to enable more sources)
OPENWEATHERMAP_API_KEY=your_key  # openweathermap.org
WEATHERAPI_KEY=your_key          # weatherapi.com
VISUALCROSSING_KEY=your_key      # visualcrossing.com
```

### 2. Install Dependencies

This project uses `uv` for dependency management.

```bash
# Windows
curl -LsSf https://astral.sh/uv/install.ps1 | powershell -c -

# Install project dependencies
uv sync
```

### 3. Run Application

#### Option A: Run as MCP Server (for AI Assistants)

Connect this server to your MCP client (Cursor, Claude Desktop, etc.).

```bash
# Run directly
uv run mcp-weather

# OR via python module
uv run python -m src.server
```

### 5. Configure Claude Desktop

To use this server with Claude Desktop, edit your config file:
- **Windows**: `C:\Users\USERNAME\AppData\Roaming\Claude\claude_desktop_config.json`
- **Mac/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following configuration (adjust path to your project):

```json
{
  "mcpServers": {
    "weather": {
      "command": "C:\\Path\\To\\mcp-weather\\.venv\\Scripts\\python.exe",
      "args": [
        "-m",
        "src.server"
      ],
      "cwd": "C:\\Path\\To\\mcp-weather",
      "env": {
        "PYTHONPATH": "C:\\Path\\To\\mcp-weather"
      }
    }
  }
}
```

> **Note:** The `PYTHONPATH` environment variable is crucial for the server to find the `src` module correctly.


**Available MCP Tools:**
- `search_location(query)` - Find coordinates for a city
- `get_current_weather(location_name)` - Get current weather + AI summary
- `get_weather_forecast(location_name, days)` - Full forecast + AI deduction
- `get_weather_by_coordinates(lat, lon)` - Weather for exact location
- `get_ambient_theme(location_name)` - Get UI theme colors for current weather

#### Option B: Run as REST API (for Frontend)

Starts the FastAPI server on `http://localhost:8000`.

```bash
# Run directly
uv run mcp-weather-api

# OR via python module
uv run python -m src.api
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🚀

## 📡 API Endpoints (REST Mode)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | POST | Search locations by name |
| `/weather/current` | POST | Current weather + AI summary |
| `/weather/forecast` | POST | Full forecast + AI analysis |
| `/weather/coordinates` | POST | Weather by lat/lon |
| `/theme` | POST | Get ambient theme colors |

### Example Request

```bash
curl -X POST http://localhost:8000/weather/forecast \
  -H "Content-Type: application/json" \
  -d '{"location_name": "Prague"}'
```

### Response includes:
- `current` - Aggregated current weather
- `daily_forecast` - 7-day forecast
- `hourly_forecast` - 24-hour forecast
- `ai_summary` - AI reasoning about the weather
- `confidence` - 0-1 score based on source agreement
- `sources` - List of providers used
- `ambient_theme` - Theme name + gradient colors

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.14+, `uv` |
| API Framework | FastAPI (REST) |
| MCP Framework | FastMCP (MCP Server) |
| Frontend | Next.js 16.1.1, Tailwind v4, shadcn/ui |
| AI | OpenAI GPT-5-mini |
| Weather | Open-Meteo (free), OpenWeatherMap, WeatherAPI, Visual Crossing |

## 📁 Project Structure

```
mcp-weather/
├── src/
│   ├── api.py           # FastAPI REST server
│   ├── server.py        # MCP Server (FastMCP)
│   ├── aggregator.py    # AI weather aggregation logic
│   ├── models.py        # Pydantic data models
│   └── providers/       # Weather API providers
├── frontend/            # Next.js app
│   └── src/
│       ├── app/
│       ├── components/weather/
│       └── lib/
├── .env                 # API keys
├── pyproject.toml       # Python dependencies
└── uv.lock              # Lock file
```

## License

MIT
