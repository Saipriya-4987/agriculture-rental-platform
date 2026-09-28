import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

// M3 step 2: Layout component.
// Renders the shared Header and Footer on every page, with the
// page-specific content (passed in as `children`) in between, inside
// a <main> tag - same one-<main>-per-page structure as frontend/index.html.
function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout