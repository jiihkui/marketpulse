import asyncio
from crawl4ai import AsyncWebCrawler
from pydantic import BaseModel
from pydantic_ai import Agent
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher

dispatcher = MemoryAdaptiveDispatcher(
    memory_threshold_percent=80.0, # Pause if RAM hits 80%
    check_interval=2.0             # Check every 2 seconds
)

# Use it in your crawl command
results = await crawler.arun_many(urls=urls, dispatcher=dispatcher)
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

async def scrape_safely(url):
    # 'async with' ensures the crawler closes NO MATTER WHAT
    async with AsyncWebCrawler() as crawler:
        try:
            result = await crawler.arun(url=url)
            # Process your data...
            return result
        except Exception as e:
            print(f"⚠️ Error on {url}: {e}")
            return None
    # At this point, the browser is guaranteed to be dead.

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
