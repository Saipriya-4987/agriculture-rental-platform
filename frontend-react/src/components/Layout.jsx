import Header from './Header.jsx'
import Footer from './Footer.jsx'

// M3 step 2: Layout component.
// Renders the shared Header and Footer on every page, with the
// page-specific content (passed in as `children`) in between, inside
// a <main> tag - same one-<main>-per-page structure as frontend/index.html.
function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default Layout