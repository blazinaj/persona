import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2, ArrowRight, Chrome, AlertCircle, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import { signIn, signUp, signInWithGoogle } from '../lib/auth';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(data.email, data.password);
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) throw error;
        setSuccess('Account created! Please check your email to confirm your account.');
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
    setSuccess(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-4">
              <span className="font-bold text-xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Persona</h1>
            <p className="text-gray-600 mt-2">Create and manage AI personas with unique personalities</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
              )}
            </div>
          
            {success && (
              <div className="rounded-lg bg-green-50 p-4 flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={loading}
              leftIcon={loading ? <Loader2 className="animate-spin" /> : undefined}
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>

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
              loading={googleLoading}
              fullWidth
              size="lg"
              onClick={handleGoogleSignIn}
              leftIcon={<Chrome size={16} />}
            >
              Google
            </Button>

            {error && error.includes('Google') && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle size={16} className="mt-0.5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm text-yellow-700">
                      Google sign-in may not work properly if you're using an incognito window or have strict privacy settings.
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Try using a regular browser window or temporarily disable tracking prevention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8">
        <div className="w-full max-w-lg mx-auto flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-8">Create Powerful AI Personas</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ArrowRight size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Customizable Personalities</h3>
                <p className="text-white/80">Design AI agents with unique traits, knowledge areas, and communication styles</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ArrowRight size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Intelligent Conversations</h3>
                <p className="text-white/80">Engage in natural dialogues with AI personas that maintain consistent personalities</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <ArrowRight size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Easy Management</h3>
                <p className="text-white/80">Create, edit, and organize your personas with an intuitive interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;