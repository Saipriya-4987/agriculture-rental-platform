import { useState } from 'react'

// M3 step 7: Register page component.
// Based on the <section class="auth-section"> markup in frontend/register.html,
// with the validation behaviour of frontend/js/main.js's registerForm block
// (validateRegisterForm/handleRegisterSubmit) re-implemented in React (not
// imported - main.js is never used here). Frontend-only: this never creates
// an account, same as the original page.

// Same patterns used by main.js's validateRegisterForm().
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Optional leading "+", then 10-15 digits - loose enough for Indian
// mobile numbers (with or without a country code) without being strict
// about a specific country's format.
const PHONE_PATTERN = /^\+?\d{10,15}$/

// Same 1200ms pause used by main.js's REDIRECT_DELAY_MS, so the success
// message is still readable before the "redirect" happens.
const REDIRECT_DELAY_MS = 1200

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  // "farmer" is pre-selected, same as the original HTML's
  // <input type="radio" name="role" value="farmer" checked>.
  const [role, setRole] = useState('farmer')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)

  // Same five rules as main.js's validateRegisterForm(), just returning an
  // errors object instead of inserting <span class="field-error"> elements.
  function validateRegisterForm() {
    const newErrors = {}

    if (name.trim() === '') {
      newErrors.name = 'Please enter your full name.'
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail === '') {
      newErrors.email = 'Please enter your email address.'
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address (e.g. you@example.com).'
    }

    const cleanedPhone = phone.trim().replace(/[\s-]/g, '')
    if (cleanedPhone === '') {
      newErrors.phone = 'Please enter your phone number.'
    } else if (!PHONE_PATTERN.test(cleanedPhone)) {
      newErrors.phone = 'Please enter a valid phone number (10-15 digits).'
    }

    if (password === '') {
      newErrors.password = 'Please enter a password.'
    }

    if (!role) {
      newErrors.role = 'Please select whether you are a Farmer or an Owner.'
    }

    return newErrors
  }

  function handleRegisterSubmit(event) {
    // This is a frontend-only demo - never actually submit/create an account.
    event.preventDefault()

    const newErrors = validateRegisterForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setMessage({ text: 'Registration form is valid.', type: 'success' })
      // Frontend-only "success flow": no backend/account is created, so
      // just send the user on to the Login page after a short pause long
      // enough to actually read the success message. No React Router yet,
      // so a plain window.location redirect (same as the original page).
      window.setTimeout(() => {
        window.location.href = 'login.html'
      }, REDIRECT_DELAY_MS)
    } else {
      setMessage({ text: 'Please fix the highlighted fields below.', type: 'error' })
    }
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Create your AgriRent account</h1>
          <p className="auth-subtext">Register as a Farmer to rent equipment, or an Owner to list it.</p>

          {message && (
            <p className={`form-message ${message.type}`} aria-live="polite">
              {message.text}
            </p>
          )}

          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <label htmlFor="reg-name">Full Name</label>
            <input
              type="text"
              id="reg-name"
              name="name"
              placeholder="e.g. Ramesh Naidu"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}

            <label htmlFor="reg-email">Email</label>
            <input
              type="email"
              id="reg-email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}

            <label htmlFor="reg-phone">Phone Number</label>
            <input
              type="tel"
              id="reg-phone"
              name="phone"
              placeholder="9876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}

            <label htmlFor="reg-password">Password</label>
            <input
              type="password"
              id="reg-password"
              name="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}

            <fieldset className="role-fieldset">
              <legend>I am registering as a</legend>

              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="farmer"
                  checked={role === 'farmer'}
                  onChange={(event) => setRole(event.target.value)}
                />
                Farmer &mdash; I want to rent equipment
              </label>

              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={role === 'owner'}
                  onChange={(event) => setRole(event.target.value)}
                />
                Owner &mdash; I want to list equipment
              </label>
            </fieldset>
            {errors.role && <span className="field-error">{errors.role}</span>}

            <button type="submit" className="btn-auth">Create Account</button>
          </form>

          <p className="auth-switch">
            Already have an account? <a href="login.html">Log in here</a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register