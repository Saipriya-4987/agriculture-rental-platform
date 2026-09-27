import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { getAuthUser, clearAuthSession } from '../services/api'

// Header component (M3 step 2, routed in M4 step 1, auth-aware in M10 Step 5).
function Header() {
  // useLocation ensures Header re-renders on route changes, reflecting auth session state
  useLocation()
  const navigate = useNavigate()
  const user = getAuthUser()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/')
  }

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

          {user ? (
            <>
              {user.role === 'OWNER' && (
                <NavLink
                  to="/equipment/new"
                  className={({ isActive }) =>
                    isActive
                      ? 'font-bold text-green-800'
                      : 'font-medium text-gray-700 hover:text-green-800'
                  }
                >
                  + List Equipment
                </NavLink>
              )}
              <div className="flex items-center gap-3 ml-2 border-l border-gray-200 pl-4">
                <span className="text-sm font-semibold text-gray-700">
                  👤 {user.name}{' '}
                  <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header