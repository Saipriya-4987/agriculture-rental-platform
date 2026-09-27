import { Link, NavLink } from 'react-router-dom'

// Header component (M3 step 2, routed in M4 step 1).
// Based on the <header class="site-header"> markup in frontend/index.html.
// Navigation uses React Router: <NavLink> adds the "active" class itself
// for the current route (`end` stops /equipment also matching
// /equipment/new, and / matching everything).
function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-[1100px] mx-auto px-5 flex justify-between items-center py-4">
        <Link to="/" className="text-[1.4rem] font-bold text-green-800">🌾 AgriRent</Link>

        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-green-800'
                : 'font-medium text-gray-700 hover:text-green-800'
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/equipment"
            end
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-green-800'
                : 'font-medium text-gray-700 hover:text-green-800'
            }
          >
            Browse Equipment
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-green-800'
                : 'font-medium text-gray-700 hover:text-green-800'
            }
          >
            Login
          </NavLink>
          <Link
            to="/register"
            className="bg-green-800 text-white px-4 py-2 rounded-md hover:bg-green-900"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header