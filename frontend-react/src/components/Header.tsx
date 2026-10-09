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
    <header className="bg-white border-b border-[#e5e7eb]">
      <div className="max-w-[1100px] mx-auto px-5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 py-4">
        <Link to="/" className="text-[1.4rem] font-bold text-[#166534]">🌾 AgriRent</Link>

        <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-[#166534]'
                : 'font-medium text-[#374151] hover:text-[#166534]'
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/equipment"
            end
            className={({ isActive }) =>
              isActive
                ? 'font-bold text-[#166534]'
                : 'font-medium text-[#374151] hover:text-[#166534]'
            }
          >
            Browse Equipment
          </NavLink>

          {user ? (
            <>
              {user.role === 'FARMER' && (
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) =>
                    isActive
                      ? 'font-bold text-[#166534]'
                      : 'font-medium text-[#374151] hover:text-[#166534]'
                  }
                >
                  My Bookings
                </NavLink>
              )}
              {user.role === 'OWNER' && (
                <>
                  <NavLink
                    to="/owner/listings"
                    className={({ isActive }) =>
                      isActive
                        ? 'font-bold text-[#166534]'
                        : 'font-medium text-[#374151] hover:text-[#166534]'
                    }
                  >
                    My Listings
                  </NavLink>
                  <NavLink
                    to="/owner/bookings"
                    className={({ isActive }) =>
                      isActive
                        ? 'font-bold text-[#166534]'
                        : 'font-medium text-[#374151] hover:text-[#166534]'
                    }
                  >
                    Booking Requests
                  </NavLink>
                  <NavLink
                    to="/equipment/new"
                    className={({ isActive }) =>
                      isActive
                        ? 'font-bold text-[#166534]'
                        : 'font-medium text-[#374151] hover:text-[#166534]'
                    }
                  >
                    + List Equipment
                  </NavLink>
                </>
              )}
              <div className="flex items-center gap-3 ml-2 border-l border-[#e5e7eb] pl-4">
                <span className="text-sm font-semibold text-[#374151]">
                  👤 {user.name}{' '}
                  <span className="text-xs bg-[#dcfce7] text-[#166534] font-bold px-2 py-0.5 rounded-[4px]">
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
                    ? 'font-bold text-[#166534]'
                    : 'font-medium text-[#374151] hover:text-[#166534]'
                }
              >
                Login
              </NavLink>
              <Link
                to="/register"
                className="btn-nav"
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