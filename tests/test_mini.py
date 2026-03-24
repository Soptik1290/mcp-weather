import asyncio, os, json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test():
    try:
        client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        print('Calling gpt-5-mini...')
        
        system_prompt = 'You are a friendly personal weather assistant. Return a JSON object with ONLY summary: your advice.'
        user_prompt = 'Location: Prague. Data: 12C, Cloudy'
        
        response = await client.chat.completions.create(
            model='gpt-5-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            max_completion_tokens=300,
            response_format={'type': 'json_object'}
        )
        print('SUCCESS!')
        print(response.choices[0].message.content)
    except Exception as e:
        print('ERROR:', type(e).__name__, str(e))

asyncio.run(test())
