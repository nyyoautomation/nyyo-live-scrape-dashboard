# Live scrape dashboard (auto-updated)

> **For non-technical clients — start here**
>
> **What it does:** A small robot fetches public numbers (here: BTC / ETH / SOL prices) and shows them on a web dashboard.
>
> **Try it in 1 click:** open the [**live demo**](https://nyyoautomation.github.io/nyyo-live-scrape-dashboard/) and read the cards + “Last scrape” time.
>
> **Business benefit:** stop checking 5 websites every morning. Get a live board (and optional Telegram/Discord alerts).

![Demo](docs/demo.gif)

**Live demo:** https://nyyoautomation.github.io/nyyo-live-scrape-dashboard/  
**Brand:** [Nyyo Automation](https://github.com/nyyoautomation)

[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](#)
[![GitHub Pages](https://img.shields.io/badge/Dashboard-live-3dd6c6)](#)
[![No API key](https://img.shields.io/badge/No_API_key-public_data-5b8cff)](#)

---

## What you get

- `scripts/scrape_prices.py` — pulls public prices (CoinGecko, no key)
- `data/prices.json` — last scrape snapshot
- Static dashboard (`index.html`) that renders the JSON

## Refresh the data

```bash
python scripts/scrape_prices.py
# commit data/prices.json to publish an update
```

A scheduled GitHub Action can refresh this automatically (needs workflow + Pages permissions on the token).

## What’s for sale

| | |
|---|---|
| **Product** | Custom monitored scrape + dashboard + optional alert |
| **Maintenance** | from **$49/mo** |
| **Examples** | Competitor prices · lead lists · stock / availability · job boards |

→ Available on LaborX · [Profile & packages](https://github.com/nyyoautomation)

## How to order

Available on LaborX · [Profile & packages](https://github.com/nyyoautomation)

Questions? Ask in your order chat.

## Limits (honest)

- Demo uses **public** market data for illustration — not financial advice.
- Respect each site’s terms; we don’t sell “bypass anti-bot” as a service.

## Free install kit included

Sheets / Airtable / webhook example configs in `install-kit/` and ZIP in `dist/`. **Free, included with every package.**
