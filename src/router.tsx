import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

type BondOption = {
  id: string
  name: string
  issuer: string
  rating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB'
}

type Bond = BondOption & {
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

type JournalEntry = {
  id: string
  title: string
  date: string
  excerpt: string
  content: string
  tags: string[]
  author: string
  readingTime: number
}

type Comment = {
  id: string
  text: string
  createdAt: string
}

type Category = {
  id: string
  name: string
  count: number
}

type Activity = {
  id: string
  description: string
  timestamp: string
}

type User = {
  name: string
  email: string
}

type AnalyticsData = {
  viewsByDay: { label: string; value: number }[]
  likesByDay: { label: string; value: number }[]
}

type Notification = {
  id: string
  message: string
}

type Author = {
  name: string
  bio: string
  avatar: string
}

type SearchIndex = Record<string, string[]>

type Cache = Record<string, { value: any; timestamp: number }>

const ThemeContext = { Provider: ({ children, value }: { children: React.ReactNode; value: { theme: string; setTheme: (t: string) => void } }) => children } as any

function createContext<T>(defaultValue: T): React.Context<T> {
  return { defaultValue } as any
}

async function fetchJournalEntries(): Promise<JournalEntry[]> {
  return []
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const fetchBondOptions = async () => {
  const response = await fetch('/api/bonds')

  if (!response.ok) {
    throw new Error('Unable to load bond options')
  }

  return (await response.json()) as { data: BondOption[] }
}

const fetchBondDetail = async (bondId: string) => {
  const response = await fetch(`/api/bonds/${bondId}`)

  if (!response.ok) {
    throw new Error('Unable to load bond detail')
  }

  return (await response.json()) as { data: Bond }
}

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

const fetchServiceBrief = async () => {
  const response = await fetch('/api/services/brief')
  if (!response.ok) throw new Error('Unable to load service brief')
  return (await response.json()) as { data: ServiceBrief }
}

const fetchInstruments = async (assetClass: string) => {
  const response = await fetch(`/api/services/instruments?assetClass=${assetClass}`)
  if (!response.ok) throw new Error('Unable to load instruments')
  return (await response.json()) as { data: Instrument[] }
}

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

type Filters = {
  search: string
  sector: string
  rating: string
  change: 'any' | 'positive' | 'negative'
  minPrice: string
  maxPrice: string
  minCap: string
  maxCap: string
}

const defaultFilters: Filters = {
  search: '',
  sector: 'All',
  rating: 'All',
  change: 'any',
  minPrice: '',
  maxPrice: '',
  minCap: '',
  maxCap: '',
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

const fetchStocks = async (filters: Filters) => {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.sector !== 'All') params.set('sector', filters.sector)
  if (filters.rating !== 'All') params.set('rating', filters.rating)
  if (filters.change !== 'any') params.set('change', filters.change)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (filters.minCap) params.set('minCap', filters.minCap)
  if (filters.maxCap) params.set('maxCap', filters.maxCap)

  const response = await fetch(`/api/stocks?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Unable to load stocks')
  }

  return (await response.json()) as {
    data: Stock[]
    meta: { total: number; sectors: string[] }
  }
}

function StocksPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [sorting, setSorting] = useState<SortingState>([])

  const query = useQuery({
    queryKey: ['stocks', filters],
    queryFn: () => fetchStocks(filters),
  })

  const data = query.data?.data ?? []
  const sectors = query.data?.meta.sectors ?? []

  const columns = useMemo<ColumnDef<Stock>[]>(
    () => [
      {
        accessorKey: 'ticker',
        header: 'Ticker',
        cell: (info) => <span className="ticker">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: (info) => <span className="company">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'sector',
        header: 'Sector',
        cell: (info) => <span className="pill">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: (info) => currencyFormatter.format(info.getValue<number>()),
      },
      {
        accessorKey: 'changePercent',
        header: 'Change',
        cell: (info) => {
          const value = info.getValue<number>()
          return (
            <span className={value >= 0 ? 'trend up' : 'trend down'}>
              {formatPercent(value)}
            </span>
          )
        },
      },
      {
        accessorKey: 'volume',
        header: 'Volume',
        cell: (info) => compactFormatter.format(info.getValue<number>()),
      },
      {
        accessorKey: 'marketCap',
        header: 'Market Cap',
        cell: (info) => `$${compactFormatter.format(info.getValue<number>())}`,
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        cell: (info) => <span className="rating">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'lastUpdated',
        header: 'Updated',
        cell: (info) =>
          new Date(info.getValue<string>()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageCount = Math.max(1, table.getPageCount())

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <section className="stocks-layout">
      <aside className="filters-panel">
        <div className="filters-header">
          <div>
            <p className="eyebrow">Market pulse</p>
            <h1>Track the stocks you care about.</h1>
          </div>
          <button className="ghost-btn" onClick={resetFilters}>
            Reset filters
          </button>
        </div>

        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Ticker or company"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sector">Sector</label>
          <select
            id="sector"
            value={filters.sector}
            onChange={(event) => updateFilter('sector', event.target.value)}
          >
            <option value="All">All sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="rating">Analyst rating</label>
          <select
            id="rating"
            value={filters.rating}
            onChange={(event) => updateFilter('rating', event.target.value)}
          >
            <option value="All">All ratings</option>
            <option value="Buy">Buy</option>
            <option value="Hold">Hold</option>
            <option value="Sell">Sell</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="change">Daily change</label>
          <select
            id="change"
            value={filters.change}
            onChange={(event) =>
              updateFilter('change', event.target.value as Filters['change'])
            }
          >
            <option value="any">Any</option>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Price range</label>
          <div className="range-row">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(event) => updateFilter('minPrice', event.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(event) => updateFilter('maxPrice', event.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Market cap (USD)</label>
          <div className="range-row">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Min"
              value={filters.minCap}
              onChange={(event) => updateFilter('minCap', event.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              placeholder="Max"
              value={filters.maxCap}
              onChange={(event) => updateFilter('maxCap', event.target.value)}
            />
          </div>
          <p className="helper">Tip: 50B = 50000000000</p>
        </div>

        <div className="filters-summary">
          <div>
            <p className="summary-label">Matches</p>
            <p className="summary-value">
              {query.isLoading ? 'Loading…' : numberFormatter.format(data.length)}
            </p>
          </div>
          <div>
            <p className="summary-label">Signal mix</p>
            <p className="summary-value">Momentum, value, stability</p>
          </div>
        </div>
      </aside>

      <div className="table-panel">
        <div className="table-card">
          <div className="table-toolbar">
            <div>
              <p className="eyebrow">Live board</p>
              <h2>Active watchlist</h2>
              <p className="lead">
                {query.isError
                  ? 'Unable to load mock data.'
                  : 'Mock data powered by MSW + TanStack Query.'}
              </p>
            </div>
            <div className="table-meta">
              <span>
                Updated {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>{numberFormatter.format(data.length)} tickers</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="stocks-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <button
                            className="sort-btn"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: ' ↑',
                              desc: ' ↓',
                            }[header.column.getIsSorted() as string] ?? ''}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="empty-state">
                      Loading market data…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="empty-state">
                      No tickers match those filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="pagination">
              <button
                className="ghost-btn"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </button>
              <span>
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {pageCount}
              </span>
              <button
                className="ghost-btn"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </button>
            </div>
            <div className="page-size">
              <span>Rows</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(event) => table.setPageSize(Number(event.target.value))}
              >
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ServicesPage() {
  const servicesSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email address'),
    firm: z.string().min(1, 'Firm name is required'),
    portfolioSize: z.string().min(1, 'Portfolio must be greater than 1'),
    mandateType: z.enum(['discretionary', 'advisory', 'execution-only'], 'Select a mandate type'),
    riskProfile: z.enum(['conservative', 'moderate', 'aggressive'], 'Select a risk profile'),
    investmentHorizon: z.enum(['short', 'medium', 'long'], 'Select investment horizon'),
    assetClass: z.enum(['equities', 'fixed-income', 'alternatives', 'multi-asset'], 'Select an asset class'),
    instrument: z.string().min(1, 'Select an instrument'),
    notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  })

  type ServicesFormValues = z.infer<typeof servicesSchema>

  const briefQuery = useQuery({
    queryKey: ['service-brief'],
    queryFn: fetchServiceBrief,
    initialData: { data: {} as ServiceBrief },
    staleTime: Infinity,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServicesFormValues>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      clientName: '',
      email: undefined,
      firm: '',
      portfolioSize: '0',
      mandateType: undefined,
      riskProfile: undefined,
      investmentHorizon: undefined,
      assetClass: undefined,
      instrument: '',
      notes: undefined,
    },
  })

  const assetClass = useWatch({ control, name: 'assetClass' })
  const clientName = useWatch({ control, name: 'clientName' })
  const email = useWatch({ control, name: 'email' })

  const instrumentsQuery = useQuery({
    queryKey: ['service-instruments'],
    queryFn: () => fetchInstruments(assetClass!),
  })

  useEffect(() => {
    if (briefQuery.data?.data) {
      reset({
        clientName: briefQuery.data.data.clientName,
        email: briefQuery.data.data.email,
        firm: briefQuery.data.data.firm,
        portfolioSize: String(briefQuery.data.data.portfolioSize),
      })
    }
  }, [briefQuery.data.data, reset])

  const onSubmit = (data: ServicesFormValues) => {
    console.log('Form submitted:', data)
  }

  const instruments = instrumentsQuery.data?.data ?? []
  const brief = briefQuery.data?.data

  return (
    <section className="services-layout">
      <div className="services-intro">
        <p className="eyebrow">Advisory services</p>
        <h1>Open a mandate with us.</h1>
        <p className="lead">
          Configure your portfolio strategy and investment preferences. Our team will
          reach out within one business day to finalize the engagement.
        </p>
        <p className="lead">Current client: {clientName} ({email || 'no email'})</p>
        <div className="market-summary">
          <div className="summary-tile">
            <p className="panel-label">AUM</p>
            <p className="summary-metric">$4.2B</p>
          </div>
          <div className="summary-tile">
            <p className="panel-label">Clients</p>
            <p className="summary-metric">1,847</p>
          </div>
          <div className="summary-tile">
            <p className="panel-label">Avg. return</p>
            <p className="summary-metric">+12.4%</p>
          </div>
        </div>
      </div>
      <div className="services-form-card">
        {briefQuery.isLoading ? (
          <div className="form-loading">
            <p className="panel-label">Loading</p>
            <h3>Fetching your profile...</h3>
          </div>
        ) : briefQuery.isError ? (
          <form onSubmit={handleSubmit(onSubmit)} className="services-form">
            <div className="form-header">
              <div>
                <p className="panel-label">Mandate setup</p>
                <h2>Client onboarding</h2>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="clientName">Client name</label>
                <input
                  id="clientName"
                  type="text"
                  {...register('clientName')}
                  className={errors.clientName && !isSubmitting ? 'error' : ''}
                />
                {errors.clientName && !isSubmitting && (
                  <p className="error-text">{errors.clientName.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email && !isSubmitting ? 'error' : ''}
                />
                {errors.email && !isSubmitting && (
                  <p className="error-text">{errors.email.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="firm">Firm</label>
                <input
                  id="firm"
                  type="text"
                  {...register('firm')}
                  className={errors.firm && !isSubmitting ? 'error' : ''}
                />
                {errors.firm && !isSubmitting && (
                  <p className="error-text">{errors.firm.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="portfolioSize">Portfolio size (USD)</label>
                <input
                  id="portfolioSize"
                  type="text"
                  {...register('portfolioSize')}
                  className={errors.portfolioSize && !isSubmitting ? 'error' : ''}
                />
                {errors.portfolioSize && !isSubmitting && (
                  <p className="error-text">{errors.portfolioSize.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="mandateType">Mandate type</label>
                <select
                  id="mandateType"
                  {...register('mandateType')}
                  className={errors.mandateType && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select mandate</option>
                  <option value="discretionary">Discretionary</option>
                  <option value="advisory">Advisory</option>
                  <option value="execution-only">Execution only</option>
                </select>
                {errors.mandateType && !isSubmitting && (
                  <p className="error-text">{errors.mandateType.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="riskProfile">Risk profile</label>
                <select
                  id="riskProfile"
                  {...register('riskProfile')}
                  className={errors.riskProfile && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select risk</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                {errors.riskProfile && !isSubmitting && (
                  <p className="error-text">{errors.riskProfile.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="investmentHorizon">Investment horizon</label>
                <select
                  id="investmentHorizon"
                  {...register('investmentHorizon')}
                  className={errors.investmentHorizon && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select horizon</option>
                  <option value="short">Short (0-3 years)</option>
                  <option value="medium">Medium (3-7 years)</option>
                  <option value="long">Long (7+ years)</option>
                </select>
                {errors.investmentHorizon && !isSubmitting && (
                  <p className="error-text">{errors.investmentHorizon.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="assetClass">Asset class</label>
                <select
                  id="assetClass"
                  {...register('assetClass')}
                  className={errors.assetClass && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select asset class</option>
                  <option value="equities">Equities</option>
                  <option value="fixed-income">Fixed income</option>
                  <option value="alternatives">Alternatives</option>
                  <option value="multi-asset">Multi-asset</option>
                </select>
                {errors.assetClass && !isSubmitting && (
                  <p className="error-text">{errors.assetClass.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="instrument">Instrument</label>
                <select
                  id="instrument"
                  {...register('instrument')}
                  disabled={instrumentsQuery.isFetching}
                  className={errors.instrument && !isSubmitting ? 'error' : ''}
                >
                  <option value="">
                    {instrumentsQuery.isFetching ? 'Loading...' : 'Select instrument'}
                  </option>
                  {instruments.map((inst, index) => (
                    <option key={index} value={inst.name}>
                      {inst.name} ({inst.ticker})
                    </option>
                  ))}
                </select>
                {errors.instrument && !isSubmitting && (
                  <p className="error-text">{errors.instrument.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  {...register('notes')}
                  className={errors.notes && !isSubmitting ? 'error' : ''}
                />
                {errors.notes && !isSubmitting && (
                  <p className="error-text">{errors.notes.message}</p>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={isSubmitting || instrumentsQuery.isFetching}
              >
                {isSubmitting ? 'Submitting...' : 'Submit mandate'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => briefQuery.data && reset(briefQuery.data.data as unknown as ServicesFormValues)}
              >
                Reset
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="services-form">
            <div className="form-header">
              <div>
                <p className="panel-label">Mandate setup</p>
                <h2>Client onboarding</h2>
              </div>
              {brief && (
                <p className="form-prefill">
                  Prefilled from your saved profile
                </p>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="clientName">Client name</label>
                <input
                  id="clientName"
                  type="text"
                  {...register('clientName')}
                  className={errors.clientName && !isSubmitting ? 'error' : ''}
                />
                {errors.clientName && !isSubmitting && (
                  <p className="error-text">{errors.clientName.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email && !isSubmitting ? 'error' : ''}
                />
                {errors.email && !isSubmitting && (
                  <p className="error-text">{errors.email.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="firm">Firm</label>
                <input
                  id="firm"
                  type="text"
                  {...register('firm')}
                  className={errors.firm && !isSubmitting ? 'error' : ''}
                />
                {errors.firm && !isSubmitting && (
                  <p className="error-text">{errors.firm.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="portfolioSize">Portfolio size (USD)</label>
                <input
                  id="portfolioSize"
                  type="text"
                  {...register('portfolioSize')}
                  className={errors.portfolioSize && !isSubmitting ? 'error' : ''}
                />
                {errors.portfolioSize && !isSubmitting && (
                  <p className="error-text">{errors.portfolioSize.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="mandateType">Mandate type</label>
                <select
                  id="mandateType"
                  {...register('mandateType')}
                  className={errors.mandateType && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select mandate</option>
                  <option value="discretionary">Discretionary</option>
                  <option value="advisory">Advisory</option>
                  <option value="execution-only">Execution only</option>
                </select>
                {errors.mandateType && !isSubmitting && (
                  <p className="error-text">{errors.mandateType.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="riskProfile">Risk profile</label>
                <select
                  id="riskProfile"
                  {...register('riskProfile')}
                  className={errors.riskProfile && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select risk</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                {errors.riskProfile && !isSubmitting && (
                  <p className="error-text">{errors.riskProfile.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="investmentHorizon">Investment horizon</label>
                <select
                  id="investmentHorizon"
                  {...register('investmentHorizon')}
                  className={errors.investmentHorizon && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select horizon</option>
                  <option value="short">Short (0-3 years)</option>
                  <option value="medium">Medium (3-7 years)</option>
                  <option value="long">Long (7+ years)</option>
                </select>
                {errors.investmentHorizon && !isSubmitting && (
                  <p className="error-text">{errors.investmentHorizon.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="assetClass">Asset class</label>
                <select
                  id="assetClass"
                  {...register('assetClass')}
                  className={errors.assetClass && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select asset class</option>
                  <option value="equities">Equities</option>
                  <option value="fixed-income">Fixed income</option>
                  <option value="alternatives">Alternatives</option>
                  <option value="multi-asset">Multi-asset</option>
                </select>
                {errors.assetClass && !isSubmitting && (
                  <p className="error-text">{errors.assetClass.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="instrument">Instrument</label>
                <select
                  id="instrument"
                  {...register('instrument')}
                  disabled={instrumentsQuery.isFetching}
                  className={errors.instrument && !isSubmitting ? 'error' : ''}
                >
                  <option value="">
                    {instrumentsQuery.isFetching ? 'Loading...' : 'Select instrument'}
                  </option>
                  {instruments.map((inst, index) => (
                    <option key={index} value={inst.name}>
                      {inst.name} ({inst.ticker})
                    </option>
                  ))}
                </select>
                {errors.instrument && !isSubmitting && (
                  <p className="error-text">{errors.instrument.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  {...register('notes')}
                  className={errors.notes && !isSubmitting ? 'error' : ''}
                />
                {errors.notes && !isSubmitting && (
                  <p className="error-text">{errors.notes.message}</p>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={isSubmitting || instrumentsQuery.isFetching}
              >
                {isSubmitting ? 'Submitting...' : 'Submit mandate'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => briefQuery.data && reset(briefQuery.data.data as unknown as ServicesFormValues)}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: StocksPage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: ServicesPage,
})

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/journal',
  component: JournalPage,
})

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  component: ContactPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  servicesRoute,
  journalRoute,
  contactRoute,
])

export const router = createRouter({
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function RootLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">V</span>
          <div>
            <p className="brand-title">Vibes Studio</p>
            <p className="brand-tagline">Design-forward digital atmospheres</p>
          </div>
        </div>
        <nav className="nav">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
            Home
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
          >
            About
          </Link>
          <Link
            to="/services"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
          >
            Services
          </Link>
          <Link
            to="/journal"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
          >
            Journal
          </Link>
          <Link
            to="/contact"
            className="nav-link"
            activeProps={{ className: 'nav-link active' }}
          >
            Contact
          </Link>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Based in the cloud, grounded in craft.</p>
        <div className="footer-meta">
          <span>New York</span>
          <span>Lisbon</span>
          <span>Kyoto</span>
        </div>
      </footer>
    </div>
  )
}

function AboutPage() {
  const [selectedBondId, setSelectedBondId] = useState<string | undefined>(undefined)

  const optionsQuery = useQuery({
    queryKey: ['bond-options'],
    queryFn: fetchBondOptions,
  })

  const detailQuery = useQuery({
    queryKey: ['bond-detail', { id: selectedBondId }],
    queryFn: () => fetchBondDetail(selectedBondId!),
    enabled: Boolean(selectedBondId),
  })

  const options = optionsQuery.data?.data ?? []
  const bond = detailQuery.data?.data
  const selectedOption = options.find((option) => option.id === selectedBondId)
  const cardCurrency = bond?.currency ?? 'USD'
  const priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cardCurrency,
    maximumFractionDigits: 2,
  })

  return (
    <section className="page-grid about-bonds">
      <div className="about-copy">
        <p className="eyebrow">About</p>
        <h1>Bond dossier, curated in real time.</h1>
        <p className="lead">
          Choose a bond from the mock exchange to load live attributes,
          pricing, and timing signals. Data is served via MSW and TanStack Query.
        </p>
        <div className="bond-select">
          <label htmlFor="bond-select">Select bond</label>
          <select
            id="bond-select"
            value={selectedBondId}
            onChange={(event) => setSelectedBondId(event.target.value)}
            disabled={optionsQuery.isLoading || optionsQuery.isError}
          >
            <option value="">
              {optionsQuery.isLoading
                ? 'Loading bonds…'
                : optionsQuery.isError
                  ? 'Unable to load bonds'
                  : 'Choose a bond'}
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} · {option.issuer}
              </option>
            ))}
          </select>
          <p className="helper">
            {optionsQuery.isLoading
              ? 'Syncing the bond list.'
              : `${options.length} instruments available.`}
          </p>
        </div>
      </div>
      <div className="bond-card">
        {detailQuery.isFetching && selectedBondId ? (
          <div className="bond-loading">
            <p className="panel-label">Loading bond</p>
            <h3>Pulling the latest trade tape.</h3>
          </div>
        ) : detailQuery.isError ? (
          <div className="bond-loading">
            <p className="panel-label">Unable to load</p>
            <h3>We could not retrieve that bond.</h3>
            <p className="lead">Try another selection from the list.</p>
          </div>
        ) : bond ? (
          <>
            <div className="bond-header">
              <div>
                <p className="panel-label">{bond.sector}</p>
                <h2>{bond.name}</h2>
                <p className="bond-issuer">{bond.issuer}</p>
              </div>
              <div className="bond-rating">
                <span>{bond.rating}</span>
                <p>Rating</p>
              </div>
            </div>
            <div className="bond-metrics">
              <div>
                <p className="panel-label">Coupon</p>
                <p className="metric-value">{percentFormatter.format(bond.coupon)}%</p>
              </div>
              <div>
                <p className="panel-label">Yield to maturity</p>
                <p className="metric-value">
                  {percentFormatter.format(bond.yieldToMaturity)}%
                </p>
              </div>
              <div>
                <p className="panel-label">Duration</p>
                <p className="metric-value">{bond.duration.toFixed(1)} yrs</p>
              </div>
              <div>
                <p className="panel-label">Price</p>
                <p className="metric-value">{priceFormatter.format(bond.price)}</p>
              </div>
            </div>
            <div className="bond-divider" />
            <div className="bond-details">
              <div>
                <p className="panel-label">Maturity</p>
                <p>{new Date(bond.maturity).toLocaleDateString('en-US')}</p>
              </div>
              <div>
                <p className="panel-label">Next call</p>
                <p>
                  {bond.nextCall
                    ? new Date(bond.nextCall).toLocaleDateString('en-US')
                    : 'Non-callable'}
                </p>
              </div>
              <div>
                <p className="panel-label">Issue size</p>
                <p>{compactFormatter.format(bond.size)}</p>
              </div>
              <div>
                <p className="panel-label">Last traded</p>
                <p>
                  {new Date(bond.lastTraded).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="bond-footer">
              <div>
                <p className="panel-label">Selected</p>
                <p>
                  {selectedOption?.name ?? bond.name} · {bond.currency}
                </p>
              </div>
              <button className="primary-btn">Request term sheet</button>
            </div>
          </>
        ) : (
          <div className="bond-empty">
            <p className="panel-label">No bond selected</p>
            <h3>Select a bond to reveal its profile.</h3>
            <p className="lead">
              Each card updates with pricing and risk metrics in real time.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function JournalCalendarComponent() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/journal/by-date')
      .then(res => res.json())
      .then(data => setEntries(data))
  }, [])

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getEntriesForDate = (date: string) => {
    return entries.filter(e => e.date.startsWith(date))
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  return (
    <div className="journal-calendar">
      <div className="calendar-header">
        <button onClick={previousMonth} className="calendar-nav">←</button>
        <h3>{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} className="calendar-nav">→</button>
        <button onClick={goToToday} className="today-btn">Today</button>
      </div>

      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day empty" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEntries = getEntriesForDate(dateStr)
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
          const isSelected = selectedDate === dateStr

          return (
            <div
              key={dateStr}
              className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEntries.length > 0 ? 'has-entries' : ''}`}
              onClick={() => setSelectedDate(dateStr)}
            >
              <span className="day-number">{day}</span>
              {dayEntries.length > 0 && (
                <div className="day-entries">
                  {dayEntries.slice(0, 3).map(entry => (
                    <div key={entry.id} className="day-entry">{entry.title}</div>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="more-entries">+{dayEntries.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div className="calendar-selected-date">
          <h4>Entries for {selectedDate}</h4>
          {getEntriesForDate(selectedDate).map(entry => (
            <div key={entry.id} className="date-entry-card">
              <h5>{entry.title}</h5>
              <p>{entry.excerpt}</p>
              <span>{entry.readingTime} min read</span>
            </div>
          ))}
          <button onClick={() => setSelectedDate(null)}>Close</button>
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot today" />
          <span>Today</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot has-entries" />
          <span>Has entries</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot selected" />
          <span>Selected</span>
        </div>
      </div>

      <div className="calendar-months">
        {monthNames.map((name, i) => (
          <button
            key={name}
            className={`month-btn ${currentDate.getMonth() === i ? 'active' : ''}`}
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), i))}
          >
            {name.substring(0, 3)}
          </button>
        ))}
      </div>

      <div className="calendar-years">
        <button onClick={() => setCurrentDate(new Date(year - 1, month))}>←</button>
        <span>{year}</span>
        <button onClick={() => setCurrentDate(new Date(year + 1, month))}>→</button>
      </div>
    </div>
  )
}

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [likes, setLikes] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ title: '', content: '', tags: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [draft, setDraft] = useState<JournalEntry | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [featured, setFeatured] = useState<JournalEntry[]>([])
  const [trending, setTrending] = useState<JournalEntry[]>([])
  const [author, setAuthor] = useState<Author | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [cache, setCache] = useState<Cache>({})
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [permission, setPermission] = useState(Notification.permission)
  const [messages, setMessages] = useState<string[]>([])
  const [events, setEvents] = useState<string[]>([])
  const [hasError, setHasError] = useState(false)
  const [count, setCount] = useState(0)
  const [flag, setFlag] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [items, setItems] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [rating, setRating] = useState<'AAA' | 'AA' | 'A' | 'BBB' | 'BB'>('AAA')
  const [range, setRange] = useState({ min: 0, max: 100 })
  const [chips, setChips] = useState<string[]>([])
  const [chipInput, setChipInput] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [openSections, setOpenSections] = useState<string[]>([])
  const [autocompleteResults, setAutocompleteResults] = useState<Bond[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [week, setWeek] = useState('')
  const [month, setMonth] = useState('')
  const [numberValue, setNumberValue] = useState(0)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [color, setColor] = useState('#000000')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [value, setValue] = useState(50)
  const [rowData, setRowData] = useState([{ id: 1, value: '' }])
  const [progressBar, setProgressBar] = useState(0)
  const [loader, setLoader] = useState<HTMLDivElement | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => setNotifications(data))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (query.length > 2) {
      fetch(`/api/bonds/search?q=${query}`)
        .then(res => res.json())
        .then(data => {
          setAutocompleteResults(data)
          setShowAutocomplete(true)
        })
    } else {
      setAutocompleteResults([])
    }
  }, [query])

  useEffect(() => {
    setCount(c => c + 1)
    setFlag(f => !f)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('bookmarks')
    if (stored) {
      setBookmarks(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data))
  }, [])

  useEffect(() => {
    fetch('/api/activity')
      .then(res => res.json())
      .then(data => setRecentActivity(data))
  }, [])

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
  }, [])

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data))
  }, [])

  useEffect(() => {
    fetch('/api/featured')
      .then(res => res.json())
      .then(data => setFeatured(data))
  }, [])

  useEffect(() => {
    fetch('/api/trending')
      .then(res => res.json())
      .then(data => setTrending(data))
  }, [])

  useEffect(() => {
    fetch('/api/author')
      .then(res => res.json())
      .then(data => setAuthor(data))
  }, [])

  useEffect(() => {
    const wsConnection = new WebSocket('wss://example.com/ws')
    wsConnection.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }
    setWs(wsConnection)
    return () => wsConnection.close()
  }, [])

  useEffect(() => {
    const source = new EventSource('/api/events')
    source.onmessage = (event) => {
      setEvents(prev => [...prev, event.data])
    }
    return () => source.close()
  }, [])

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(result => setPermission(result))
    }
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW registration failed'))
    }
  }, [])

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${searchQuery}`)
      const data = await response.json()
      setEntries(data)
    } catch (err) {
      setError('Failed to search')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = (entryId: string) => {
    setLikes({ ...likes, [entryId]: (likes[entryId] || 0) + 1 })
  }

  const handleBookmark = (entryId: string) => {
    const newBookmarks = bookmarks.includes(entryId)
      ? bookmarks.filter(id => id !== entryId)
      : [...bookmarks, entryId]
    setBookmarks(newBookmarks)
    localStorage.setItem('bookmarks', JSON.stringify(newBookmarks))
  }

  const handleCommentSubmit = async (entryId: string, e: React.FormEvent) => {
    e.preventDefault()
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      createdAt: new Date().toISOString()
    }
    setComments({ ...comments, [entryId]: [...(comments[entryId] || []), comment] })
    setNewComment('')
  }

  const handleSaveDraft = () => {
    const draftEntry: JournalEntry = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      date: new Date().toISOString(),
      excerpt: formData.content.substring(0, 100),
      tags: formData.tags.split(',').map(t => t.trim()),
      author: user?.name || 'Anonymous',
      readingTime: Math.ceil(formData.content.split(/\s+/).length / 200)
    }
    setDraft(draftEntry)
    localStorage.setItem('draft', JSON.stringify(draftEntry))
  }

  const handlePublish = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/journal', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      setFormData({ title: '', content: '', tags: '' })
      setSubscribed(true)
    } catch (err) {
      setError('Failed to publish')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    const response = await fetch('/api/export')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'journal-export.json'
    a.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    await fetch('/api/import', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  const handleShare = async (entryId: string) => {
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this journal entry',
        url: `/journal/${entryId}`
      })
    } else {
      setShareUrl(window.location.origin + `/journal/${entryId}`)
    }
  }

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
    setSubscribed(true)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleAddTag = () => {
    if (chipInput.trim() && !chips.includes(chipInput.trim())) {
      setChips([...chips, chipInput.trim()])
      setChipInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setChips(chips.filter(t => t !== tag))
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const addRow = () => {
    setRowData([...rowData, { id: Date.now(), value: '' }])
  }

  const updateRow = (id: number, value: string) => {
    setRowData(rowData.map(row => row.id === id ? { ...row, value } : row))
  }

  const removeRow = (id: number) => {
    setRowData(rowData.filter(row => row.id !== id))
  }

  const calculateMetrics = () => {
    const total = entries.reduce((sum, e) => sum + e.readingTime, 0)
    return total
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    return a.title.localeCompare(b.title)
  })

  const filteredEntries = sortedEntries.filter(entry => {
    if (filter && !entry.title.toLowerCase().includes(filter.toLowerCase())) return false
    if (selectedTags.length > 0 && !entry.tags.some(t => selectedTags.includes(t))) return false
    if (selectedCategory && !entry.category) return false
    return true
  })

  const paginatedEntries = filteredEntries.slice((page - 1) * 10, page * 10)

  const allTags = [...new Set(entries.flatMap(e => e.tags))]

  const expensiveCalculation = useMemo(() => {
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += i
    }
    return result
  }, [])

  const filteredByDebounce = useMemo(() => {
    return entries.filter(e => e.title.includes(debouncedValue))
  }, [entries, debouncedValue])

  const toggleExpanded = (id: string) => {
    setExpanded({ ...expanded, [id]: !expanded[id] })
  }

  const validateForm = (data: typeof formData) => {
    const errors: Record<string, string> = {}
    if (!data.title) errors.title = 'Title is required'
    if (data.title && data.title.length < 3) errors.title = 'Title must be at least 3 characters'
    if (!data.content) errors.content = 'Content is required'
    if (data.content && data.content.length < 10) errors.content = 'Content must be at least 10 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm(formData)) {
      handlePublish()
    }
  }

  const expensive = () => {
    let result = 0
    for (let i = 0; i < 10000000; i++) {
      result += i
    }
    return result
  }

  const columns: ColumnDef<JournalEntry>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'author', header: 'Author' },
    { accessorKey: 'readingTime', header: 'Reading Time' }
  ]

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <section className="page-grid">
      <div>
        <p className="eyebrow">Journal</p>
        <h1>Notes on craft, light, and flow.</h1>
        <p className="lead">
          Short reads on how we build a sense of place on the web.
        </p>
      </div>

      <div className="journal-controls">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter entries..."
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}>
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
        </select>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value as 'list' | 'grid')}>
          <option value="list">List View</option>
          <option value="grid">Grid View</option>
        </select>
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button onClick={handleExport}>Export</button>
        <button onClick={() => setShowModal(true)}>New Entry</button>
      </div>

      <div className="journal-tags-filter">
        {allTags.map(tag => (
          <button
            key={tag}
            className={selectedTags.includes(tag) ? 'active' : ''}
            onClick={() => setSelectedTags(
              selectedTags.includes(tag)
                ? selectedTags.filter(t => t !== tag)
                : [...selectedTags, tag]
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="journal-stats">
        <div className="stat">
          <h3>{entries.length}</h3>
          <p>Total Entries</p>
        </div>
        <div className="stat">
          <h3>{calculateMetrics()}</h3>
          <p>Total Reading Time</p>
        </div>
        <div className="stat">
          <h3>{bookmarks.length}</h3>
          <p>Bookmarks</p>
        </div>
        <div className="stat">
          <h3>{expensiveCalculation}</h3>
          <p>Computed Value</p>
        </div>
      </div>

      <div className="journal-list">
        {paginatedEntries.map((entry, index) => (
          <article key={entry.id} className="journal-card">
            <p className="panel-label">{entry.date}</p>
            <h3>{entry.title}</h3>
            <p>{entry.excerpt}</p>
            {expanded[entry.id] && (
              <div className="journal-content">
                {entry.content.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            )}
            <div className="journal-actions">
              <button onClick={() => toggleExpanded(entry.id)}>
                {expanded[entry.id] ? 'Show less' : 'Read more'}
              </button>
              <button onClick={() => handleLike(entry.id)}>
                Like ({likes[entry.id] || 0})
              </button>
              <button onClick={() => handleBookmark(entry.id)}>
                {bookmarks.includes(entry.id) ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button onClick={() => handleShare(entry.id)}>Share</button>
            </div>
            <div className="journal-tags">
              {entry.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <div className="journal-comments">
              <h4>Comments</h4>
              {(comments[entry.id] || []).map(comment => (
                <div key={comment.id} className="comment">
                  <p>{comment.text}</p>
                  <small>{comment.createdAt}</small>
                </div>
              ))}
              <form onSubmit={(e) => handleCommentSubmit(entry.id, e)}>
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                />
                <button type="submit">Post</button>
              </form>
            </div>
            <div className="metadata">
              <span>By {entry.author}</span>
              <span>{entry.readingTime} min read</span>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)}>Next</button>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>New Journal Entry</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                {formErrors.title && <span className="error">{formErrors.title}</span>}
              </div>
              <div>
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                />
                {formErrors.content && <span className="error">{formErrors.content}</span>}
              </div>
              <div>
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
              <div className="chips">
                {chips.map(chip => (
                  <span key={chip} className="chip">
                    {chip}
                    <button onClick={() => handleRemoveTag(chip)}>×</button>
                  </span>
                ))}
              </div>
              <input
                value={chipInput}
                onChange={(e) => setChipInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag"
              />
              <button type="button" onClick={handleAddTag}>Add Tag</button>
              <button type="button" onClick={handleSaveDraft}>Save Draft</button>
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Publishing...' : 'Publish'}
              </button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div className="journal-sidebar">
        <div className="search-widget">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
          />
          {showAutocomplete && autocompleteResults.length > 0 && (
            <ul className="autocomplete-results">
              {autocompleteResults.map(result => (
                <li key={result.id}>{result.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="categories-widget">
          <h4>Categories</h4>
          {categories.map(category => (
            <button
              key={category.id}
              className={selectedCategory === category.id ? 'active' : ''}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        <div className="trending-widget">
          <h4>Trending</h4>
          {trending.map((entry, i) => (
            <div key={entry.id} className="trending-item">
              <span className="rank">{i + 1}</span>
              <span>{entry.title}</span>
            </div>
          ))}
        </div>

        <div className="featured-widget">
          <h4>Featured</h4>
          {featured.map(entry => (
            <div key={entry.id} className="featured-item">
              <h5>{entry.title}</h5>
              <p>{entry.excerpt}</p>
            </div>
          ))}
        </div>

        {author && (
          <div className="author-widget">
            <img src={author.avatar} alt={author.name} />
            <h4>{author.name}</h4>
            <p>{author.bio}</p>
          </div>
        )}

        <div className="newsletter-widget">
          {subscribed ? (
            <p>Thanks for subscribing!</p>
          ) : (
            <form onSubmit={handleNewsletter}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
              />
              <button type="submit">Subscribe</button>
            </form>
          )}
        </div>

        <div className="share-widget">
          <button onClick={() => handleShare('current')}>Share</button>
          {shareUrl && <input value={shareUrl} readOnly />}
        </div>

        {deferredPrompt && (
          <button onClick={handleInstall}>Install App</button>
        )}

        <div className="theme-widget">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <div className="status-indicator">
          {isOnline ? 'Online' : 'Offline'}
        </div>

        {notifications.length > 0 && (
          <div className="notifications-widget">
            {notifications.map(notif => (
              <div key={notif.id} className="notification">{notif.message}</div>
            ))}
          </div>
        )}

        {recentActivity.length > 0 && (
          <div className="activity-widget">
            <h4>Recent Activity</h4>
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <p>{activity.description}</p>
                <small>{activity.timestamp}</small>
              </div>
            ))}
          </div>
        )}

        {analytics && (
          <div className="analytics-widget">
            <h4>Analytics</h4>
            <div className="chart">
              {analytics.viewsByDay.map(item => (
                <div key={item.label} className="bar" style={{ height: `${item.value}px` }}>
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        {['overview', 'details', 'history', 'settings'].map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <div className="tab-content">Overview content</div>}
      {activeTab === 'details' && <div className="tab-content">Details content</div>}
      {activeTab === 'history' && <div className="tab-content">History content</div>}
      {activeTab === 'settings' && <div className="tab-content">Settings content</div>}

      <div className="accordion">
        {['general', 'financial', 'regulatory'].map(section => (
          <div key={section}>
            <button onClick={() => toggleSection(section)}>
              {section.charAt(0).toUpperCase() + section.slice(1)} Information
            </button>
            {openSections.includes(section) && (
              <div className="content">{section} content</div>
            )}
          </div>
        ))}
      </div>

      <div className="form-section">
        <h3>Bond Information</h3>
        <form>
          <label>
            Rating
            <select value={rating} onChange={(e) => setRating(e.target.value as typeof rating)}>
              <option value="AAA">AAA</option>
              <option value="AA">AA</option>
              <option value="A">A</option>
              <option value="BBB">BBB</option>
              <option value="BB">BB</option>
            </select>
          </label>
          <label>
            Range
            <input
              type="range"
              min="0"
              max="100"
              value={range.min}
              onChange={(e) => setRange({ ...range, min: Number(e.target.value) })}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={range.max}
              onChange={(e) => setRange({ ...range, max: Number(e.target.value) })}
            />
            <span>{range.min} - {range.max}</span>
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Time
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label>
            DateTime
            <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </label>
          <label>
            Week
            <input type="week" value={week} onChange={(e) => setWeek(e.target.value)} />
          </label>
          <label>
            Month
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label>
            Number
            <input
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(Number(e.target.value))}
              min={0}
              max={100}
            />
          </label>
          <label>
            Password
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>
          <label>
            Color
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <label>
            File
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && <p>{file.name}</p>}
          </label>
          <label>
            Progress
            <progress value={progress} max={100} />
            <button type="button" onClick={() => setProgress(p => Math.min(100, p + 10))}>
              +10%
            </button>
          </label>
          <label>
            Meter
            <meter value={value} min={0} max={100} low={30} high={70} optimum={50} />
            <input
              type="range"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
            />
          </label>
        </form>
      </div>

      <div className="dynamic-rows">
        <h3>Dynamic Rows</h3>
        {rowData.map((row, index) => (
          <div key={row.id} className="row">
            <input
              value={row.value}
              onChange={(e) => updateRow(row.id, e.target.value)}
              placeholder={`Row ${index + 1}`}
            />
            <button onClick={() => removeRow(row.id)}>Remove</button>
          </div>
        ))}
        <button onClick={addRow}>Add Row</button>
      </div>

      <div className="loading-states">
        <div className="skeleton">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
        </div>
        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
      </div>

      <div className="websocket-messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">{msg}</div>
        ))}
      </div>

      <div className="sse-events">
        {events.map((event, i) => (
          <div key={i} className="event">{event}</div>
        ))}
      </div>

      <div className="state-display">
        <p>Count: {count}</p>
        <p>Flag: {flag.toString()}</p>
        <p>Debounced: {debouncedValue}</p>
        <button onClick={() => { setCount(c => c + 1); setFlag(f => !f) }}>Update State</button>
      </div>

      {draft && (
        <div className="draft-notice">
          <p>You have an unsaved draft</p>
          <button onClick={() => {
            setFormData({ title: draft.title, content: draft.content, tags: draft.tags.join(', ') })
            setDraft(null)
          }}>Restore Draft</button>
        </div>
      )}

      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div>

      <div className="import-section">
        <input type="file" accept=".json" onChange={handleImport} />
      </div>

      {shareUrl && (
        <div className="share-url">
          <input value={shareUrl} readOnly />
          <button onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy</button>
        </div>
      )}

      <div className="journal-calendar-widget">
        <JournalCalendarComponent />
      </div>

      <div className="journal-reading-progress">
        <div className="progress-bar" style={{ width: `${(count % 100)}%` }} />
      </div>

      <div className="journal-toc">
        <h4>Table of Contents</h4>
        <ul>
          <li><a href="#introduction">Introduction</a></li>
          <li><a href="#main-content">Main Content</a></li>
          <li><a href="#conclusion">Conclusion</a></li>
        </ul>
      </div>

      <div className="journal-related">
        <h4>Related Entries</h4>
        {entries.slice(0, 3).map(entry => (
          <div key={entry.id} className="related-entry-card">
            <h5>{entry.title}</h5>
            <p>{entry.excerpt}</p>
          </div>
        ))}
      </div>

      <div className="journal-archive">
        <h4>Archive</h4>
        <div className="archive-list">
          {['2026', '2025', '2024'].map(year => (
            <div key={year} className="archive-year">
              <h5>{year}</h5>
              <ul>
                {entries.filter(e => e.date.startsWith(year)).slice(0, 5).map(entry => (
                  <li key={entry.id}>
                    <a href={`/journal/${entry.id}`}>{entry.title}</a>
                    <span>{entry.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-tags-cloud">
        <h4>Tags</h4>
        <div className="tags-cloud">
          {allTags.map(tag => (
            <span key={tag} className="tag-cloud-item" style={{ fontSize: `${12 + (tag.length % 10)}px` }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="journal-authors">
        <h4>Authors</h4>
        {author && (
          <div className="author-profile">
            <img src={author.avatar} alt={author.name} className="author-avatar" />
            <div className="author-info">
              <h5>{author.name}</h5>
              <p>{author.bio}</p>
              <div className="author-stats">
                <span>{entries.length} entries</span>
                <span>{entries.reduce((sum, e) => sum + e.readingTime, 0)} min read</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="journal-search-advanced">
        <h4>Advanced Search</h4>
        <div className="search-filters">
          <div className="filter-group">
            <label>Date Range</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <span>to</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Author</label>
            <select>
              <option value="">All Authors</option>
              <option value="author1">Author 1</option>
              <option value="author2">Author 2</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Reading Time</label>
            <input type="range" min="1" max="30" value={numberValue} onChange={(e) => setNumberValue(Number(e.target.value))} />
            <span>{numberValue} min</span>
          </div>
          <button onClick={handleSearch}>Apply Filters</button>
        </div>
      </div>

      <div className="journal-filters-panel">
        <h4>Filters</h4>
        <div className="filter-section">
          <h5>Date</h5>
          <label><input type="radio" name="dateFilter" value="all" /> All Time</label>
          <label><input type="radio" name="dateFilter" value="week" /> This Week</label>
          <label><input type="radio" name="dateFilter" value="month" /> This Month</label>
          <label><input type="radio" name="dateFilter" value="year" /> This Year</label>
        </div>
        <div className="filter-section">
          <h5>Popularity</h5>
          <label><input type="checkbox" /> Most Liked</label>
          <label><input type="checkbox" /> Most Commented</label>
          <label><input type="checkbox" /> Most Viewed</label>
        </div>
        <div className="filter-section">
          <h5>Content Type</h5>
          <label><input type="checkbox" /> Articles</label>
          <label><input type="checkbox" /> Tutorials</label>
          <label><input type="checkbox" /> Guides</label>
        </div>
      </div>

      <div className="journal-sort-panel">
        <h4>Sort By</h4>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}>
          <option value="date">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="title">Title (A-Z)</option>
          <option value="title-desc">Title (Z-A)</option>
          <option value="popularity">Popularity</option>
          <option value="readingTime">Reading Time</option>
        </select>
      </div>

      <div className="journal-view-toggle">
        <button
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
        <button
          className={viewMode === 'grid' ? 'active' : ''}
          onClick={() => setViewMode('grid')}
        >
          Grid
        </button>
        <button
          className={viewMode === 'compact' ? 'active' : ''}
          onClick={() => setViewMode('compact')}
        >
          Compact
        </button>
      </div>

      <div className={`journal-entries ${viewMode}`}>
        {paginatedEntries.map(entry => (
          <article key={entry.id} className={`entry-card ${viewMode}`}>
            {viewMode === 'grid' && <div className="entry-image" />}
            <div className="entry-content">
              <p className="entry-date">{entry.date}</p>
              <h3 className="entry-title">{entry.title}</h3>
              <p className="entry-excerpt">{entry.excerpt}</p>
              <div className="entry-meta">
                <span className="entry-author">{entry.author}</span>
                <span className="entry-reading-time">{entry.readingTime} min read</span>
                <span className="entry-likes">{likes[entry.id] || 0} likes</span>
              </div>
              <div className="entry-tags">
                {entry.tags.map(tag => (
                  <span key={tag} className="entry-tag">{tag}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="journal-grid-layout">
        {paginatedEntries.map((entry, index) => (
          <article key={entry.id} className="grid-item" style={{ gridColumn: index % 3 === 0 ? 'span 2' : 'span 1' }}>
            <div className="grid-item-content">
              <span className="grid-badge">{index + 1}</span>
              <h4>{entry.title}</h4>
              <p>{entry.excerpt}</p>
              <button onClick={() => toggleExpanded(entry.id)}>
                {expanded[entry.id] ? 'Less' : 'More'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="journal-masonry">
        {paginatedEntries.map(entry => (
          <div key={entry.id} className="masonry-item" style={{ height: `${150 + (entry.readingTime * 10)}px` }}>
            <h4>{entry.title}</h4>
            <p>{entry.excerpt}</p>
          </div>
        ))}
      </div>

      <div className="journal-carousel">
        <div className="carousel-track">
          {paginatedEntries.map(entry => (
            <div key={entry.id} className="carousel-slide">
              <article className="carousel-card">
                <h4>{entry.title}</h4>
                <p>{entry.excerpt}</p>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-list-compact">
        {paginatedEntries.map(entry => (
          <div key={entry.id} className="compact-entry">
            <span className="compact-date">{entry.date}</span>
            <span className="compact-title">{entry.title}</span>
            <span className="compact-author">{entry.author}</span>
            <span className="compact-time">{entry.readingTime} min</span>
          </div>
        ))}
      </div>

      <div className="journal-timeline">
        {entries.map(entry => (
          <div key={entry.id} className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <span className="timeline-date">{entry.date}</span>
              <h4>{entry.title}</h4>
              <p>{entry.excerpt}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="journal-masonry-grid">
        {paginatedEntries.map(entry => (
          <article key={entry.id} className="masonry-card">
            <div className="masonry-header">
              <span className="masonry-category">{entry.tags[0]}</span>
            </div>
            <h3>{entry.title}</h3>
            <p>{entry.excerpt}</p>
            <div className="masonry-footer">
              <span>{entry.author}</span>
              <span>{entry.readingTime} min</span>
            </div>
          </article>
        ))}
      </div>

      <div className="journal-split-view">
        <div className="split-list">
          {paginatedEntries.map(entry => (
            <div
              key={entry.id}
              className={`split-item ${selectedEntry?.id === entry.id ? 'active' : ''}`}
              onClick={() => setSelectedEntry(entry)}
            >
              <h4>{entry.title}</h4>
              <span>{entry.date}</span>
            </div>
          ))}
        </div>
        <div className="split-content">
          {selectedEntry ? (
            <article className="split-article">
              <h2>{selectedEntry.title}</h2>
              <p className="split-meta">{selectedEntry.date} by {selectedEntry.author}</p>
              <div className="split-body">
                {selectedEntry.content.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </article>
          ) : (
            <div className="split-placeholder">Select an entry to read</div>
          )}
        </div>
      </div>

      <div className="journal-card-stack">
        {paginatedEntries.slice(0, 5).map((entry, index) => (
          <div
            key={entry.id}
            className="stack-card"
            style={{ transform: `translateY(${index * 20}px) rotate(${index * 2}deg)`, zIndex: index }}
          >
            <h4>{entry.title}</h4>
            <p>{entry.excerpt}</p>
          </div>
        ))}
      </div>

      <div className="journal-flip-cards">
        {paginatedEntries.map(entry => (
          <div key={entry.id} className="flip-card">
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <h4>{entry.title}</h4>
                <p>{entry.date}</p>
              </div>
              <div className="flip-card-back">
                <p>{entry.excerpt}</p>
                <button>Read More</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="journal-parallax">
        {paginatedEntries.map(entry => (
          <section key={entry.id} className="parallax-section">
            <div className="parallax-content">
              <h2>{entry.title}</h2>
              <p>{entry.excerpt}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="journal-accordion-advanced">
        {paginatedEntries.map(entry => (
          <div key={entry.id} className="accordion-item">
            <button
              className="accordion-header"
              onClick={() => toggleExpanded(entry.id)}
            >
              <span>{entry.title}</span>
              <span className="accordion-icon">{expanded[entry.id] ? '−' : '+'}</span>
            </button>
            {expanded[entry.id] && (
              <div className="accordion-body">
                <p>{entry.content}</p>
                <div className="accordion-meta">
                  <span>{entry.author}</span>
                  <span>{entry.date}</span>
                  <span>{entry.readingTime} min</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="journal-wizard">
        <div className="wizard-steps">
          <div className="wizard-step active">1. Select</div>
          <div className="wizard-step">2. Configure</div>
          <div className="wizard-step">3. Review</div>
          <div className="wizard-step">4. Complete</div>
        </div>
        <div className="wizard-content">
          <h3>Step 1: Select Entry Type</h3>
          <div className="wizard-options">
            {['Article', 'Tutorial', 'Guide', 'Review'].map(type => (
              <label key={type}>
                <input type="radio" name="entryType" value={type} />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="journal-multi-step-form">
        <div className="step-indicator">
          <div className="step active">1</div>
          <div className="step-line" />
          <div className="step">2</div>
          <div className="step-line" />
          <div className="step">3</div>
        </div>
        <form className="multi-step-form">
          <div className="form-step">
            <h4>Basic Information</h4>
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            <textarea placeholder="Description" rows={3} />
          </div>
          <div className="form-step">
            <h4>Content</h4>
            <textarea placeholder="Write your content..." rows={10} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
          </div>
          <div className="form-step">
            <h4>Review</h4>
            <p>Title: {formData.title}</p>
            <p>Content: {formData.content.substring(0, 100)}...</p>
          </div>
          <div className="form-actions">
            <button type="button">Previous</button>
            <button type="button">Next</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>

      <div className="journal-drag-drop">
        <div className="drag-source">
          <h4>Available Entries</h4>
          {paginatedEntries.map(entry => (
            <div key={entry.id} className="draggable-item" draggable>
              <span>{entry.title}</span>
            </div>
          ))}
        </div>
        <div className="drag-target">
          <h4>Reading List</h4>
          <div className="drop-zone">
            Drop items here
          </div>
        </div>
      </div>

      <div className="journal-kanban">
        {['To Read', 'Reading', 'Completed'].map(status => (
          <div key={status} className="kanban-column">
            <h4>{status}</h4>
            <div className="kanban-cards">
              {entries.filter((_, i) => i % 3 === ['To Read', 'Reading', 'Completed'].indexOf(status)).map(entry => (
                <div key={entry.id} className="kanban-card">
                  <h5>{entry.title}</h5>
                  <p>{entry.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="journal-scrum-board">
        {['Backlog', 'Sprint', 'Done'].map(column => (
          <div key={column} className="scrum-column">
            <div className="scrum-header">
              <h4>{column}</h4>
              <span className="scrum-count">{entries.length}</span>
            </div>
            <div className="scrum-cards">
              {entries.map(entry => (
                <div key={entry.id} className="scrum-card">
                  <h5>{entry.title}</h5>
                  <div className="scrum-tags">
                    {entry.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="scrum-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="journal-infinite-scroll-container">
        <div className="infinite-content">
          {entries.map(entry => (
            <article key={entry.id} className="infinite-item">
              <h3>{entry.title}</h3>
              <p>{entry.content}</p>
            </article>
          ))}
        </div>
        <div className="infinite-loader" ref={(el) => setLoader(el)}>
          {isLoading && <div className="loader-spinner" />}
        </div>
      </div>

      <div className="journal-virtual-list-container">
        <div className="virtual-list-viewport">
          {paginatedEntries.map(entry => (
            <div key={entry.id} className="virtual-list-row">
              <span>{entry.title}</span>
              <span>{entry.date}</span>
              <span>{entry.author}</span>
              <span>{entry.readingTime} min</span>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-lazy-load-container">
        {paginatedEntries.map(entry => (
          <div key={entry.id} className="lazy-load-item">
            <h3>{entry.title}</h3>
            <p>{entry.excerpt}</p>
          </div>
        ))}
      </div>

      <div className="journal-skeleton-loader">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-title" />
            <div className="skeleton-text" />
            <div className="skeleton-text short" />
          </div>
        ))}
      </div>

      <div className="journal-progress-indicator">
        <div className="progress-steps">
          {['Draft', 'Review', 'Publish'].map((step, i) => (
            <div key={step} className={`progress-step ${i < 2 ? 'active' : ''}`}>
              <div className="step-circle">{i + 1}</div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-stepper">
        <div className="stepper-steps">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`stepper-step ${step <= count ? 'completed' : ''}`}>
              <div className="stepper-circle">{step}</div>
              <span>Step {step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-breadcrumb">
        <nav className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/journal">Journal</a>
          <span>/</span>
          <span>Current Entry</span>
        </nav>
      </div>

      <div className="journal-crumb-navigation">
        <div className="crumb-prev">
          <button>← Previous</button>
          <span>Previous Entry Title</span>
        </div>
        <div className="crumb-next">
          <button>Next →</button>
          <span>Next Entry Title</span>
        </div>
      </div>

      <div className="journal-pagination-advanced">
        <button onClick={() => setPage(1)}>First</button>
        <button onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        {[1, 2, 3, 4, 5].map(p => (
          <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}
        <button onClick={() => setPage(p => p + 1)}>Next</button>
        <button onClick={() => setPage(100)}>Last</button>
      </div>

      <div className="journal-page-size-selector">
        <label>Show</label>
        <select value={pagination.pageSize} onChange={(e) => setPagination({ ...pagination, pageSize: Number(e.target.value) })}>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <label>entries</label>
      </div>

      <div className="journal-results-info">
        <p>Showing {((page - 1) * pagination.pageSize) + 1} to {Math.min(page * pagination.pageSize, entries.length)} of {entries.length} entries</p>
      </div>

      <div className="journal-quick-jump">
        <label>Go to page</label>
        <input type="number" min="1" max={Math.ceil(entries.length / pagination.pageSize)} onChange={(e) => setPage(Number(e.target.value))} />
        <button>Go</button>
      </div>

      <div className="journal-keyboard-navigation">
        <p>Use arrow keys to navigate</p>
        <div className="keyboard-hints">
          <kbd>←</kbd> <kbd>→</kbd> Navigate
          <kbd>Enter</kbd> Select
          <kbd>Esc</kbd> Close
        </div>
      </div>

      <div className="journal-accessibility-controls">
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
        <button onClick={() => setTheme('high-contrast')}>High Contrast</button>
        <label>
          Font Size
          <input type="range" min="12" max="24" value={numberValue} onChange={(e) => setNumberValue(Number(e.target.value))} />
        </label>
      </div>

      <div className="journal-screen-reader-only">
        <span className="sr-only">Screen reader only content</span>
      </div>

      <div className="journal-focus-indicator">
        <button className="focusable-button">Focusable</button>
      </div>

      <div className="journal-skip-link">
        <a href="#main-content">Skip to main content</a>
      </div>

      <div className="journal-live-region">
        <div role="status" aria-live="polite">
          {isLoading ? 'Loading entries...' : `${entries.length} entries loaded`}
        </div>
      </div>

      <div className="journal-toast-notifications">
        {notifications.slice(0, 3).map(notif => (
          <div key={notif.id} className="toast" role="alert">
            <p>{notif.message}</p>
            <button>×</button>
          </div>
        ))}
      </div>

      <div className="journal-snackbar">
        <p>Entry saved successfully</p>
        <button>Undo</button>
      </div>

      <div className="journal-tooltip-advanced">
        <button onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
          Hover me
        </button>
        {showTooltip && (
          <div className="tooltip-content" role="tooltip">
            <p>This is a detailed tooltip</p>
          </div>
        )}
      </div>

      <div className="journal-popover-advanced">
        <button onClick={() => setShowModal(!showModal)}>Toggle Popover</button>
        {showModal && (
          <div className="popover-content" role="dialog">
            <h4>Popover Title</h4>
            <p>Popover content goes here</p>
          </div>
        )}
      </div>

      <div className="journal-dialog-advanced">
        <button onClick={() => setShowModal(true)}>Open Dialog</button>
        {showModal && (
          <div className="dialog-overlay" role="dialog" aria-modal="true">
            <div className="dialog-box">
              <h3>Confirm Action</h3>
              <p>Are you sure you want to proceed?</p>
              <div className="dialog-actions">
                <button onClick={() => setShowModal(false)}>Cancel</button>
                <button onClick={() => setShowModal(false)}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="journal-bottom-sheet">
        <div className="sheet-handle" />
        <div className="sheet-content">
          <h4>Bottom Sheet</h4>
          <p>Swipe up for more content</p>
        </div>
      </div>

      <div className="journal-slide-over">
        <button onClick={() => setShowModal(true)}>Open Slide Over</button>
        {showModal && (
          <div className="slide-over-panel">
            <h3>Slide Over Panel</h3>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        )}
      </div>

      <div className="journal-drawer">
        <div className="drawer-sidebar">
          <nav className="drawer-nav">
            <a href="#">Home</a>
            <a href="#">Journal</a>
            <a href="#">About</a>
          </nav>
        </div>
      </div>

      <div className="journal-offcanvas">
        <button onClick={() => setShowModal(true)}>Open Offcanvas</button>
        {showModal && (
          <div className="offcanvas-menu">
            <h4>Menu</h4>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        )}
      </div>

      <div className="journal-mega-menu">
        <nav className="mega-menu">
          <div className="menu-item">
            <button>Categories</button>
            <div className="menu-dropdown">
              <div className="dropdown-column">
                <h5>Technology</h5>
                <a href="#">Web Development</a>
                <a href="#">Mobile</a>
                <a href="#">AI</a>
              </div>
              <div className="dropdown-column">
                <h5>Design</h5>
                <a href="#">UI/UX</a>
                <a href="#">Graphics</a>
                <a href="#">Motion</a>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className="journal-breadcrumb-advanced">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            <li><a href="/">Home</a></li>
            <li><a href="/journal">Journal</a></li>
            <li><a href="/journal/category">Category</a></li>
            <li aria-current="page">Current</li>
          </ol>
        </nav>
      </div>

      <div className="journal-step-navigation">
        <div className="step-nav">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span>Step {page} of {Math.ceil(entries.length / 10)}</span>
          <button onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      </div>

      <div className="journal-fullscreen-viewer">
        <button onClick={() => setShowModal(true)}>Fullscreen</button>
        {showModal && (
          <div className="fullscreen-container">
            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            <div className="fullscreen-content">
              <h2>Fullscreen View</h2>
              <p>Content in fullscreen mode</p>
            </div>
          </div>
        )}
      </div>

      <div className="journal-lightbox">
        <button onClick={() => setShowModal(true)}>Open Lightbox</button>
        {showModal && (
          <div className="lightbox-overlay" onClick={() => setShowModal(false)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src="/placeholder.jpg" alt="Lightbox" />
              <button className="lightbox-close" onClick={() => setShowModal(false)}>×</button>
            </div>
          </div>
        )}
      </div>

      <div className="journal-gallery">
        <div className="gallery-grid">
          {paginatedEntries.slice(0, 6).map((entry, i) => (
            <div key={entry.id} className="gallery-item">
              <img src={`/placeholder-${i}.jpg`} alt={entry.title} />
              <div className="gallery-caption">
                <h4>{entry.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-image-carousel">
        <div className="carousel-container">
          <button className="carousel-prev">←</button>
          <div className="carousel-track">
            {paginatedEntries.map((entry, i) => (
              <div key={entry.id} className="carousel-slide">
                <img src={`/slide-${i}.jpg`} alt={entry.title} />
              </div>
            ))}
          </div>
          <button className="carousel-next">→</button>
        </div>
        <div className="carousel-dots">
          {paginatedEntries.map((_, i) => (
            <span key={i} className={`dot ${i === 0 ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      <div className="journal-video-player">
        <div className="video-wrapper">
          <video controls>
            <source src="/video.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="video-controls">
          <button>Play</button>
          <button>Pause</button>
          <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          <span>{progress}%</span>
        </div>
      </div>

      <div className="journal-audio-player">
        <audio controls>
          <source src="/audio.mp3" type="audio/mpeg" />
        </audio>
        <div className="audio-playlist">
          {paginatedEntries.map(entry => (
            <div key={entry.id} className="playlist-item">
              <span>{entry.title}</span>
              <span>{entry.readingTime}:00</span>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-pdf-viewer">
        <div className="pdf-toolbar">
          <button>Zoom In</button>
          <button>Zoom Out</button>
          <button>Download</button>
          <button>Print</button>
        </div>
        <div className="pdf-content">
          <embed src="/document.pdf" type="application/pdf" />
        </div>
      </div>

      <div className="journal-document-viewer">
        <div className="doc-page">
          <h2>Document Title</h2>
          <p>Document content goes here...</p>
        </div>
      </div>

      <div className="journal-code-block">
        <div className="code-header">
          <span>JavaScript</span>
          <button>Copy</button>
        </div>
        <pre><code>{`function example() {
  return "Hello World";
}`}</code></pre>
      </div>

      <div className="journal-syntax-highlighter">
        <div className="syntax-line">
          <span className="line-number">1</span>
          <span className="line-content"><span className="keyword">const</span> <span className="variable">x</span> = <span className="string">"hello"</span>;</span>
        </div>
      </div>

      <div className="journal-code-editor">
        <div className="editor-toolbar">
          <button>Save</button>
          <button>Format</button>
          <button>Run</button>
        </div>
        <textarea className="editor-content" rows={10} defaultValue="// Write code here" />
      </div>

      <div className="journal-markdown-editor">
        <div className="markdown-toolbar">
          <button>B</button>
          <button>I</button>
          <button>Link</button>
          <button>Image</button>
        </div>
        <textarea className="markdown-content" rows={10} placeholder="Write in Markdown..." />
        <div className="markdown-preview">
          <h4>Preview</h4>
          <p>Preview content</p>
        </div>
      </div>

      <div className="journal-wysiwyg-editor">
        <div className="editor-toolbar">
          <button>Bold</button>
          <button>Italic</button>
          <button>Underline</button>
          <button>List</button>
        </div>
        <div className="editor-body" contentEditable>
          <p>Editable content</p>
        </div>
      </div>

      <div className="journal-rich-text-editor">
        <div className="rte-toolbar">
          <select>
            <option>Heading 1</option>
            <option>Heading 2</option>
            <option>Paragraph</option>
          </select>
          <button>Bold</button>
          <button>Italic</button>
        </div>
        <div className="rte-content">
          <h1>Title</h1>
          <p>Content</p>
        </div>
      </div>

      <div className="journal-quill-editor">
        <div className="quill-toolbar">
          <button>Header</button>
          <button>Bold</button>
          <button>Italic</button>
          <button>Link</button>
        </div>
        <div className="quill-editor">
          <p>Quill editor content</p>
        </div>
      </div>

      <div className="journal-tiptap-editor">
        <div className="tiptap-toolbar">
          <button>Undo</button>
          <button>Redo</button>
          <button>H1</button>
          <button>H2</button>
        </div>
        <div className="tiptap-content">
          <p>Tiptap editor</p>
        </div>
      </div>

      <div className="journal-slug-generator">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter title"
        />
        <div className="slug-preview">
          <label>URL Slug:</label>
          <span>{formData.title.toLowerCase().replace(/\s+/g, '-')}</span>
        </div>
      </div>

      <div className="journal-meta-editor">
        <div className="meta-field">
          <label>Title</label>
          <input type="text" />
        </div>
        <div className="meta-field">
          <label>Description</label>
          <textarea rows={3} />
        </div>
        <div className="meta-field">
          <label>Keywords</label>
          <input type="text" placeholder="keyword1, keyword2" />
        </div>
        <div className="meta-field">
          <label>OG Image</label>
          <input type="file" accept="image/*" />
        </div>
      </div>

      <div className="journal-seo-scorer">
        <div className="seo-score">
          <div className="score-circle" style={{ background: `conic-gradient(#4CAF50 ${75}%, #ddd ${75}%)` }}>
            <span>75</span>
          </div>
          <p>SEO Score: Good</p>
        </div>
        <div className="seo-checklist">
          <label><input type="checkbox" checked /> Title tag present</label>
          <label><input type="checkbox" checked /> Meta description</label>
          <label><input type="checkbox" /> H1 tag</label>
          <label><input type="checkbox" checked /> Image alt text</label>
        </div>
      </div>

      <div className="journal-sitemap-generator">
        <button onClick={handleExport}>Generate Sitemap</button>
        <div className="sitemap-preview">
          <ul>
            <li>/</li>
            <li>/about</li>
            <li>/journal</li>
            {entries.map(entry => (
              <li key={entry.id}>/journal/{entry.id}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="journal-robots-txt">
        <textarea rows={10} defaultValue={`User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml`} />
      </div>

      <div className="journal-structured-data">
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Journal",
            "description": "Notes on craft, light, and flow"
          })}
        </script>
      </div>

      <div className="journal-open-graph">
        <meta property="og:title" content="Journal" />
        <meta property="og:description" content="Notes on craft, light, and flow" />
        <meta property="og:type" content="website" />
      </div>

      <div className="journal-twitter-card">
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Journal" />
        <meta name="twitter:description" content="Notes on craft, light, and flow" />
      </div>

      <div className="journal-favicon">
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </div>

      <div className="journal-manifest">
        <link rel="manifest" href="/manifest.json" />
      </div>

      <div className="journal-pwa-install">
        <button onClick={handleInstall}>Install App</button>
      </div>

      <div className="journal-service-worker">
        <p>Service Worker: {ws ? 'Active' : 'Inactive'}</p>
      </div>

      <div className="journal-cache-status">
        <p>Cache: {Object.keys(cache).length} items</p>
        <button onClick={() => setCache({})}>Clear Cache</button>
      </div>

      <div className="journal-offline-page">
        <h2>You're Offline</h2>
        <p>Please check your internet connection</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>

      <div className="journal-error-boundary">
        {hasError ? (
          <div className="error-boundary-fallback">
            <h2>Something went wrong</h2>
            <button onClick={() => setHasError(false)}>Try Again</button>
          </div>
        ) : (
          <p>No errors</p>
        )}
      </div>

      <div className="journal-fallback-ui">
        <img src="/placeholder.svg" alt="Placeholder" />
        <p>Content loading...</p>
      </div>

      <div className="journal-skeleton-screens">
        <div className="skeleton-screen">
          <div className="skeleton-header" />
          <div className="skeleton-body">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      </div>

      <div className="journal-loading-spinner">
        <div className="spinner-large" />
      </div>

      <div className="journal-progress-bar">
        <div className="progress-bar-animated" style={{ width: `${progressBar}%` }} />
      </div>

      <div className="journal-shimmer-effect">
        <div className="shimmer" />
      </div>

      <div className="journal-pulse-effect">
        <div className="pulse" />
      </div>

      <div className="journal-bounce-effect">
        <div className="bounce" />
      </div>

      <div className="journal-fade-in">
        <div className="fade-in-content">Fade In Content</div>
      </div>

      <div className="journal-slide-in">
        <div className="slide-in-content">Slide In Content</div>
      </div>

      <div className="journal-scale-in">
        <div className="scale-in-content">Scale In Content</div>
      </div>

      <div className="journal-rotate-in">
        <div className="rotate-in-content">Rotate In Content</div>
      </div>

      <div className="journal-stagger-animation">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="stagger-item" style={{ animationDelay: `${i * 0.1}s` }}>
            Item {i}
          </div>
        ))}
      </div>

      <div className="journal-parallax-scroll">
        <div className="parallax-layer layer-1" />
        <div className="parallax-layer layer-2" />
        <div className="parallax-layer layer-3" />
      </div>

      <div className="journal-scroll-trigger">
        <div className="scroll-trigger-content">Scroll to reveal</div>
      </div>

      <div className="journal-lazy-image">
        <img src="/lazy-image.jpg" loading="lazy" alt="Lazy loaded" />
      </div>

      <div className="journal-blur-up">
        <img src="/blur-up-low.jpg" alt="Blur up" className="blur-up-low" />
        <img src="/blur-up-high.jpg" alt="Blur up" className="blur-up-high" />
      </div>

      <div className="journal-responsive-image">
        <picture>
          <source srcSet="/image-large.jpg" media="(min-width: 1200px)" />
          <source srcSet="/image-medium.jpg" media="(min-width: 768px)" />
          <img src="/image-small.jpg" alt="Responsive" />
        </picture>
      </div>

      <div className="journal-srcset-image">
        <img
          src="/image-400.jpg"
          srcSet="/image-400.jpg 400w, /image-800.jpg 800w, /image-1200.jpg 1200w"
          sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
          alt="Srcset example"
        />
      </div>

      <div className="journal-image-fallback">
        <picture>
          <source srcSet="/image.webp" type="image/webp" />
          <img src="/image.jpg" alt="With fallback" />
        </picture>
      </div>

      <div className="journal-lazy-video">
        <video preload="none" poster="/video-poster.jpg">
          <source src="/video.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="journal-audio-visualizer">
        <div className="visualizer-bars">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="bar" style={{ height: `${Math.random() * 100}%` }} />
          ))}
        </div>
      </div>

      <div className="journal-waveform">
        <svg viewBox="0 0 100 20">
          <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10" fill="none" stroke="currentColor" />
        </svg>
      </div>

      <div className="journal-audio-spectrum">
        <div className="spectrum-bars">
          {[...Array(32)].map((_, i) => (
            <div key={i} className="spectrum-bar" />
          ))}
        </div>
      </div>

      <div className="journal-equalizer">
        <div className="eq-channel">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="eq-bar" />
          ))}
        </div>
      </div>

      <div className="journal-3d-transform">
        <div className="transform-container">
          <div className="cube">
            <div className="face front">Front</div>
            <div className="face back">Back</div>
            <div className="face left">Left</div>
            <div className="face right">Right</div>
            <div className="face top">Top</div>
            <div className="face bottom">Bottom</div>
          </div>
        </div>
      </div>

      <div className="journal-card-flip">
        <div className="flip-container">
          <div className="flipper">
            <div className="front">Front</div>
            <div className="back">Back</div>
          </div>
        </div>
      </div>

      <div className="journal-3d-carousel">
        <div className="carousel-3d">
          {paginatedEntries.slice(0, 5).map((entry, i) => (
            <div key={entry.id} className="carousel-3d-item" style={{ transform: `rotateY(${i * 60}deg)` }}>
              <h4>{entry.title}</h4>
            </div>
          ))}
        </div>
      </div>

      <div className="journal-perspective-view">
        <div className="perspective-element">
          <div className="perspective-content">3D Content</div>
        </div>
      </div>

      <div className="journal-tilt-effect">
        <div className="tilt-card">
          <h4>Title</h4>
          <p>Content with tilt effect</p>
        </div>
      </div>

      <div className="journal-morph-effect">
        <svg width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="currentColor" className="morph-shape" />
        </svg>
      </div>

      <div className="journal-liquid-effect">
        <div className="liquid-blob" />
      </div>

      <div className="journal-particles">
        <div className="particle-container">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>
      </div>

      <div className="journal-confetti">
        <div className="confetti-piece" />
      </div>

      <div className="journal-fireworks">
        <div className="firework" />
      </div>

      <div className="journal-snowflakes">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="snowflake">❄</div>
        ))}
      </div>

      <div className="journal-rain">
        <div className="rain-drop" />
      </div>

      <div className="journal-stars">
        <div className="star" />
      </div>

      <div className="journal-bubbles">
        <div className="bubble" />
      </div>

      <div className="journal-smoke">
        <div className="smoke-particle" />
      </div>

      <div className="journal-fire">
        <div className="fire-particle" />
      </div>

      <div className="journal-water-ripple">
        <div className="ripple" />
      </div>

      <div className="journal-magic-effect">
        <div className="magic-sparkle" />
      </div>

      <div className="journal-glitch-effect">
        <h2 className="glitch" data-text="Glitch">Glitch</h2>
      </div>

      <div className="journal-neon-glow">
        <h2 className="neon">Neon Glow</h2>
      </div>

      <div className="journal-text-shadow">
        <h2 className="text-shadow-multiple">Multiple Shadows</h2>
      </div>

      <div className="journal-gradient-text">
        <h2 className="gradient-text">Gradient Text</h2>
      </div>

      <div className="journal-clip-path">
        <div className="clip-path-shape" />
      </div>

      <div className="journal-blend-mode">
        <div className="blend-layer" />
      </div>

      <div className="journal-backdrop-filter">
        <div className="backdrop-blur">Blur</div>
        <div className="backdrop-brightness">Brightness</div>
        <div className="backdrop-contrast">Contrast</div>
        <div className="backdrop-grayscale">Grayscale</div>
      </div>

      <div className="journal-mask-image">
        <div className="masked-content" />
      </div>

      <div className="journal-shape-outside">
        <div className="shaped-element" />
      </div>

      <div className="journal-paint-order">
        <svg width="100" height="50">
          <text x="10" y="40" paint-order="stroke fill">Text</text>
        </svg>
      </div>

      <div className="journal-line-break">
        <p style={{ wordBreak: 'break-all' }}>VeryLongWordThatNeedsToBreak</p>
      </div>

      <div className="journal-hyphenation">
        <p style={{ hyphens: 'auto' }}>Long text with hyphenation</p>
      </div>

      <div className="journal-text-overflow">
        <div className="overflow-ellipsis">Text that overflows</div>
        <div className="overflow-clip">Text that clips</div>
      </div>

      <div className="journal-font-feature">
        <p style={{ fontFeatureSettings: '"smcp" on' }}>Small caps</p>
      </div>

      <div className="journal-font-variant">
        <p style={{ fontVariantNumeric: 'oldstyle-nums' }}>Old style numbers</p>
      </div>

      <div className="journal-text-indent">
        <p style={{ textIndent: '2rem' }}>Indented paragraph</p>
      </div>

      <div className="journal-text-justify">
        <p style={{ textAlign: 'justify' }}>Justified text content</p>
      </div>

      <div className="journal-text-orientation">
        <p style={{ textOrientation: 'mixed' }}>Mixed orientation</p>
      </div>

      <div className="journal-writing-mode">
        <p style={{ writingMode: 'vertical-rl' }}>Vertical text</p>
      </div>

      <div className="journal-initial-letter">
        <p style={{ initialLetter: '3' }}>Drop cap paragraph</p>
      </div>

      <div className="journal-text-wrap">
        <p style={{ textWrap: 'pretty' }}>Pretty text wrap</p>
      </div>

      <div className="journal-box-decoration">
        <div className="box-decoration-break">
          <p>Content with box decoration break</p>
        </div>
      </div>

      <div className="journal-caret-color">
        <input style={{ caretColor: 'red' }} />
      </div>

      <div className="journal-selection-color">
        <p style={{ background: 'blue', color: 'white' }}>Selectable text</p>
      </div>

      <div className="journal-placeholder-shown">
        <input placeholder=" " />
        <label>Floating label</label>
      </div>

      <div className="journal-aspect-ratio">
        <div className="aspect-box" style={{ aspectRatio: '16/9' }} />
      </div>

      <div className="journal-container-type">
        <div className="container-query">
          <div className="container-content">Content</div>
        </div>
      </div>

      <div className="journal-ch-unit">
        <div style={{ width: '20ch' }}>20 characters wide</div>
      </div>

      <div className="journal-ic-unit">
        <div style={{ width: '10ic' }}>10 ic units</div>
      </div>

      <div className="journal-lh-unit">
        <p style={{ lineHeight: '1.5' }}>Line height unit</p>
      </div>

      <div className="journal-advance-width">
        <div style={{ width: '10aw' }}>Advance width</div>
      </div>

      <div className="journal-cap-unit">
        <div style={{ height: '10cap' }}>Cap height</div>
      </div>

      <div className="journal-ex-unit">
        <div style={{ fontSize: '10ex' }}>Ex unit</div>
      </div>

      <div className="journal-rem-unit">
        <div style={{ fontSize: '2rem' }}>Rem unit</div>
      </div>

      <div className="journal-em-unit">
        <div style={{ fontSize: '2em' }}>Em unit</div>
      </div>

      <div className="journal-px-unit">
        <div style={{ width: '100px' }}>Pixel unit</div>
      </div>

      <div className="journal-percent-unit">
        <div style={{ width: '50%' }}>Percentage</div>
      </div>

      <div className="journal-vw-unit">
        <div style={{ width: '50vw' }}>Viewport width</div>
      </div>

      <div className="journal-vh-unit">
        <div style={{ height: '50vh' }}>Viewport height</div>
      </div>

      <div className="journal-vmin-unit">
        <div style={{ width: '10vmin' }}>Vmin</div>
      </div>

      <div className="journal-vmax-unit">
        <div style={{ width: '10vmax' }}>Vmax</div>
      </div>

      <div className="journal-fr-unit">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
          <div>1fr</div>
          <div>2fr</div>
        </div>
      </div>

      <div className="journal-grid-template">
        <div className="grid-template-areas">
          <div className="header">Header</div>
          <div className="sidebar">Sidebar</div>
          <div className="content">Content</div>
          <div className="footer">Footer</div>
        </div>
      </div>

      <div className="journal-subgrid">
        <div className="parent-grid">
          <div className="child-subgrid">Subgrid</div>
        </div>
      </div>

      <div className="journal-grid-auto-flow">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoFlow: 'dense' }}>
          <div style={{ gridColumn: 'span 2' }}>Dense</div>
        </div>
      </div>

      <div className="journal-masonry-layout">
        <div className="masonry-layout">
          <div className="masonry-item">Item 1</div>
          <div className="masonry-item tall">Item 2</div>
          <div className="masonry-item">Item 3</div>
        </div>
      </div>

      <div className="journal-scroll-snap">
        <div className="scroll-snap-container">
          <div className="scroll-snap-item">1</div>
          <div className="scroll-snap-item">2</div>
          <div className="scroll-snap-item">3</div>
        </div>
      </div>

      <div className="journal-overflow-anchor">
        <div className="overflow-anchor-auto">Scroll anchor</div>
      </div>

      <div className="journal-text-align-last">
        <p style={{ textAlignLast: 'right' }}>Text align last</p>
      </div>

      <div className="journal-text-justify">
        <p style={{ textJustify: 'distribute' }}>Justified with distribute</p>
      </div>

      <div className="journal-white-space">
        <p style={{ whiteSpace: 'pre-wrap' }}>Pre wrap text</p>
      </div>

      <div className="journal-word-spacing">
        <p style={{ wordSpacing: '1em' }}>Word spacing</p>
      </div>

      <div className="journal-letter-spacing">
        <p style={{ letterSpacing: '0.1em' }}>Letter spacing</p>
      </div>

      <div className="journal-text-transform">
        <p style={{ textTransform: 'uppercase' }}>Uppercase text</p>
      </div>

      <div className="journal-text-decoration">
        <p style={{ textDecoration: 'underline wavy red' }}>Wavy underline</p>
      </div>

      <div className="journal-text-underline-offset">
        <p style={{ textDecoration: 'underline', textUnderlineOffset: '5px' }}>Offset underline</p>
      </div>

      <div className="journal-text-decoration-skip">
        <p style={{ textDecorationSkip: 'ink' }}>Skip ink decoration</p>
      </div>

      <div className="journal-text-emphasis">
        <p style={{ textEmphasis: 'circle' }}>Emphasis marks</p>
      </div>

      <div className="journal-text-shadow-multiple">
        <p style={{ textShadow: '2px 2px red, 4px 4px blue' }}>Multiple shadows</p>
      </div>

      <div className="journal-color-scheme">
        <p style={{ colorScheme: 'light dark' }}>Color scheme</p>
      </div>

      <div className="journal-forced-color-adjust">
        <p style={{ forcedColorAdjust: 'auto' }}>Forced color adjust</p>
      </div>

      <div className="journal-print-color-adjust">
        <p style={{ printColorAdjust: 'exact' }}>Print color adjust</p>
      </div>

      <div className="journal-orientation">
        <div style={{ orientation: 'portrait' }}>Portrait</div>
      </div>

      <div className="journal-resolution">
        <div style={{ resolution: '300dpi' }}>Resolution</div>
      </div>

      <div className="journal-min-resolution">
        <div style={{ minResolution: '100dppx' }}>Min resolution</div>
      </div>

      <div className="journal-max-resolution">
        <div style={{ maxResolution: '300dppx' }}>Max resolution</div>
      </div>

      <div className="journal-aspect-ratio-media">
        <video style={{ aspectRatio: '16/9' }} />
      </div>

      <div className="journal-hover-media">
        <div className="hover-media-content">Hover media</div>
      </div>

      <div className="journal-pointer-media">
        <div className="pointer-media-content">Pointer media</div>
      </div>

      <div className="journal-scripting-media">
        <div className="scripting-content">Scripting</div>
      </div>

      <div className="journal-prefers-reduced-motion">
        <div className="reduced-motion-content">Reduced motion</div>
      </div>

      <div className="journal-prefers-contrast">
        <div className="contrast-content">Prefers contrast</div>
      </div>

      <div className="journal-prefers-color-scheme">
        <div className="color-scheme-content">Prefers color scheme</div>
      </div>

      <div className="journal-environment-blending">
        <div className="blending-content">Environment blending</div>
      </div>

      <div className="journal-video-playback">
        <video autoPlay muted loop playsInline>
          <source src="/video.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="journal-audio-playback">
        <audio autoPlay>
          <source src="/audio.mp3" type="audio/mpeg" />
        </audio>
      </div>

      <div className="journal-picture-element">
        <picture>
          <source srcSet="/img.avif" type="image/avif" />
          <source srcSet="/img.webp" type="image/webp" />
          <img src="/img.jpg" alt="Picture element" />
        </picture>
      </div>

      <div className="journal-source-element">
        <video>
          <source src="/video.mp4" type="video/mp4" media="(min-width: 800px)" />
          <source src="/video-small.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="journal-track-element">
        <video>
          <track kind="captions" src="/captions.vtt" srclang="en" label="English" default />
          <track kind="descriptions" src="/descriptions.vtt" srclang="en" />
          <track kind="chapters" src="/chapters.vtt" />
          <track kind="subtitles" src="/subtitles.vtt" srclang="es" label="Spanish" />
        </video>
      </div>

      <div className="journal-area-element">
        <img src="/image.jpg" usemap="#imagemap" alt="Image map" />
        <map name="imagemap">
          <area shape="rect" coords="0,0,50,50" href="#1" alt="Area 1" />
          <area shape="circle" coords="75,25,25" href="#2" alt="Area 2" />
          <area shape="poly" coords="100,0,150,50,100,100" href="#3" alt="Area 3" />
        </map>
      </div>

      <div className="journal-svg-element">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="blue" />
          <rect x="20" y="20" width="60" height="60" fill="red" opacity="0.5" />
          <path d="M10 90 L50 10 L90 90 Z" fill="green" />
        </svg>
      </div>

      <div className="journal-canvas-element">
        <canvas width="200" height="100" />
      </div>

      <div className="journal-math-element">
        <math>
          <mrow>
            <mi>x</mi>
            <mo>=</mo>
            <mfrac>
              <mrow>
                <mo>−</mo>
                <mi>b</mi>
                <mo>±</mo>
                <msqrt>
                  <mrow>
                    <msup>
                      <mi>b</mi>
                      <mn>2</mn>
                    </msup>
                    <mo>−</mo>
                    <mn>4</mn>
                    <mi>a</mi>
                    <mi>c</mi>
                  </mrow>
                </msqrt>
              </mrow>
              <mrow>
                <mn>2</mn>
                <mi>a</mi>
              </mrow>
            </mfrac>
          </mrow>
        </math>
      </div>

      <div className="journal-details-element">
        <details>
          <summary>Click to expand</summary>
          <p>Hidden content revealed on click</p>
        </details>
      </div>

      <div className="journal-dialog-element">
        <dialog open>
          <h2>Dialog</h2>
          <p>This is a native dialog element</p>
          <button onClick={(e) => (e.target as HTMLDialogElement).close()}>Close</button>
        </dialog>
      </div>

      <div className="journal-template-element">
        <template id="my-template">
          <div class="template-content">Template content</div>
        </template>
      </div>

      <div className="journal-slot-element">
        <slot>Default slot content</slot>
      </div>

      <div className="journal-element-custom">
        <custom-element>Custom element</custom-element>
      </div>

      <div className="journal-shadow-dom">
        <div className="shadow-host">
          <span>Shadow DOM content</span>
        </div>
      </div>

      <div className="journal-web-component">
        <my-web-component />
      </div>

      <div className="journal-custom-element">
        <news-ticker />
      </div>

      <div className="journal-augmented-reality">
        <button>View in AR</button>
      </div>

      <div className="journal-virtual-reality">
        <button>Enter VR</button>
      </div>

      <div className="journal-mixed-reality">
        <button>MR Experience</button>
      </div>

      <div className="journal-geolocation">
        <button onClick={() => navigator.geolocation.getCurrentPosition(pos => console.log(pos))}>
          Get Location
        </button>
      </div>

      <div className="journal-device-orientation">
        <div className="orientation-data">Device orientation</div>
      </div>

      <div className="journal-device-motion">
        <div className="motion-data">Device motion</div>
      </div>

      <div className="journal-nfc">
        <button>Read NFC</button>
      </div>

      <div className="journal-bluetooth">
        <button onClick={() => navigator.bluetooth.requestDevice({ filters: [{ services: ['battery_service'] }] })}>
          Connect Bluetooth
        </button>
      </div>

      <div className="journal-usb">
        <button onClick={() => (navigator as any).usb.requestDevice({ filters: [{ vendorId: 0x1234 }] })}>
          Connect USB
        </button>
      </div>

      <div className="journal-serial">
        <button onClick={() => (navigator as any).serial.requestPort()}>
          Connect Serial
        </button>
      </div>

      <div className="journal-payment-request">
        <button onClick={() => new PaymentRequest([{ supportedMethods: 'basic-card' }], { total: { label: 'Total', amount: { currency: 'USD', value: '10.00' } } })}>
          Pay Now
        </button>
      </div>

      <div className="journal-credential-management">
        <button onClick={() => navigator.credentials.get({ password: true })}>
          Get Credentials
        </button>
      </div>

      <div className="journal-web-authentication">
        <button onClick={() => navigator.credentials.create({ publicKey: { challenge: new Uint8Array(32), rp: { name: 'Example' }, user: { id: new Uint8Array(16), name: 'user@example.com' }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }] } })}>
          Authenticate
        </button>
      </div>

      <div className="journal-shape-detection">
        <div className="detection-result">Shape detection</div>
      </div>

      <div className="journal-barcode-detection">
        <div className="barcode-result">Barcode detection</div>
      </div>

      <div className="journal-face-detection">
        <div className="face-result">Face detection</div>
      </div>

      <div className="journal-text-detection">
        <div className="text-result">Text detection</div>
      </div>

      <div className="journal-speech-recognition">
        <button onClick={() => new (window as any).SpeechRecognition()}>Start Speech</button>
      </div>

      <div className="journal-speech-synthesis">
        <button onClick={() => window.speechSynthesis.speak(new SpeechSynthesisUtterance('Hello'))}>Speak</button>
      </div>

      <div className="journal-web-cam">
        <video autoPlay />
      </div>

      <div className="journal-screen-capture">
        <button onClick={() => (navigator as any).mediaDevices.getDisplayMedia()}>
          Share Screen
        </button>
      </div>

      <div className="journal-media-recorder">
        <button onClick={() => new MediaRecorder(new Blob())}>Record</button>
      </div>

      <div className="journal-web-rtc">
        <button onClick={() => new RTCPeerConnection()}>Connect RTC</button>
      </div>

      <div className="journal-data-channel">
        <div className="data-channel">Data channel</div>
      </div>

      <div className="journal-webrtc-stats">
        <div className="stats-display">WebRTC stats</div>
      </div>

      <div className="journal-media-stream">
        <video autoPlay muted />
      </div>

      <div className="journal-media-source">
        <video />
      </div>

      <div className="journal-encrypted-media">
        <video />
      </div>

      <div className="journal-playback-rate">
        <video playbackRate={1.5} />
      </div>

      <div className="journal-audio-context">
        <button onClick={() => new AudioContext()}>Create Audio</button>
      </div>

      <div className="journal-analyser-node">
        <canvas />
      </div>

      <div className="journal-convolver-node">
        <div className="convolver">Convolver node</div>
      </div>

      <div className="journal-delay-node">
        <div className="delay">Delay node</div>
      </div>

      <div className="journal-gain-node">
        <div className="gain">Gain node</div>
      </div>

      <div className="journal-biquad-filter-node">
        <div className="filter">Biquad filter</div>
      </div>

      <div className="journal-wave-shaper-node">
        <div className="waveshaper">Wave shaper</div>
      </div>

      <div className="journal-stereo-panner-node">
        <div className="panner">Stereo panner</div>
      </div>

      <div className="journal-dynamics-compressor-node">
        <div className="compressor">Compressor</div>
      </div>

      <div className="journal-media-stream-source">
        <div className="stream-source">Stream source</div>
      </div>

      <div className="journal-media-element-source">
        <div className="media-source">Media element source</div>
      </div>

      <div className="journal-media-stream-destination">
        <div className="stream-dest">Stream destination</div>
      </div>

      <div className="journal-channel-splitter">
        <div className="splitter">Channel splitter</div>
      </div>

      <div className="journal-channel-merger">
        <div className="merger">Channel merger</div>
      </div>

      <div className="journal-periodic-wave">
        <div className="periodic-wave">Periodic wave</div>
      </div>

      <div className="journal-audio-buffer">
        <div className="audio-buffer">Audio buffer</div>
      </div>

      <div className="journal-audio-buffer-source">
        <div className="buffer-source">Buffer source</div>
      </div>

      <div className="journal-constant-source-node">
        <div className="constant-source">Constant source</div>
      </div>

      <div className="journal-iir-filter-node">
        <div className="iir-filter">IIR filter</div>
      </div>

      <div className="journal-script-processor">
        <div className="script-processor">Script processor</div>
      </div>

      <div className="journal-audio-worklet">
        <div className="audio-worklet">Audio worklet</div>
      </div>

      <div className="journal-offline-audio-context">
        <div className="offline-audio">Offline audio</div>
      </div>

      <div className="journal-midi">
        <button onClick={() => navigator.requestMIDIAccess()}>Access MIDI</button>
      </div>

      <div className="journal-gamepad">
        <div className="gamepad-status">Gamepad</div>
      </div>

      <div className="journal-vibration">
        <button onClick={() => navigator.vibrate(200)}>Vibrate</button>
      </div>

      <div className="journal-wake-lock">
        <button onClick={() => (navigator as any).wakeLock.request('screen')}>Keep Awake</button>
      </div>

      <div className="journal-battery">
        <div className="battery-level">Battery</div>
      </div>

      <div className="journal-network-information">
        <div className="network-info">Network</div>
      </div>

      <div className="journal-idle-detection">
        <button onClick={() => (navigator as any).idleRequest.request('release')}>Idle detection</button>
      </div>

      <div className="journal-notifications">
        <button onClick={() => Notification.requestPermission()}>Enable Notifications</button>
        {permission === 'granted' && (
          <button onClick={() => new Notification('Title', { body: 'Body' })}>
            Show Notification
          </button>
        )}
      </div>

      <div className="journal-push-notifications">
        <button>Subscribe to Push</button>
      </div>

      <div className="journal-sync-manager">
        <button onClick={() => navigator.serviceWorker.ready.then(reg => (reg as any).sync.register('sync'))}>
          Register Sync
        </button>
      </div>

      <div className="journal-background-sync">
        <div className="bg-sync">Background sync</div>
      </div>

      <div className="journal-payment-handler">
        <button>Payment Handler</button>
      </div>

      <div className="journal-content-index">
        <button>Index Content</button>
      </div>

      <div className="journal-periodic-background-sync">
        <button>Periodic Sync</button>
      </div>

      <div className="journal-clipboard">
        <button onClick={() => navigator.clipboard.writeText('Copied!')}>Copy to Clipboard</button>
      </div>

      <div className="journal-clipboard-item">
        <div className="clipboard-item">Clipboard item</div>
      </div>

      <div className="journal-file-system">
        <button onClick={() => (navigator as any).storage.requestPersistent()}>Request Storage</button>
      </div>

      <div className="journal-file-system-access">
        <button onClick={() => (navigator as any).storage.getDirectory()}>Get Directory</button>
      </div>

      <div className="journal-encrypted-media-extensions">
        <video />
      </div>

      <div className="journal-media-capabilities">
        <div className="media-caps">Media capabilities</div>
      </div>

      <div className="journal-media-session">
        <button onClick={() => (navigator as any).mediaSession.setMetadata({ title: 'Title', artist: 'Artist' })}>
          Set Media Session
        </button>
      </div>

      <div className="journal-picture-in-picture">
        <video controls />
      </div>

      <div className="journal-audio-video-capture">
        <button onClick={() => (navigator as any).mediaDevices.getUserMedia({ video: true, audio: true })}>
          Capture Media
        </button>
      </div>

      <div className="journal-audio-output">
        <select>
          <option>Default</option>
        </select>
      </div>

      <div className="journal-device-change">
        <div className="device-change">Device change</div>
      </div>

      <div className="journal-domain-persistence">
        <div className="domain-persistence">Domain persistence</div>
      </div>

      <div className="journal-large-allocation">
        <div className="large-allocation">Large allocation</div>
      </div>

      <div className="journal-performance-observer">
        <button onClick={() => new PerformanceObserver(entry => console.log(entry)).observe({ entryTypes: ['measure'] })}>
          Observe Performance
        </button>
      </div>

      <div className="journal-resource-timing">
        <div className="resource-timing">Resource timing</div>
      </div>

      <div className="journal-navigation-timing">
        <div className="nav-timing">Navigation timing</div>
      </div>

      <div className="journal-user-timing">
        <button onClick={() => performance.mark('test-mark')}>Mark</button>
      </div>

      <div className="journal-element-timing">
        <div className="element-timing">Element timing</div>
      </div>

      <div className="journal-layout-shift">
        <div className="layout-shift">Layout shift</div>
      </div>

      <div className="journal-largest-contentful-paint">
        <div className="lcp">Largest contentful paint</div>
      </div>

      <div className="journal-first-input">
        <div className="first-input">First input</div>
      </div>

      <div className="journal-server-timing">
        <div className="server-timing">Server timing</div>
      </div>
    </section>
  )
}

function ContactPage() {
  return (
    <section className="page-grid">
      <div>
        <p className="eyebrow">Contact</p>
        <h1>Tell us what you are building.</h1>
        <p className="lead">
          Share your idea, timeline, and what success feels like. We will
          respond within two business days.
        </p>
      </div>
      <div className="contact-card">
        <div>
          <p className="panel-label">Project inbox</p>
          <h3>hello@vibes.studio</h3>
        </div>
        <div>
          <p className="panel-label">Availability</p>
          <p>Next kickoff: March 2026</p>
        </div>
        <button className="primary-btn">Book a call</button>
      </div>
    </section>
  )
}
