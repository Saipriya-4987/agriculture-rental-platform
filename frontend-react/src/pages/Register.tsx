import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/api'

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?\d{10,15}$/
const REDIRECT_DELAY_MS = 1200

// M10 Step 1: User Registration connected to real Express/Prisma API.
function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [role, setRole] = useState<string>('farmer')
  const [errors, setErrors] = useState<FormErrors>({})
  const [message, setMessage] = useState<Message | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  function validateRegisterForm(): FormErrors {
    const newErrors: FormErrors = {}

    if (name.trim() === '') {
      newErrors.name = 'Please enter your full name.'
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.'
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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.'
    }

    if (!role) {
      newErrors.role = 'Please select whether you are a Farmer or an Owner.'
    }

    return newErrors
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const newErrors = validateRegisterForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true)
      setMessage(null)

      try {
        const cleanedPhone = phone.trim().replace(/[\s-]/g, '')
        await registerUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanedPhone,
          password,
          role: role.toUpperCase(),
        })

        setMessage({ text: 'Account created successfully! Redirecting to login...', type: 'success' })
        setTimeout(() => {
          navigate('/login')
        }, REDIRECT_DELAY_MS)
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : 'Registration failed. Please try again.',
          type: 'error',
        })
        setIsSubmitting(false)
      }
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
                placeholder="Create a password (min. 6 characters)"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-3 border-none rounded-md bg-green-800 text-white font-semibold hover:bg-green-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account? <Link to="/login" className="text-green-800 font-semibold no-underline hover:underline">Log in here</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register
