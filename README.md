# MCP Weather Aggregator

AI-powered weather aggregation from **4 sources** with intelligent deduction using GPT-5-mini.

## ✨ Features

- 🌤️ **Multi-source aggregation** - Open-Meteo, OpenWeatherMap, WeatherAPI, Visual Crossing
- 🤖 **AI-powered deduction** - GPT-5-mini analyzes differences and deduces most accurate values
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

### 2. Run Backend

```bash
cd mcp-weather
python -m src.api
```

Output:
```
✓ OpenWeatherMap provider enabled
✓ WeatherAPI.com provider enabled
✓ Visual Crossing provider enabled
Active providers: ['open_meteo', 'openweathermap', 'weatherapi', 'visualcrossing']
✓ AI aggregation enabled (model: gpt-5-mini)
```

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🚀

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | POST | Search locations by name |
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
| Backend | Python 3.14+, FastAPI, Pydantic |
| Frontend | Next.js 15, Tailwind, shadcn/ui, Framer Motion |
| AI | OpenAI GPT-5-mini |
| Weather | Open-Meteo (free), OpenWeatherMap, WeatherAPI, Visual Crossing |

## 📁 Project Structure

```
mcp-weather/
├── src/
│   ├── api.py           # FastAPI HTTP server
│   ├── aggregator.py    # AI weather aggregation logic
│   ├── models.py        # Pydantic data models
│   └── providers/       # Weather API providers
│       ├── open_meteo.py
│       ├── openweathermap.py
│       ├── weatherapi.py
│       └── visualcrossing.py
├── frontend/            # Next.js app
│   └── src/
│       ├── app/
│       ├── components/weather/
│       └── lib/api.ts
└── .env                 # API keys
```

## License

MIT
