import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import EquipmentList from './pages/EquipmentList'
import EquipmentDetails from './pages/EquipmentDetails'
import EquipmentNew from './pages/EquipmentNew'
import EquipmentEdit from './pages/EquipmentEdit'
import Login from './pages/Login'
import Register from './pages/Register'

import ProtectedRoute from './components/ProtectedRoute'

// M4 step 1 + M9 Step 2 + M10 Step 5: client-side routing.
// Equipment creation and editing are protected for authenticated OWNER role only.
function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route
          path="/equipment/new"
          element={
            <ProtectedRoute requiredRole="OWNER">
              <EquipmentNew />
            </ProtectedRoute>
          }
        />
        <Route path="/equipment/:id" element={<EquipmentDetails />} />
        <Route
          path="/equipment/:id/edit"
          element={
            <ProtectedRoute requiredRole="OWNER">
              <EquipmentEdit />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Layout>
  )
}

export default App