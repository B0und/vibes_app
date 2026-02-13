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

function JournalPage() {
  return (
    <section className="page-grid">
      <div>
        <p className="eyebrow">Journal</p>
        <h1>Notes on craft, light, and flow.</h1>
        <p className="lead">
          Short reads on how we build a sense of place on the web.
        </p>
      </div>
      <div className="journal-list">
        <article className="journal-card">
          <p className="panel-label">05 Feb 2026</p>
          <h3>Layering soft contrast</h3>
          <p>Why depth cues in UI make products feel more tactile.</p>
        </article>
        <article className="journal-card">
          <p className="panel-label">28 Jan 2026</p>
          <h3>Designing the pause</h3>
          <p>How negative space builds attention and calm.</p>
        </article>
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
