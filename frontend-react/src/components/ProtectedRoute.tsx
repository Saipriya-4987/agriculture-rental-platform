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
      <section className="py-16 px-5 min-h-[60vh] flex items-center justify-center bg-[#f9fafb]">
        <div className="w-full max-w-[440px] bg-white border border-[#e5e7eb] rounded-[10px] p-8 shadow-sm text-center">
          <span className="text-4xl mb-4 inline-block">🔒</span>
          <h1 className="text-2xl font-bold text-[#1f2937] mb-2">Authentication Required</h1>
          <p className="text-gray-600 text-sm mb-6">
            You must be logged in {requiredRole ? `as a ${requiredRole}` : ''} to access this page.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm rounded-[6px] transition-colors shadow-sm"
            >
              Log In
            </Link>
            <Link
              to="/equipment"
              className="px-6 py-2.5 border border-[#d1d5db] text-gray-700 font-semibold text-sm rounded-[6px] hover:bg-gray-50 transition-colors"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // 2. Authenticated but lacks required role (e.g. FARMER) -> 403 Forbidden state
  if (requiredRole && userRole?.toUpperCase() !== requiredRole.toUpperCase()) {
    return (
      <section className="py-16 px-5 min-h-[60vh] flex items-center justify-center bg-[#f9fafb]">
        <div className="w-full max-w-[440px] bg-white border border-red-200 rounded-[10px] p-8 shadow-sm text-center">
          <span className="text-4xl mb-4 inline-block">⛔</span>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Forbidden</h1>
          <p className="text-gray-600 text-sm mb-2">
            Only accounts with the <strong>{requiredRole}</strong> role have permission to perform this action.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Your current account role is: <span className="font-semibold text-gray-800">{userRole || 'Unknown'}</span>.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/equipment"
              className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm rounded-[6px] transition-colors shadow-sm"
            >
              Browse Equipment
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 border border-[#d1d5db] text-gray-700 font-semibold text-sm rounded-[6px] hover:bg-gray-50 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // 3. Authorized -> Render protected content
  return <>{children}</>
}
