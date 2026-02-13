import { delay, http, HttpResponse } from 'msw'

type Stock = {
  id: string
  ticker: string
  company: string
  sector: string
  price: number
  changePercent: number
  volume: number
  marketCap: number
  rating: 'Buy' | 'Hold' | 'Sell'
  lastUpdated: string
}

type Bond = {
  id: string
  name: string
  issuer: string
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB'
  coupon: number
  maturity: string
  yieldToMaturity: number
  duration: number
  price: number
  currency: 'USD' | 'EUR'
  nextCall: string | null
  sector: string
  size: number
  lastTraded: string
}

const stocks: Stock[] = [
  {
    id: 'stk-001',
    ticker: 'ALNA',
    company: 'Aluna Energy',
    sector: 'Energy',
    price: 84.12,
    changePercent: 1.84,
    volume: 5230000,
    marketCap: 24800000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:12:00Z',
  },
  {
    id: 'stk-002',
    ticker: 'BLFD',
    company: 'Bluefield Cloud',
    sector: 'Technology',
    price: 142.75,
    changePercent: -0.62,
    volume: 8120000,
    marketCap: 91800000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:09:00Z',
  },
  {
    id: 'stk-003',
    ticker: 'CSTL',
    company: 'Coastal Materials',
    sector: 'Industrials',
    price: 58.44,
    changePercent: 0.31,
    volume: 1830000,
    marketCap: 11200000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:05:00Z',
  },
  {
    id: 'stk-004',
    ticker: 'DLWN',
    company: 'Dawn Foods',
    sector: 'Consumer Staples',
    price: 39.9,
    changePercent: -1.12,
    volume: 2260000,
    marketCap: 7600000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:08:00Z',
  },
  {
    id: 'stk-005',
    ticker: 'ECHO',
    company: 'Echo Mobility',
    sector: 'Consumer Discretionary',
    price: 27.63,
    changePercent: 2.21,
    volume: 6410000,
    marketCap: 9800000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:11:00Z',
  },
  {
    id: 'stk-006',
    ticker: 'FLXR',
    company: 'Flux Robotics',
    sector: 'Technology',
    price: 212.4,
    changePercent: 3.05,
    volume: 4320000,
    marketCap: 156000000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:10:00Z',
  },
  {
    id: 'stk-007',
    ticker: 'GNRD',
    company: 'Greenridge Utilities',
    sector: 'Utilities',
    price: 62.15,
    changePercent: -0.18,
    volume: 1960000,
    marketCap: 21400000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:07:00Z',
  },
  {
    id: 'stk-008',
    ticker: 'HLXR',
    company: 'Helix Health',
    sector: 'Healthcare',
    price: 94.3,
    changePercent: 1.02,
    volume: 3890000,
    marketCap: 48600000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:06:00Z',
  },
  {
    id: 'stk-009',
    ticker: 'IONA',
    company: 'Iona Renewables',
    sector: 'Energy',
    price: 46.78,
    changePercent: -2.34,
    volume: 7120000,
    marketCap: 15200000000,
    rating: 'Sell',
    lastUpdated: '2026-02-11T14:09:00Z',
  },
  {
    id: 'stk-010',
    ticker: 'JUNO',
    company: 'Juno Logistics',
    sector: 'Industrials',
    price: 73.88,
    changePercent: 0.54,
    volume: 2740000,
    marketCap: 18600000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:04:00Z',
  },
  {
    id: 'stk-011',
    ticker: 'KOVA',
    company: 'Kova Financial',
    sector: 'Financials',
    price: 129.15,
    changePercent: 1.6,
    volume: 5270000,
    marketCap: 68200000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:07:00Z',
  },
  {
    id: 'stk-012',
    ticker: 'LUMA',
    company: 'Luma Semiconductors',
    sector: 'Technology',
    price: 311.02,
    changePercent: -1.45,
    volume: 6110000,
    marketCap: 234000000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:03:00Z',
  },
  {
    id: 'stk-013',
    ticker: 'MARN',
    company: 'Mariner Apparel',
    sector: 'Consumer Discretionary',
    price: 33.67,
    changePercent: 0.22,
    volume: 1650000,
    marketCap: 5100000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:11:00Z',
  },
  {
    id: 'stk-014',
    ticker: 'NOVA',
    company: 'Nova MedTech',
    sector: 'Healthcare',
    price: 118.2,
    changePercent: 2.7,
    volume: 3470000,
    marketCap: 72200000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:02:00Z',
  },
  {
    id: 'stk-015',
    ticker: 'ORBT',
    company: 'Orbit Streaming',
    sector: 'Communication Services',
    price: 51.96,
    changePercent: -0.4,
    volume: 2890000,
    marketCap: 19400000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:12:00Z',
  },
  {
    id: 'stk-016',
    ticker: 'PRSM',
    company: 'Prism Retail',
    sector: 'Consumer Discretionary',
    price: 64.38,
    changePercent: -1.8,
    volume: 4780000,
    marketCap: 22100000000,
    rating: 'Sell',
    lastUpdated: '2026-02-11T14:06:00Z',
  },
  {
    id: 'stk-017',
    ticker: 'QUAY',
    company: 'Quay Hospitality',
    sector: 'Consumer Discretionary',
    price: 22.75,
    changePercent: 1.14,
    volume: 1320000,
    marketCap: 3900000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:04:00Z',
  },
  {
    id: 'stk-018',
    ticker: 'RIVR',
    company: 'Riverline Shipping',
    sector: 'Industrials',
    price: 41.22,
    changePercent: 0.08,
    volume: 2030000,
    marketCap: 8400000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:08:00Z',
  },
  {
    id: 'stk-019',
    ticker: 'SOLR',
    company: 'Solara Power',
    sector: 'Utilities',
    price: 76.54,
    changePercent: 1.36,
    volume: 2190000,
    marketCap: 26800000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:12:00Z',
  },
  {
    id: 'stk-020',
    ticker: 'TRMN',
    company: 'Truman Insurance',
    sector: 'Financials',
    price: 92.41,
    changePercent: -0.98,
    volume: 2410000,
    marketCap: 35600000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:10:00Z',
  },
  {
    id: 'stk-021',
    ticker: 'URSA',
    company: 'Ursa Defense',
    sector: 'Industrials',
    price: 158.9,
    changePercent: 2.48,
    volume: 4180000,
    marketCap: 104000000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:03:00Z',
  },
  {
    id: 'stk-022',
    ticker: 'VTRN',
    company: 'Vitorra Biotech',
    sector: 'Healthcare',
    price: 67.19,
    changePercent: -0.22,
    volume: 2950000,
    marketCap: 18900000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:05:00Z',
  },
  {
    id: 'stk-023',
    ticker: 'WISP',
    company: 'Wisp Wireless',
    sector: 'Communication Services',
    price: 39.04,
    changePercent: 0.9,
    volume: 3770000,
    marketCap: 14200000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:09:00Z',
  },
  {
    id: 'stk-024',
    ticker: 'XENO',
    company: 'Xeno Materials',
    sector: 'Materials',
    price: 55.67,
    changePercent: -0.74,
    volume: 2080000,
    marketCap: 12600000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:01:00Z',
  },
  {
    id: 'stk-025',
    ticker: 'YARA',
    company: 'Yara AgriTech',
    sector: 'Materials',
    price: 47.32,
    changePercent: 1.12,
    volume: 1890000,
    marketCap: 9800000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:06:00Z',
  },
  {
    id: 'stk-026',
    ticker: 'ZEND',
    company: 'Zendara Software',
    sector: 'Technology',
    price: 188.56,
    changePercent: 0.44,
    volume: 5210000,
    marketCap: 112000000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:12:00Z',
  },
  {
    id: 'stk-027',
    ticker: 'AURM',
    company: 'Auram Luxury',
    sector: 'Consumer Discretionary',
    price: 96.21,
    changePercent: -2.16,
    volume: 1580000,
    marketCap: 27400000000,
    rating: 'Sell',
    lastUpdated: '2026-02-11T14:02:00Z',
  },
  {
    id: 'stk-028',
    ticker: 'BLOM',
    company: 'Bloom Home',
    sector: 'Consumer Discretionary',
    price: 44.73,
    changePercent: 0.67,
    volume: 2210000,
    marketCap: 9800000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:07:00Z',
  },
  {
    id: 'stk-029',
    ticker: 'CLAR',
    company: 'Clarity Payments',
    sector: 'Financials',
    price: 112.28,
    changePercent: 1.24,
    volume: 3980000,
    marketCap: 52100000000,
    rating: 'Buy',
    lastUpdated: '2026-02-11T14:08:00Z',
  },
  {
    id: 'stk-030',
    ticker: 'DRFT',
    company: 'Drift Travel',
    sector: 'Consumer Discretionary',
    price: 24.08,
    changePercent: -0.36,
    volume: 1670000,
    marketCap: 6200000000,
    rating: 'Hold',
    lastUpdated: '2026-02-11T14:04:00Z',
  },
]

