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

## Quick Start

**Terminal 1 - Backend API:**
```bash
cd mcp-weather
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
python -m uv run python -m src.api
```

**Terminal 2 - Frontend:**
```bash
cd mcp-weather/frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🚀

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | POST | Search locations |
| `/weather/current` | POST | Current + AI summary |
| `/weather/forecast` | POST | 7-day forecast |
| `/weather/coordinates` | POST | Weather by lat/lon |
| `/theme` | POST | Get ambient theme |

## Tech Stack

- **Backend**: Python 3.14+, FastAPI, FastMCP
- **Frontend**: Next.js 16, Tailwind 4.1, shadcn/ui
- **AI**: OpenAI GPT-5-mini
- **Weather**: Open-Meteo API (free)

## License

MIT

