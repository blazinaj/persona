import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Mail, Chrome, AlertCircle, Check } from 'lucide-react';
import Button from './ui/Button';
import { signIn, signUp, resetPassword, signInWithGoogle } from '../lib/auth';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup' | 'reset';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema),
  });

  // Store the current path to redirect back after login
  useEffect(() => {
    if (isOpen) {
      // Reset form state when modal opens
      setError(null);
      setSuccess(null);
      setMode('signin');
    }
  }, [isOpen]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      switch (mode) {
        case 'signin': {
          const { error } = await signIn(data.email, data.password);
          if (error) throw error;
          onClose();
          // Stay on the same page after login
          break;
        }
        case 'signup': {
          const { error } = await signUp(data.email, data.password);
          if (error) throw error;
          setSuccess('Please check your email to confirm your account');
          break;
        }
        case 'reset': {
          const { error } = await resetPassword(data.email);
          if (error) throw error;
          setSuccess('Password reset instructions have been sent to your email');
          break;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }
      // Redirect happens automatically after successful OAuth sign-in
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
              )}
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              leftIcon={loading ? <Loader2 className="animate-spin" /> : <Mail size={16} />}
            >
              {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </Button>
            
            {mode !== 'reset' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  loading={googleLoading}
                  onClick={handleGoogleSignIn}
                  leftIcon={<Chrome size={16} />}
                >
                  Google
                </Button>
              </>
            )}
          </form>

          {error && error.includes('Google') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <p>
                Google sign-in may not work properly if you're using an incognito window or have strict privacy settings.
              </p>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            {mode === 'signin' ? (
              <>
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Need an account? Sign up
                </button>
                <span className="mx-2">•</span>
                <button
                  onClick={() => setMode('reset')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:text-blue-800"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};