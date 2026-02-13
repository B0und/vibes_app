import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import StocksPage from './pages/StocksPage'

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

function ServicesPage() {
  return (
    <section className="page-grid">
      <div>
        <p className="eyebrow">Capabilities</p>
        <h1>From concept decks to shipping code.</h1>
        <p className="lead">
          We run focused engagements with a clear end-state. Each service is
          modular, so you can start where you need momentum most.
        </p>
      </div>
      <div className="service-list">
        <div className="service-card">
          <h3>Brand systems</h3>
          <p>Identity, tone, motion language, and visual kits.</p>
        </div>
        <div className="service-card">
          <h3>Product design</h3>
          <p>UX flows, interaction choreography, and design systems.</p>
        </div>
        <div className="service-card">
          <h3>Full-stack build</h3>
          <p>React, motion, and polished handoff-ready interfaces.</p>
        </div>
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
