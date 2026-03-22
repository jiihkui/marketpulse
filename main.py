import asyncio
from crawl4ai import AsyncWebCrawler
from pydantic import BaseModel
from pydantic_ai import Agent
import os

# 1. Define our JSON Structure
class MarketData(BaseModel):
    product_name: str
    price: float
    currency: str
    in_stock: bool

# 2. Define the AI Agent (The "Brain")
# We use Gemini 2.0 Flash because it's fast and has a great free tier
agent = Agent('google:gemini-2.0-flash', result_type=MarketData)

async def scrape_market(url, market_name):
    async with AsyncWebCrawler() as crawler:
        print(f"🕵️ Scanning {market_name}...")
        result = await crawler.arun(url=url)
        
        # The AI reads the Markdown and finds the price info
        response = await agent.run(f"Extract price info from this page: {result.markdown}")
        data = response.data
        print(f"✅ {market_name} Result: {data.currency} {data.price}")
        return data

async def main():
    # Example: iPhone 17 (US, China, Germany)
    urls = {
        "US": "https://www.apple.com/shop/buy-iphone/iphone-17",
        "China": "https://www.apple.com.cn/shop/buy-iphone/iphone-17",
        "Germany": "https://www.apple.com/de/shop/buy-iphone/iphone-17"
    }
    
    tasks = [scrape_market(url, name) for name, url in urls.items()]
    all_prices = await asyncio.gather(*tasks)
    # Here you would save all_prices to your database

if __name__ == "__main__":
    asyncio.run(main())
