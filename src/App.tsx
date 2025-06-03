import { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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

function App() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [duplicatingPersona, setDuplicatingPersona] = useState<Persona | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      // Only fetch if we have a user with an ID
      if (currentUser?.id) fetchPersonas(currentUser.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.id) {
        fetchPersonas(currentUser.id); // Fetch personas when user ID is available
      } else { 
        setPersonas([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, signOut: handleSignOut }}>
      <div className="min-h-screen bg-gray-50">
        {user ? (
          <>
            <Navbar 
              onCreatePersona={handleCreatePersona}
              onSignIn={() => setIsAuthModalOpen(true)}
            />
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
                <Route path="/explore" element={<Explore />} />
                <Route path="/spaces/*" element={<Spaces />} />
                <Route path="/explore/personas/:id" element={<ExplorerPersonaDetails personas={personas} onBack={() => navigate('/explore')} />} />
                <Route path="/community" element={<Community />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/conversations" element={<Conversations />} />
                <Route path="/" element={
                  <Dashboard
                    personas={personas}
                    onCreatePersona={handleCreatePersona}
                    onEditPersona={handleEditPersona}
                    onDuplicatePersona={handleDuplicatePersona}
                    onDeletePersona={handleDeletePersona}
                    onViewPersona={handleViewPersona}
                  />
                } />
                <Route path="/api" element={<ApiDocs />} />
                <Route path="/profile" element={<Profile />} /> 
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/billing" element={<Settings />} />
                <Route path="/personas/:id" element={
                  <PersonaDetails
                    personas={personas}
                    onBack={() => navigate('/')}
                    onEdit={handleEditPersona}
                    onDuplicate={handleDuplicatePersona}
                    onDelete={handleDeletePersona}
                  />
                } />
              </Routes>
            </main>
          </>
        ) : (
          <Login />
        )}
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
    </AuthContext.Provider>
  );
}

export default App;