import { useState } from 'react'

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
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)

  // Same two rules as main.js's validateLoginForm(), just returning an
  // errors object instead of inserting <span class="field-error"> elements.
  function validateLoginForm() {
    const newErrors = {}

    if (identifier.trim() === '') {
      newErrors.identifier = 'Please enter your email or phone number.'
    }

    if (password === '') {
      newErrors.password = 'Please enter your password.'
    }

    return newErrors
  }

  function handleLoginSubmit(event) {
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
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Log in to AgriRent</h1>
          <p className="auth-subtext">Welcome back. Enter your details to continue.</p>

          {message && (
            <p className={`form-message ${message.type}`} aria-live="polite">
              {message.text}
            </p>
          )}

          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="login-identifier">Email or Phone Number</label>
            <input
              type="text"
              id="login-identifier"
              name="identifier"
              placeholder="you@example.com or 9876543210"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
            {errors.identifier && <span className="field-error">{errors.identifier}</span>}

            <label htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}

            <a href="#" className="forgot-link">Forgot password?</a>

            <button type="submit" className="btn-auth">Log In</button>
          </form>

          <p className="auth-switch">
            Don't have an account? <a href="register.html">Register here</a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login