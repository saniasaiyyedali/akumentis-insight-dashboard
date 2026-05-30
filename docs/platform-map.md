# Akumentis Sales Operating System

**Data source:** `backend/data/master_data.xlsx` only — all metrics computed server-side.

## Architecture

```
master_data.xlsx → salesOSService.js → /api/workforce/os/* → React (render only)
```

## Routes

| Route | Purpose |
|-------|---------|
| `/overview` | **Sales Command** — 4 KPIs, hierarchy bar, single dynamic drill workspace, AI copilot |
| `/organization` | Inline expanding org tree (BU Head → Employee) |
| `/performance` | Level → segment → owner drill |
| `/employee-explorer` | Search → BM/RM profile |

## Sales OS API Map

| Endpoint | Purpose |
|----------|---------|
| `GET /os/summary` | Revenue, Achievement, Growth, Revenue At Risk + hierarchy level counts |
| `GET /os/segments?level=RM&segmentType=achievement` | Single donut data (achievement/growth/coverage/revenue slabs) |
| `GET /os/breakdown?segment=<80%&breakdownBy=zone` | Next drill level cards |
| `GET /os/profile/bm/:empCode` | BM profile + manager chain + team |
| `GET /os/profile/rm/:empCode` | RM profile + BMs under RM |
| `GET /os/profile/zone/:name` | Zone command view |
| `GET /os/leakage` | Revenue at risk ownership chain |
| `GET /os/org-tree?parentEmpCode=` | Expandable organization tree |
| `GET /os/compare?a=Maharashtra&b=UP&dimension=state` | Entity comparison |
| `POST /os/ai` `{ query }` | Rule-based copilot over live Excel data |

## Removed (Power BI clutter)

- 10 permanent donuts, Insight Engine, Comparison Engine, Treemaps
- Distribution charts, GlobalLegend, giant drill tables
- Frontend aggregation (`salesAnalytics.ts` no longer used on active pages)

## Drill Flow (3 clicks)

1. Click hierarchy level (e.g. **RM**) → achievement donut appears
2. Click segment (e.g. **<80%**) → zone cards replace donut
3. Click zone → state → person → BM/RM profile

## Components

```
frontend/src/components/sales-os/
  CoreKPIs.tsx          — 4 premium KPI cards
  HierarchyBar.tsx      — colored role nodes
  DynamicDonut.tsx      — ONE active visualization
  BreakdownCards.tsx    — next drill level
  EntityProfile.tsx     — BM / RM / Zone profiles
  LeakagePanel.tsx      — revenue at risk
  SalesCopilot.tsx      — Akumentis AI floating button
```

## Restart after pull

```bash
cd backend && npm start   # required for /os/* routes
cd frontend && npm run dev
```

Login: `admin@akumentis.com` / `admin123`
