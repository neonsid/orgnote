'use client'

import { useReducer } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleLogoIcon } from '@phosphor-icons/react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginClick: () => void
}

interface SignupState {
  name: string
  email: string
  password: string
  confirmPassword: string
  loading: boolean
  googleLoading: boolean
  error: string
}

type SignupAction =
  | {
      type: 'SET_FIELD'
      field: 'name' | 'email' | 'password' | 'confirmPassword'
      value: string
    }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_GOOGLE_LOADING'; value: boolean }
  | { type: 'SET_ERROR'; value: string }
  | { type: 'CLEAR_ERROR' }

const initialSignupState: SignupState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  loading: false,
  googleLoading: false,
  error: '',
}

function signupReducer(state: SignupState, action: SignupAction): SignupState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_LOADING':
      return { ...state, loading: action.value }
    case 'SET_GOOGLE_LOADING':
      return { ...state, googleLoading: action.value }
    case 'SET_ERROR':
      return { ...state, error: action.value }
    case 'CLEAR_ERROR':
      return { ...state, error: '' }
    default:
      return state
  }
}

export function SignupDialog({
  open,
  onOpenChange,
  onLoginClick,
}: SignupDialogProps) {
  const [state, dispatch] = useReducer(signupReducer, initialSignupState)
  const router = useRouter()

  const handleLoginClick = () => {
    onOpenChange(false)
    onLoginClick()
  }

  const handleGoogleSignUp = async () => {
    dispatch({ type: 'SET_GOOGLE_LOADING', value: true })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      })
    } catch {
      dispatch({
        type: 'SET_ERROR',
        value: 'Failed to sign up with Google. Please try again.',
      })
      dispatch({ type: 'SET_GOOGLE_LOADING', value: false })
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'CLEAR_ERROR' })

    if (state.password !== state.confirmPassword) {
      dispatch({ type: 'SET_ERROR', value: 'Passwords do not match.' })
      return
    }

    if (state.password.length < 8) {
      dispatch({
        type: 'SET_ERROR',
        value: 'Password must be at least 8 characters.',
      })
      return
    }

    dispatch({ type: 'SET_LOADING', value: true })
    try {
      const result = await authClient.signUp.email({
        name: state.name,
        email: state.email,
        password: state.password,
      })
      if (result.error) {
        dispatch({
          type: 'SET_ERROR',
          value: result.error.message || 'Failed to create account.',
        })
      } else {
        onOpenChange(false)
        router.push('/dashboard')
      }
    } catch {
      dispatch({
        type: 'SET_ERROR',
        value: 'Failed to sign up. Please try again.',
      })
    } finally {
      dispatch({ type: 'SET_LOADING', value: false })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sign up</DialogTitle>
          <DialogDescription>
            Enter your details below to create your account
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border border-input bg-background"
            onClick={handleGoogleSignUp}
            disabled={state.googleLoading}
          >
            {state.googleLoading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <GoogleLogoIcon className="size-5" weight="bold" />
            )}
            Sign up with Google
          </Button>
          {state.error && (
            <p className="text-sm text-red-500 text-center">{state.error}</p>
          )}
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleEmailSignUp}>
            <div className="grid gap-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={state.name}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'name',
                    value: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="hello@example.com"
                autoComplete="email"
                value={state.email}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'email',
                    value: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={state.password}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'password',
                    value: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-confirm-password">Confirm password</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={state.confirmPassword}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'confirmPassword',
                    value: e.target.value,
                  })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={handleLoginClick}
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              Login
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
