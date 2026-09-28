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
    <section className="py-[60px] flex justify-center bg-[#f9fafb]">
      <div className="w-full max-w-[420px] px-5">
        <div className="bg-white border border-[#e5e7eb] rounded-[10px] p-8 sm:p-10">
          <h1 className="text-[1.5rem] font-bold text-[#1f2937] mb-1.5">Create your AgriRent account</h1>
          <p className="text-[#6b7280] mb-6 text-[0.95rem]">Register as a Farmer to rent equipment, or an Owner to list it.</p>

          {message && (
            <p
              className={`p-3 rounded-[6px] mb-4 font-semibold text-[0.9rem] ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-100 text-[#166534] border border-[#d1fae5]'
              }`}
              aria-live="polite"
            >
              {message.text}
            </p>
          )}

          <form className="flex flex-col" onSubmit={handleRegisterSubmit}>
            <div className="mb-4">
              <label htmlFor="reg-name" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Full Name
              </label>
              <input
                type="text"
                id="reg-name"
                name="name"
                placeholder="e.g. Ramesh Naidu"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.name && <span className="text-red-600 text-xs block mt-1">{errors.name}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-email" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Email
              </label>
              <input
                type="email"
                id="reg-email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.email && <span className="text-red-600 text-xs block mt-1">{errors.email}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-phone" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Phone Number
              </label>
              <input
                type="tel"
                id="reg-phone"
                name="phone"
                placeholder="9876543210"
                value={phone}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPhone(event.target.value)}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.phone && <span className="text-red-600 text-xs block mt-1">{errors.phone}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="reg-password" className="text-[0.9rem] font-semibold mb-1.5 block text-[#374151]">
                Password
              </label>
              <input
                type="password"
                id="reg-password"
                name="password"
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                className="px-[14px] py-3 border border-[#d1d5db] rounded-[6px] text-base text-[#1f2937] w-full focus:outline-none focus:border-[#166534]"
              />
              {errors.password && <span className="text-red-600 text-xs block mt-1">{errors.password}</span>}
            </div>

            <fieldset className="border border-[#d1d5db] rounded-[6px] p-3.5 mb-5">
              <legend className="text-[0.85rem] font-semibold text-[#374151] px-1">I am registering as a</legend>

              <label className="flex items-center gap-2 text-[#374151] text-[0.95rem] mt-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="farmer"
                  checked={role === 'farmer'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setRole(event.target.value)}
                  className="accent-[#166534]"
                />
                Farmer &mdash; I want to rent equipment
              </label>

              <label className="flex items-center gap-2 text-[#374151] text-[0.95rem] mt-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={role === 'owner'}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setRole(event.target.value)}
                  className="accent-[#166534]"
                />
                Owner &mdash; I want to list equipment
              </label>
            </fieldset>
            {errors.role && <span className="text-red-600 text-xs block -mt-3 mb-3">{errors.role}</span>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-auth"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[0.9rem] text-[#6b7280] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#166534] font-semibold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register