type ServiceBrief = {
  clientName: string
  email: string
  firm: string
  portfolioSize: number
  mandateType: 'discretionary' | 'advisory' | 'execution-only'
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  investmentHorizon: 'short' | 'medium' | 'long'
  assetClass: 'equities' | 'fixed-income' | 'alternatives' | 'multi-asset'
  instrument: string
  notes: string
}

type Instrument = {
  id: string
  name: string
  ticker: string
}

const serviceBrief: ServiceBrief = {
  clientName: 'Alexandra Chen',
  email: 'alexandra.chen@meridian.capital',
  firm: 'Meridian Capital Partners',
  portfolioSize: 12500000,
  mandateType: 'discretionary',
  riskProfile: 'moderate',
  investmentHorizon: 'long',
  assetClass: 'equities',
  instrument: 'inst-eq-003',
  notes: 'ESG-focused allocation preferred. Avoid fossil fuel exposure.',
}

const instrumentsByAssetClass: Record<string, Instrument[]> = {
  equities: [
    { id: 'inst-eq-001', name: 'Global Equity Fund', ticker: 'GLEQ' },
    { id: 'inst-eq-002', name: 'US Large Cap Growth', ticker: 'USLCG' },
    { id: 'inst-eq-003', name: 'Emerging Markets Fund', ticker: 'EMMK' },
    { id: 'inst-eq-004', name: 'Tech Innovation ETF', ticker: 'TCHIN' },
    { id: 'inst-eq-005', name: 'Dividend Aristocrats', ticker: 'DVAR' },
  ],
  'fixed-income': [
    { id: 'inst-fi-001', name: 'Global Aggregate Bond', ticker: 'GLAG' },
    { id: 'inst-fi-002', name: 'US Treasury Fund', ticker: 'USTF' },
    { id: 'inst-fi-003', name: 'Investment Grade Corp', ticker: 'IGCF' },
    { id: 'inst-fi-004', name: 'High Yield Bond ETF', ticker: 'HYLD' },
    { id: 'inst-fi-005', name: 'Municipal Bond Fund', ticker: 'MUBF' },
  ],
  alternatives: [
    { id: 'inst-alt-001', name: 'Private Equity Fund', ticker: 'PEFD' },
    { id: 'inst-alt-002', name: 'Real Estate Trust', ticker: 'RRET' },
    { id: 'inst-alt-003', name: 'Commodities Basket', ticker: 'CMBT' },
    { id: 'inst-alt-004', name: 'Hedge Fund Strategies', ticker: 'HDGE' },
    { id: 'inst-alt-005', name: 'Infrastructure Fund', ticker: 'INFR' },
  ],
  'multi-asset': [
    { id: 'inst-ma-001', name: 'Balanced Growth Fund', ticker: 'BALG' },
    { id: 'inst-ma-002', name: 'Target Date 2050', ticker: 'TD50' },
    { id: 'inst-ma-003', name: 'Risk Parity Fund', ticker: 'RSKP' },
    { id: 'inst-ma-004', name: 'Global Allocation', ticker: 'GLAL' },
    { id: 'inst-ma-005', name: 'Dynamic Income', ticker: 'DINC' },
  ],
}

