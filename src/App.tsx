import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Explore from './pages/Explore';
import Community from './pages/Community';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import ExplorerPersonaDetails from './pages/ExplorerPersonaDetails';
import Billing from './pages/Billing';
import CreatePersonaModal from './components/CreatePersonaModal';
import EditPersonaModal from './components/EditPersonaModal';
import { Login } from './pages/Login';
import PersonaDetails from './components/PersonaDetails';
import { AuthModal } from './components/AuthModal';
import { Persona } from './types';
import { supabase } from './lib/supabase';
import { AuthContext } from './lib/AuthContext';

function App() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
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
      return;
    }

    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPersonas(data.map(p => ({
        ...p,
        created: new Date(p.created_at),
        lastModified: new Date(p.updated_at),
        isPublic: p.is_public
      })));
    } catch (error) {
      console.error('Error fetching personas:', error);
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

    try {
      const { error } = await supabase
        .from('personas')
        .insert([{
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          tags: data.tags || [],
          personality: data.personality || [],
          knowledge: data.knowledge || [],
          tone: data.tone,
          examples: data.examples || [],
          visibility: data.visibility,
          user_id: user.id
        }]);

      if (error) throw error;

      await fetchPersonas(user.id);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating persona:', error);
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
      const { error } = await supabase
        .from('personas')
        .update({
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          tags: data.tags || [],
          personality: data.personality || [],
          knowledge: data.knowledge || [],
          tone: data.tone,
          examples: data.examples || [],
          visibility: data.visibility
        })
        .eq('id', id);

      if (error) throw error;

      await fetchPersonas(user.id);
      setEditingPersona(null);
    } catch (error) {
      console.error('Error updating persona:', error);
    }
  };
  
  const handleDuplicatePersona = async (id: string) => {
    if (!user?.id) {
      console.error('Cannot duplicate persona: No user ID available');
      return;
    }

    try {
      const personaToDuplicate = personas.find(p => p.id === id);
      if (!personaToDuplicate) return;

      const { error } = await supabase
        .from('personas')
        .insert([{
          name: `${personaToDuplicate.name} (Copy)`,
          description: personaToDuplicate.description,
          avatar: personaToDuplicate.avatar,
          tags: personaToDuplicate.tags,
          personality: personaToDuplicate.personality,
          knowledge: personaToDuplicate.knowledge,
          tone: personaToDuplicate.tone,
          examples: personaToDuplicate.examples,
          is_public: personaToDuplicate.isPublic,
          user_id: user.id
        }]);

      if (error) throw error;

      await fetchPersonas(user.id);
    } catch (error) {
      console.error('Error duplicating persona:', error);
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
      }
    }
  };
  
  const handleViewPersona = (id: string) => {
    navigate(`/personas/${id}`);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  return (
    <AuthContext.Provider value={{ user, signOut: handleSignOut }}>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        ) : (
          <>
            <Navbar 
              onCreatePersona={handleCreatePersona}
              onSignIn={() => setIsAuthModalOpen(true)}
            />
            <main className={loading ? 'opacity-50' : ''}>
              <Routes>
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
                <Route path="/explore" element={<Explore />} />
                <Route path="/explore/personas/:id" element={<ExplorerPersonaDetails personas={personas} onBack={() => navigate('/explore')} />} />
                <Route path="/community" element={<Community />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings/billing" element={<Billing />} />
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
        )}
        <CreatePersonaModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
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