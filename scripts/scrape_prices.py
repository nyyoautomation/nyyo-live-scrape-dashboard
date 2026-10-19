#!/usr/bin/env python3
"""Fetch public BTC/ETH/SOL prices → data/prices.json. No API key."""
from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "prices.json"
URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
)


def main() -> None:
    req = urllib.request.Request(URL, headers={"User-Agent": "NyyoAutomationDemo/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = json.load(resp)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    items = []
    for coin, name in [("bitcoin", "Bitcoin"), ("ethereum", "Ethereum"), ("solana", "Solana")]:
        d = raw[coin]
        items.append(
            {
                "id": coin,
                "name": name,
                "price_usd": d["usd"],
                "change_24h_pct": round(d.get("usd_24h_change") or 0, 2),
                "source": "CoinGecko public API",
            }
        )
    payload = {
        "updated_at": now,
        "note": "Demo scrape for Nyyo Automation portfolio — public prices only.",
        "items": items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} at {now}")
    for it in items:
        print(f"  {it['name']}: ${it['price_usd']} ({it['change_24h_pct']:+}%)")


if __name__ == "__main__":
    main()
