import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'

// M3 final state: Layout (shared Header + Footer) wrapping the Home page.
// There is no routing yet - React Router / page switching is M4's job.
function App() {
  return (
    <Layout>
      <Home />
    </Layout>
  )
}

export default App