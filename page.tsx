'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Handle messages from signup or email confirmation redirects
  useEffect(() => {
    const msg = searchParams.get('message')
    const err = searchParams.get('error')

    if (msg === 'check_email') {
      setMessage('Account created! Please check your email and click the confirmation link to activate your account.')
    } else if (err === 'confirm_failed') {
      setError('Email confirmation link expired or invalid. Please sign up again.')
    }
  }, [searchParams])

  // Redirect to home if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/') // Change this to your community dashboard route if different
      }
    }
    checkSession()
  }, [router, supabase])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Success — redirect to home or your main dashboard
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Cinematic Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tighter text-white">Nickhub</h1>
          <p className="mt-2 text-zinc-400">Sign in to access your media hub</p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-6 text-2xl font-semibold text-white">Welcome back</h2>

          {/* Messages */}
          {message && (
            <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-400">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="you@example.com"
              />
            </div>

            {/* Password with visibility toggle */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 pr-12 text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-zinc-400">
                <input type="checkbox" className="rounded border-white/20 bg-zinc-950" /> Remember me
              </label>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-zinc-950 transition-all hover:bg-white/90 active:scale-[0.985] disabled:bg-white/60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-400">
            Don’t have an account?{' '}
            <Link href="/signup" className="font-medium text-white hover:underline">
              Create one for free
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Secure login powered by Supabase • Leaked password protection enabled
        </p>
      </div>
    </div>
  )
}
