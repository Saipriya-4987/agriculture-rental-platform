import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import EquipmentList from './pages/EquipmentList'
import EquipmentDetails from './pages/EquipmentDetails'
import EquipmentNew from './pages/EquipmentNew'
import Login from './pages/Login'
import Register from './pages/Register'

// M4 step 1: client-side routing. Layout (shared Header + Footer) wraps
// every route. React Router ranks the static "/equipment/new" above the
// dynamic "/equipment/:id", so both work regardless of order.
// EquipmentDetails doesn't read :id yet - it still shows its one fixed
// listing; dynamic loading is a later step.
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/equipment/new" element={<EquipmentNew />} />
        <Route path="/equipment/:id" element={<EquipmentDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Layout>
  )
}

export default App