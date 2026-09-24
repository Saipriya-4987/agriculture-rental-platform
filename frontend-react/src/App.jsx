import Layout from './components/Layout.jsx'

// M3 step 2: App now renders the shared Layout (Header + Footer).
// The Home page itself isn't migrated yet, so the main content is just
// a placeholder for now - that comes in a later M3 step.
function App() {
  return (
    <Layout>
      <p className="container">AgriRent React application</p>
    </Layout>
  )
}

export default App