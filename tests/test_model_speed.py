"""
Speed comparison test: gpt-5.4-nano vs gpt-5-mini
Measures latency for identical weather aggregation prompts.
"""

import asyncio
import os
import time
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a weather data analyst. Deduce the most accurate weather values from multiple sources.
Return a JSON object with:
- "temperature": deduced temperature in °C
- "feels_like": feels like temperature
- "humidity": humidity percentage
- "wind_speed": wind speed in km/h
- "conditions": weather description
- "confidence": 0-1 score"""

USER_PROMPT = """Location: Prague, Czech Republic

Data from 3 weather sources:
Source: open-meteo
Temperature: 14.2°C
Feels like: 12.1°C
Conditions: Partly cloudy
Wind: 18.5 km/h
Humidity: 62%
Pressure: 1018 hPa
---
Source: weatherapi
Temperature: 13.8°C
Feels like: 11.5°C
Conditions: Cloudy
Wind: 21.0 km/h
Humidity: 65%
Pressure: 1017 hPa
---
Source: visualcrossing
Temperature: 14.5°C
Feels like: 12.8°C
Conditions: Overcast
Wind: 16.2 km/h
Humidity: 60%
Pressure: 1019 hPa
---

Analyze these sources and deduce the most accurate current weather."""

MODELS = ["gpt-5.4-nano", "gpt-5-mini"]
RUNS = 3  # Number of runs per model for averaging


async def benchmark_model(client: AsyncOpenAI, model: str) -> dict:
    """Benchmark a single model call. Returns timing and response."""
    start = time.perf_counter()
    
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT}
        ],
        max_completion_tokens=500,
        response_format={"type": "json_object"}
    )
    
    elapsed = time.perf_counter() - start
    content = response.choices[0].message.content
    usage = response.usage
    
    return {
        "model": model,
        "latency_ms": round(elapsed * 1000),
        "prompt_tokens": usage.prompt_tokens if usage else 0,
        "completion_tokens": usage.completion_tokens if usage else 0,
        "total_tokens": usage.total_tokens if usage else 0,
        "response": json.loads(content) if content else None,
    }


async def main():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set")
        return
    
    client = AsyncOpenAI(api_key=api_key)
    
    print("=" * 60)
    print("  MODEL SPEED COMPARISON TEST")
    print("  Task: Weather data aggregation (3 sources)")
    print(f"  Runs per model: {RUNS}")
    print("=" * 60)
    
    results: dict[str, list[dict]] = {m: [] for m in MODELS}
    
    for run in range(1, RUNS + 1):
        print(f"\n--- Run {run}/{RUNS} ---")
        for model in MODELS:
            try:
                result = await benchmark_model(client, model)
                results[model].append(result)
                print(f"  {model}: {result['latency_ms']}ms "
                      f"({result['total_tokens']} tokens)")
            except Exception as e:
                print(f"  {model}: ERROR - {type(e).__name__}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("  RESULTS SUMMARY")
    print("=" * 60)
    
    for model in MODELS:
        runs = results[model]
        if not runs:
            print(f"\n  {model}: No successful runs")
            continue
        
        latencies = [r["latency_ms"] for r in runs]
        avg_latency = sum(latencies) / len(latencies)
        min_latency = min(latencies)
        max_latency = max(latencies)
        avg_tokens = sum(r["total_tokens"] for r in runs) / len(runs)
        
        print(f"\n  {model}:")
        print(f"    Avg latency: {avg_latency:.0f}ms")
        print(f"    Min/Max:     {min_latency}ms / {max_latency}ms")
        print(f"    Avg tokens:  {avg_tokens:.0f}")
        
        # Show last response as sample
        last = runs[-1]["response"]
        if last:
            print(f"    Sample:      {last.get('temperature')}°C, "
                  f"{last.get('conditions')}, "
                  f"confidence={last.get('confidence')}")
    
    # Comparison
    if all(results[m] for m in MODELS):
        nano_avg = sum(r["latency_ms"] for r in results["gpt-5.4-nano"]) / len(results["gpt-5.4-nano"])
        mini_avg = sum(r["latency_ms"] for r in results["gpt-5-mini"]) / len(results["gpt-5-mini"])
        speedup = mini_avg / nano_avg if nano_avg > 0 else 0
        
        print(f"\n  → gpt-5.4-nano is {speedup:.2f}x {'faster' if speedup > 1 else 'slower'} than gpt-5-mini")
    
    print()


if __name__ == "__main__":
    asyncio.run(main())
