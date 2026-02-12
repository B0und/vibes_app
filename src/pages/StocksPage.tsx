import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

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

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
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

export default function StocksPage() {
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