const bonds: Bond[] = [
  {
    id: 'bond-001',
    name: 'Aurora Transit 2036',
    issuer: 'Aurora Transit Authority',
    rating: 'AA',
    coupon: 3.75,
    maturity: '2036-09-15',
    yieldToMaturity: 4.18,
    duration: 8.4,
    price: 98.62,
    currency: 'USD',
    nextCall: '2031-09-15',
    sector: 'Municipal',
    size: 1200000000,
    lastTraded: '2026-02-11T13:58:00Z',
  },
  {
    id: 'bond-002',
    name: 'Northbridge Health 2031',
    issuer: 'Northbridge Health Group',
    rating: 'BBB',
    coupon: 5.25,
    maturity: '2031-03-01',
    yieldToMaturity: 5.48,
    duration: 4.9,
    price: 101.05,
    currency: 'USD',
    nextCall: null,
    sector: 'Healthcare',
    size: 850000000,
    lastTraded: '2026-02-11T13:52:00Z',
  },
  {
    id: 'bond-003',
    name: 'Solara Grid 2040',
    issuer: 'Solara Power Holdings',
    rating: 'A',
    coupon: 4.4,
    maturity: '2040-11-30',
    yieldToMaturity: 4.86,
    duration: 10.6,
    price: 96.4,
    currency: 'USD',
    nextCall: '2035-11-30',
    sector: 'Utilities',
    size: 1500000000,
    lastTraded: '2026-02-11T14:02:00Z',
  },
  {
    id: 'bond-004',
    name: 'Meridian Ports 2029',
    issuer: 'Meridian Ports & Logistics',
    rating: 'BB',
    coupon: 6.1,
    maturity: '2029-07-15',
    yieldToMaturity: 6.45,
    duration: 3.1,
    price: 99.24,
    currency: 'USD',
    nextCall: null,
    sector: 'Industrials',
    size: 420000000,
    lastTraded: '2026-02-11T13:48:00Z',
  },
  {
    id: 'bond-005',
    name: 'Lumen Fiber 2038',
    issuer: 'Lumen Fiber Networks',
    rating: 'A',
    coupon: 4.95,
    maturity: '2038-05-01',
    yieldToMaturity: 5.12,
    duration: 9.3,
    price: 97.88,
    currency: 'EUR',
    nextCall: '2034-05-01',
    sector: 'Communications',
    size: 960000000,
    lastTraded: '2026-02-11T13:55:00Z',
  },
]

