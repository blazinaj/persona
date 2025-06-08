import { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Explore from './pages/Explore';
import Community from './pages/Community';
import Resources from './pages/Resources';
import Spaces from './pages/Spaces';
import Profile from './pages/Profile'; 
import PublicProfile from './pages/PublicProfile';
import ApiDocs from './pages/ApiDocs';
import Conversations from './pages/Conversations';
import ExplorerPersonaDetails from './pages/ExplorerPersonaDetails';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Changelog from './pages/Changelog';
import CreatePersonaModal from './components/CreatePersonaModal';
import EditPersonaModal from './components/EditPersonaModal';
import Login from './pages/Login';
import PersonaDetails from './components/PersonaDetails';
import { AuthModal } from './components/AuthModal';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import { Persona } from './types';
import { supabase } from './lib/supabase';
import { AuthContext } from './lib/AuthContext';
import Onboarding from './components/Onboarding';
import { OnboardingProvider, useOnboarding } from './components/onboarding/OnboardingContext';
import RequireAuth from './components/RequireAuth';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [duplicatingPersona, setDuplicatingPersona] = useState<Persona | null>(null);
  const { user, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { hasCompletedOnboarding } = useOnboarding();

  useEffect(() => {
    if (user?.id) {
      fetchPersonas(user.id);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user?.id, isLoading]);

  // Handle auth callback
  useEffect(() => {
    // Check if this is an auth callback
    if (location.pathname === '/auth/callback') {
      // This will be handled by the Supabase auth listener
      console.log('Auth callback detected, handling authentication...');
      setLoading(true);
    }
  }, [location.pathname]);

  // Special handling for onboarding
  useEffect(() => {
    // Only redirect if the user is logged in, we know their onboarding status, and they're not already on the onboarding page
    if (user && !hasCompletedOnboarding && !isLoading && location.pathname !== '/onboarding') {
      console.log('Redirecting to onboarding from App.tsx');
      navigate('/onboarding');
    }
  }, [user, hasCompletedOnboarding, isLoading, navigate, location.pathname]);

  const fetchPersonas = async (userId: string) => {
    if (!userId) {
      console.error('Cannot fetch personas: No user ID provided');
      setLoading(false);
      setError('User ID is required to fetch personas');
      return;
    }

    try {
      setError(null); // Clear any previous errors
      
      // First verify the connection to Supabase
      const { error: healthCheckError } = await supabase.from('personas').select('count').limit(1);
      if (healthCheckError) {
        throw new Error('Failed to connect to database. Please check your connection and try again.');
      }

      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from database');
      }

      setPersonas(data.map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at),
        isPublic: p.visibility === 'public'
      })));
    } catch (error) {
      console.error('Error fetching personas:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch personas');
      setPersonas([]); // Reset personas on error
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePersona = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };
  
  const handleCreateSubmit = async (data: any) => {
    if (!user?.id) {
      console.error('Cannot create persona: No user ID available');
      return;
    }

    // Handle multiple personas if data.multiPersonas is present
    if (Array.isArray(data.multiPersonas) && data.multiPersonas.length > 0) {
      try {
        // Create each persona in sequence
        for (const personaData of data.multiPersonas) {
          const voiceSettings = {
            gender: personaData.voice?.gender || null,
            age: personaData.voice?.age || null,
            accent: personaData.voice?.accent || '',
            pitch: personaData.voice?.pitch || 1.0,
            rate: personaData.voice?.rate || 1.0
          };

          const { error } = await supabase
            .from('personas')
            .insert([{
              name: personaData.name,
              description: personaData.description,
              avatar: personaData.avatar,
              tags: personaData.tags || [],
              instructions: personaData.instructions || '',
              personality: personaData.personality || [],
              knowledge: personaData.knowledge || [],
              tone: personaData.tone,
              voice: voiceSettings,
              examples: personaData.examples || [],
              visibility: personaData.visibility || 'private',
              user_id: user.id
            }]);

          if (error) throw error;
        }

        await fetchPersonas(user.id);
        setIsCreateModalOpen(false);
      } catch (error) {
        console.error('Error creating multiple personas:', error);
        setError(error instanceof Error ? error.message : 'Failed to create multiple personas');
      }
      return;
    }

    try {
      // Ensure voice settings are properly structured as JSONB
      const voiceSettings = {
        gender: data.voice?.gender || null,
        age: data.voice?.age || null,
        accent: data.voice?.accent || '',
        pitch: data.voice?.pitch || 1.0,
        rate: data.voice?.rate || 1.0
      };
      
      const { error } = await supabase
        .from('personas')
        .insert([{
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          tags: data.tags || [],
          instructions: data.instructions || '',
          personality: data.personality || [],
          knowledge: data.knowledge || [],
          tone: data.tone,
          voice: voiceSettings,
          examples: data.examples || [],
          visibility: data.visibility,
          user_id: user.id
        }]);

      if (error) throw error;

      await fetchPersonas(user.id);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating persona:', error);
      setError(error instanceof Error ? error.message : 'Failed to create persona');
    }
  };
  
  const handleEditPersona = (id: string) => {
    const persona = personas.find(p => p.id === id);
    if (persona) {
      setEditingPersona(persona);
    }
  };
  
  const handleEditSubmit = async (id: string, data: any) => {
    if (!user?.id) {
      console.error('Cannot edit persona: No user ID available');
      return;
    }

    try {
      // Ensure voice settings are properly structured as JSONB
      const voiceSettings = {
        gender: data.voice?.gender || null,
        age: data.voice?.age || null,
        accent: data.voice?.accent || '',
        pitch: data.voice?.pitch || 1.0,
        rate: data.voice?.rate || 1.0
      };
      
      const { error } = await supabase
        .from('personas')
        .update({
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          tags: data.tags || [],
          instructions: data.instructions || '',
          personality: data.personality || [],
          knowledge: data.knowledge || [],
          tone: data.tone,
          voice: voiceSettings,
          examples: data.examples || [],
          visibility: data.visibility
        })
        .eq('id', id);

      if (error) throw error;

      await fetchPersonas(user.id);
      setEditingPersona(null);
    } catch (error) {
      console.error('Error updating persona:', error);
      setError(error instanceof Error ? error.message : 'Failed to update persona');
    }
  };
  
  const handleDuplicatePersona = async (id: string) => {
    if (!user?.id) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const personaToDuplicate = personas.find(p => p.id === id);
      if (!personaToDuplicate) return;

      const duplicateData = {
        ...personaToDuplicate,
        name: `${personaToDuplicate.name} (Copy)`,
        id: undefined
      };
      
      setEditingPersona(null); // Close any open edit modal
      setIsCreateModalOpen(true);
      setDuplicatingPersona(duplicateData);
    } catch (error) {
      console.error('Error duplicating persona:', error);
      setError(error instanceof Error ? error.message : 'Failed to duplicate persona');
    }
  };
  
  const handleDeletePersona = async (id: string) => {
    if (!user?.id) {
      console.error('Cannot delete persona: No user ID available');
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this persona? This action cannot be undone."
    );
    
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('personas')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await fetchPersonas(user.id);
        navigate('/');
      } catch (error) {
        console.error('Error deleting persona:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete persona');
      }
    }
  };
  
  const handleViewPersona = (id: string) => {
    navigate(`/personas/${id}`);
  };
  
  // If still checking authentication, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Special case for onboarding
  if (user && !hasCompletedOnboarding && location.pathname === '/onboarding') {
    return <Onboarding />;
  }
  
  // Check if we should hide the navbar on this page
  const hideNavbarPaths = ['/login', '/auth/callback', '/onboarding'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {!shouldHideNavbar && (
        <Navbar 
          onCreatePersona={handleCreatePersona}
          onSignIn={() => setIsAuthModalOpen(true)}
        />
      )}
      <main className={loading ? 'opacity-50' : ''}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400\" viewBox="0 0 20 20\" fill="currentColor">
                  <path fillRule="evenodd\" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route path="/explore" element={
            <RequireAuth>
              <Explore />
            </RequireAuth>
          } />
          <Route path="/spaces/*" element={
            <RequireAuth>
              <Spaces />
            </RequireAuth>
          } />
          <Route path="/explore/personas/:id" element={
            <RequireAuth>
              <ExplorerPersonaDetails personas={personas} onBack={() => navigate('/explore')} />
            </RequireAuth>
          } />
          <Route path="/community" element={
            <RequireAuth>
              <Community />
            </RequireAuth>
          } />
          <Route path="/resources" element={
            <RequireAuth>
              <Resources />
            </RequireAuth>
          } />
          <Route path="/changelog" element={
            <RequireAuth>
              <Changelog />
            </RequireAuth>
          } />
          <Route path="/conversations" element={
            <RequireAuth>
              <Conversations />
            </RequireAuth>
          } />
          <Route path="/" element={
            <RequireAuth>
              <Dashboard
                personas={personas}
                onCreatePersona={handleCreatePersona}
                onEditPersona={handleEditPersona}
                onDuplicatePersona={handleDuplicatePersona}
                onDeletePersona={handleDeletePersona}
                onViewPersona={handleViewPersona}
              />
            </RequireAuth>
          } />
          <Route path="/api" element={
            <RequireAuth>
              <ApiDocs />
            </RequireAuth>
          } />
          <Route path="/profile" element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          } /> 
          <Route path="/profile/:id" element={
            <RequireAuth>
              <PublicProfile />
            </RequireAuth>
          } />
          <Route path="/settings" element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          } />
          <Route path="/settings/billing" element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          } />
          <Route path="/personas/:id" element={
            <RequireAuth>
              <PersonaDetails
                personas={personas}
                onBack={() => navigate('/')}
                onEdit={handleEditPersona}
                onDuplicate={handleDuplicatePersona}
                onDelete={handleDeletePersona}
              />
            </RequireAuth>
          } />
          
          {/* Default route - redirect to login */}
          <Route path="*" element={<Navigate to="/login\" replace />} />
        </Routes>
      </main>
      <PWAInstallPrompt />
      <CreatePersonaModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setDuplicatingPersona(null);
        }}
        initialData={duplicatingPersona}
        onSubmit={handleCreateSubmit}
      />
      {editingPersona && (
        <EditPersonaModal
          isOpen={true}
          persona={editingPersona}
          onClose={() => setEditingPersona(null)}
          onSubmit={handleEditSubmit}
        />
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

// Component to handle auth callback
function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { hasCompletedOnboarding } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The auth state change is handled by the AuthContext
    // We just need to redirect based on the current state
    
    const checkAuthState = () => {
      if (error) {
        return; // Stay on this page if there's an error
      }
      
      if (user) {
        // User is logged in, redirect based on onboarding status
        if (!hasCompletedOnboarding) {
          navigate('/onboarding');
        } else {
          // If they've completed onboarding, go to dashboard
          navigate('/');
        }
      }
    };

    // Check immediately and also set a small delay to ensure auth state has updated
    checkAuthState();
    const timeout = setTimeout(checkAuthState, 1000);
    
    return () => clearTimeout(timeout);
  }, [user, hasCompletedOnboarding, navigate, error]);

  // Handle errors from the auth flow
  useEffect(() => {
    // Check for error parameters in the URL
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (errorMsg) {
      setError(`Authentication error: ${errorDescription || errorMsg}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm">
            <svg className="mx-auto h-12 w-12 text-red-500\" fill="none\" viewBox="0 0 24 24\" stroke="currentColor">
              <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-lg font-bold text-red-800">Authentication Failed</h2>
            <p className="mt-2 text-red-700">{error}</p>
            <div className="mt-6">
              <button 
                className="bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200"
                onClick={() => navigate('/login')}
              >
                Return to Login
              </button>
            </div>
          </div>
        ) : (
          <>
            <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Completing authentication...</p>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <OnboardingProvider>
      <AppContent />
    </OnboardingProvider>
  );
}

export default App;