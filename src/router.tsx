import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import StocksPage from './pages/StocksPage'

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
  return (
    <section className="page-grid">
      <div>
        <p className="eyebrow">Our story</p>
        <h1>We choreograph the quiet moments.</h1>
        <p className="lead">
          Vibes Studio is a multidisciplinary team of designers, developers,
          and strategists. We pair visual warmth with technical precision so
          every product feels intentional.
        </p>
      </div>
      <div className="info-stack">
        <div className="info-card">
          <h3>Small, focused crew</h3>
          <p>
            Senior-only team with a low project cap. We stay hands-on from
            concept to launch.
          </p>
        </div>
        <div className="info-card">
          <h3>Crafted with rhythm</h3>
          <p>
            We design the flow first, then fill in texture, motion, and story.
          </p>
        </div>
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
