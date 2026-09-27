import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import EquipmentList from './pages/EquipmentList'
import EquipmentDetails from './pages/EquipmentDetails'
import EquipmentNew from './pages/EquipmentNew'
import EquipmentEdit from './pages/EquipmentEdit'
import Login from './pages/Login'
import Register from './pages/Register'

// M4 step 1 + M9 Step 2: client-side routing. Layout (shared Header + Footer) wraps
// every route. React Router ranks static routes above dynamic ones.
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/equipment/new" element={<EquipmentNew />} />
        <Route path="/equipment/:id" element={<EquipmentDetails />} />
        <Route path="/equipment/:id/edit" element={<EquipmentEdit />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Layout>
  )
}

export default App