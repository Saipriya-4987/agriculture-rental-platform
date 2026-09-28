import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/api'

interface FormErrors {
  identifier?: string
  password?: string
}

interface Message {
  text: string
  type: 'success' | 'error'
}

const REDIRECT_DELAY_MS = 1000

// M10 Step 2: Login page connected to real JWT login API.
function Login() {
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  function validateLoginForm(): FormErrors {
    const newErrors: FormErrors = {}

    if (identifier.trim() === '') {
      newErrors.identifier = 'Please enter your email or phone number.'
    }

    if (password === '') {
      newErrors.password = 'Please enter your password.'
    }

    return newErrors
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors = validateLoginForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true)
      setMessage(null)

      try {
        const response = await loginUser({
          email: identifier.trim(),
          password,
        })

        setMessage({
          text: `Welcome back, ${response.user.name}! Redirecting...`,
          type: 'success',
        })

        setTimeout(() => {
          navigate('/')
        }, REDIRECT_DELAY_MS)
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : 'Invalid email or password.',
          type: 'error',
        })
        setIsSubmitting(false)
      }
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
    }
  }

  return (
    <section className="py-[60px] flex justify-center bg-[#f9fafb]">
      <div className="w-full max-w-[420px] px-5">
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-8 sm:p-10">
          <h1 className="text-[1.5rem] font-bold text-[#1f2937] mb-1.5">Log in to AgriRent</h1>
          <p className="text-[#6b7280] mb-6 text-[0.95rem]">Welcome back. Enter your details to continue.</p>

          {message && (
            <p
              className={`p-3 rounded-[6px] mb-6 font-semibold text-[0.9rem] ${
                message.type === 'success'
                  ? 'bg-green-100 text-[#166534] border border-[#d1fae5]'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
              aria-live="polite"
            >
              {message.text}
            </p>
          )}

          <form className="flex flex-col" onSubmit={handleLoginSubmit}>
            <div className="mb-4">
              <label htmlFor="login-identifier" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Email or Phone Number
              </label>
              <input
                type="text"
                id="login-identifier"
                name="identifier"
                placeholder="you@example.com or 9876543210"
                value={identifier}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setIdentifier(event.target.value)}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.identifier && <span className="text-red-600 text-xs block mt-1">{errors.identifier}</span>}
            </div>

            <div className="mb-2">
              <label htmlFor="login-password" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Password
              </label>
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.password && <span className="text-red-600 text-xs block mt-1">{errors.password}</span>}
            </div>

            <a href="#" className="self-end text-[0.85rem] text-[#166534] hover:underline mb-4">
              Forgot password?
            </a>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-auth"
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-center mt-6 text-[0.9rem] text-[#6b7280]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#166534] font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login
