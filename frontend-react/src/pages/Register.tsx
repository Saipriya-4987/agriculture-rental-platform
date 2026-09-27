import { useState, FormEvent, ChangeEvent } from 'react'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  password?: string
  role?: string
}

interface Message {
  text: string
  type: 'success' | 'error'
}

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
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  // "farmer" is pre-selected, same as the original HTML's
  // <input type="radio" name="role" value="farmer" checked>.
  const [role, setRole] = useState<string>('farmer')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)

  // Same five rules as main.js's validateRegisterForm(), just returning an
  // errors object instead of inserting <span class="field-error"> elements.
  function validateRegisterForm(): FormErrors {
    const newErrors: FormErrors = {}

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

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
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
    <section className="py-15 flex justify-center">
      <div className="w-full max-w-[420px] px-5">
        <div className="bg-white border border-gray-200 rounded-xl p-10">
          <h1 className="text-[1.5rem] mb-1.5">Create your AgriRent account</h1>
          <p className="text-gray-500 mb-6 text-[0.95rem]">Register as a Farmer to rent equipment, or an Owner to list it.</p>

          {message && (
            <p className={`p-3 rounded-md mb-4 font-semibold text-[0.9rem] ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-800'}`} aria-live="polite">
              {message.text}
            </p>
          )}

          <form className="flex flex-col" onSubmit={handleRegisterSubmit}>
            <div className="mb-4">
              <label htmlFor="reg-name" className="text-sm font-semibold mb-1.5 block">Full Name</label>
              <input
                type="text"
                id="reg-name"
                name="name"
                placeholder="e.g. Ramesh Naidu"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.name && <span className="text-red-600 text-sm block mt-1">{errors.name}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-email" className="text-sm font-semibold mb-1.5 block">Email</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.email && <span className="text-red-600 text-sm block mt-1">{errors.email}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-phone" className="text-sm font-semibold mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                id="reg-phone"
                name="phone"
                placeholder="9876543210"
                value={phone}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.phone && <span className="text-red-600 text-sm block mt-1">{errors.phone}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-password" className="text-sm font-semibold mb-1.5 block">Password</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                placeholder="Create a password"
                value={password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
              {errors.password && <span className="text-red-600 text-sm block mt-1">{errors.password}</span>}
            </div>

            <fieldset className="border border-gray-300 rounded-md p-3.5 mb-5">
              <legend className="text-xs font-semibold text-gray-700 px-1">I am registering as a</legend>

              <label className="flex items-center gap-2 text-gray-700 text-[0.95rem] mt-2">
                <input
                  type="radio"
                  name="role"
                  value="farmer"
                  checked={role === 'farmer'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setRole(event.target.value)}
                />
                Farmer &mdash; I want to rent equipment
              </label>

              <label className="flex items-center gap-2 text-gray-700 text-[0.95rem] mt-2">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={role === 'owner'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setRole(event.target.value)}
                />
                Owner &mdash; I want to list equipment
              </label>
            </fieldset>
            {errors.role && <span className="text-red-600 text-sm block mt-1">{errors.role}</span>}

            <button type="submit" className="px-4 py-3 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900">Create Account</button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account? <a href="login.html" className="text-green-800 font-semibold no-underline hover:underline">Log in here</a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register
