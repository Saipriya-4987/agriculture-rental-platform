import { useState, FormEvent, ChangeEvent } from 'react'

interface FormErrors {
  identifier?: string
  password?: string
}

interface Message {
  text: string
  type: 'success' | 'error'
}

// M3 step 7: Login page component.
// Based on the <section class="auth-section"> markup in frontend/login.html,
// with the validation behaviour of frontend/js/main.js's loginForm block
// (validateLoginForm/handleLoginSubmit) re-implemented in React (not
// imported - main.js is never used here). Frontend-only: this never
// authenticates anyone, same as the original page.

// Same 1200ms pause used by main.js's REDIRECT_DELAY_MS, so the success
// message is still readable before the "redirect" happens.
const REDIRECT_DELAY_MS = 1200

function Login() {
  const [identifier, setIdentifier] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  // Same two rules as main.js's validateLoginForm(), just returning an
  // errors object instead of inserting <span class="field-error"> elements.
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

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    // This is a frontend-only demo - never actually authenticate anyone.
    event.preventDefault()

    const newErrors = validateLoginForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setMessage({ text: 'Login form is valid.', type: 'success' })
      // Frontend-only "success flow": no backend/session exists, so just
      // send the user on to the Home page after a short pause long enough
      // to actually read the success message. No React Router yet, so a
      // plain window.location redirect (same as the original page).
      window.setTimeout(() => {
        window.location.href = 'index.html'
      }, REDIRECT_DELAY_MS)
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
    }
  }

  return (
    <section className="py-15 flex justify-center">
      <div className="w-full max-w-[420px] px-5">
        <div className="bg-white border border-gray-200 rounded-xl p-10">
          <h1 className="text-[1.5rem] mb-1.5">Log in to AgriRent</h1>
          <p className="text-gray-500 mb-6 text-[0.95rem]">Welcome back. Enter your details to continue.</p>

          {message && (
            <p className={`p-3 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} aria-live="polite">
              {message.text}
            </p>
          )}

          <form className="flex flex-col" onSubmit={handleLoginSubmit}>
            <div className="mb-4">
              <label htmlFor="login-identifier" className="text-sm font-semibold mb-1.5 block">Email or Phone Number</label>
              <input
                type="text"
                id="login-identifier"
                name="identifier"
                placeholder="you@example.com or 9876543210"
                value={identifier}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setIdentifier(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.identifier && <span className="text-red-600 text-sm block mt-1">{errors.identifier}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="login-password" className="text-sm font-semibold mb-1.5 block">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.password && <span className="text-red-600 text-sm block mt-1">{errors.password}</span>}
            </div>

            <a href="#" className="flex justify-end text-green-800 text-xs no-underline mb-4">Forgot password?</a>

            <button type="submit" className="px-5 py-3 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900">Log In</button>
          </form>

          <p className="text-center mt-6 text-sm">
            Don't have an account? <a href="register.html" className="text-gray-700">Register here</a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login
