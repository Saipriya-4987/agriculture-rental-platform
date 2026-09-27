import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getAuthToken, getUserRole } from '../services/api'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
}

/**
 * Route protection component for owner-only actions/pages.
 * Shows clear login prompt for unauthenticated users,
 * and 403 Forbidden notice for users with non-owner roles.
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const token = getAuthToken()
  const userRole = getUserRole()

  // 1. Unauthenticated request -> Show Login required state
  if (!token) {
    return (
      <div className="py-16 px-5 max-w-[600px] mx-auto text-center">
        <div className="bg-white border border-amber-200 rounded-xl p-8 shadow-sm">
          <span className="text-4xl mb-4 inline-block">🔒</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You must be logged in {requiredRole ? `as a ${requiredRole}` : ''} to access this page.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-green-800 text-white font-semibold rounded-md hover:bg-green-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/equipment"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 2. Authenticated but lacks required role (e.g. FARMER) -> 403 Forbidden state
  if (requiredRole && userRole?.toUpperCase() !== requiredRole.toUpperCase()) {
    return (
      <div className="py-16 px-5 max-w-[600px] mx-auto text-center">
        <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
          <span className="text-4xl mb-4 inline-block">⛔</span>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Forbidden</h1>
          <p className="text-gray-600 mb-2">
            Only accounts with the <strong>{requiredRole}</strong> role have permission to perform this action.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current account role is: <span className="font-semibold text-gray-800">{userRole || 'Unknown'}</span>.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/equipment"
              className="px-6 py-2.5 bg-green-800 text-white font-semibold rounded-md hover:bg-green-900 transition-colors"
            >
              Browse Equipment
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Authorized -> Render protected content
  return <>{children}</>
}