const sectors = Array.from(new Set(stocks.map((stock) => stock.sector)))

const parseNumber = (value: string | null) =>
  value === null || value.trim() === '' ? undefined : Number(value)

export const handlers = [
  http.all('*', async () => {
    await delay(1000)
  }),
  http.get('/api/stocks', ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const sector = url.searchParams.get('sector') ?? 'All'
    const rating = url.searchParams.get('rating') ?? 'All'
    const change = url.searchParams.get('change') ?? 'any'
    const minPrice = parseNumber(url.searchParams.get('minPrice'))
    const maxPrice = parseNumber(url.searchParams.get('maxPrice'))
    const minCap = parseNumber(url.searchParams.get('minCap'))
    const maxCap = parseNumber(url.searchParams.get('maxCap'))

    const filtered = stocks.filter((stock) => {
      if (search) {
        const haystack = `${stock.ticker} ${stock.company}`.toLowerCase()
        if (!haystack.includes(search)) return false
      }

      if (sector !== 'All' && stock.sector !== sector) return false
      if (rating !== 'All' && stock.rating !== rating) return false

      if (change === 'positive' && stock.changePercent <= 0) return false
      if (change === 'negative' && stock.changePercent >= 0) return false

      if (minPrice !== undefined && stock.price < minPrice) return false
      if (maxPrice !== undefined && stock.price > maxPrice) return false

      if (minCap !== undefined && stock.marketCap < minCap) return false
      if (maxCap !== undefined && stock.marketCap > maxCap) return false

      return true
    })

    return HttpResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
        sectors,
      },
    })
  }),
  http.get('/api/bonds', () => {
    const options = bonds.map((bond) => ({
      id: bond.id,
      name: bond.name,
      issuer: bond.issuer,
      rating: bond.rating,
    }))

    return HttpResponse.json({
      data: options,
      meta: { total: options.length },
    })
  }),
  http.get('/api/bonds/:id', ({ params }) => {
    const bond = bonds.find((item) => item.id === params.id)

    if (!bond) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json({ data: bond })
  }),
  http.get('/api/services/brief', () => {
    return HttpResponse.json({ data: serviceBrief })
  }),
  http.get('/api/services/instruments', ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const assetClass = url.searchParams.get('assetClass')
    
    if (!assetClass || !instrumentsByAssetClass[assetClass]) {
      return HttpResponse.json({ data: [] })
    }
    
    return HttpResponse.json({ data: instrumentsByAssetClass[assetClass] })
  }),
]
