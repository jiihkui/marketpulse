import asyncio
import os
import psycopg2
from datetime import datetime
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode

from pydantic_ai import Agent

# In 2026, 'google-gla' is the prefix for the Google Generative Language API
# If you have GOOGLE_API_KEY in your Railway variables, this is all you need:
agent = Agent('google-gla:gemini-2.0-flash', result_type=MarketData)

# 1. Schema
class MarketData(BaseModel):
    product_name: str
    price: float
    currency: str
    in_stock: bool

# 2. Database Init (Updated for Grafana)
def init_db():
    db_url = os.environ.get("DATABASE_URL")
    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS pulses (
                    id SERIAL PRIMARY KEY,
                    product_name TEXT,
                    price NUMERIC(10, 2),
                    currency VARCHAR(10),
                    region VARCHAR(50),
                    source_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

def save_to_db(data, region, url):
    db_url = os.environ.get("DATABASE_URL")
    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO pulses (product_name, price, currency, region, source_url)
                VALUES (%s, %s, %s, %s, %s)
            """, (data.product_name, data.price, data.currency, region, url))
            conn.commit()

async def scrape_market(crawler, url, region_name):
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, magic=True)
    try:
        result = await crawler.arun(url=url, config=run_config)
        if result.success:
            response = await agent.run(f"Price for iPhone 17 in {result.markdown}")
            save_to_db(response.data, region_name, url)
            print(f"📊 {region_name} synced.")
    except Exception as e:
        print(f"⚠️ Error: {e}")

async def main():
    init_db()
    urls = {
        "Apple SG": "https://www.apple.com/sg/shop/buy-iphone/iphone-17",
        "Apple CN": "https://www.apple.com.cn/shop/buy-iphone/iphone-17",
        "Shopee MY": "https://shopee.com.my/search?keyword=iphone%2017",
        "Taobao": "https://s.taobao.com/search?q=iphone+17"
    }
    async with AsyncWebCrawler() as crawler:
        await asyncio.gather(*[scrape_market(crawler, u, n) for n, u in urls.items()])

if __name__ == "__main__":
    asyncio.run(main())
