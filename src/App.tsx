import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CreatePersonaModal from './components/CreatePersonaModal';
import PersonaDetails from './components/PersonaDetails';
import { mockPersonas } from './data/mockData';
import { Persona } from './types';

function App() {
  const [personas, setPersonas] = useState<Persona[]>(mockPersonas);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleCreatePersona = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleCreateSubmit = (data: any) => {
    const newPersona: Persona = {
      ...data,
      id: `${Date.now()}`,
      created: new Date(),
      lastModified: new Date()
    };
    
    setPersonas([...personas, newPersona]);
    setIsCreateModalOpen(false);
  };
  
  const handleEditPersona = (id: string) => {
    alert(`Edit persona with id: ${id}`);
    // In a real app, this would open an edit modal or navigate to an edit page
  };
  
  const handleDuplicatePersona = (id: string) => {
    const personaToDuplicate = personas.find(p => p.id === id);
    if (!personaToDuplicate) return;
    
    const newPersona: Persona = {
      ...personaToDuplicate,
      id: `${Date.now()}`,
      name: `${personaToDuplicate.name} (Copy)`,
      created: new Date(),
      lastModified: new Date()
    };
    
    setPersonas([...personas, newPersona]);
  };
  
  const handleDeletePersona = (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this persona? This action cannot be undone."
    );
    
    if (confirmDelete) {
      setPersonas(personas.filter(p => p.id !== id));
      navigate('/');
    }
  };
  
  const handleViewPersona = (id: string) => {
    navigate(`/personas/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onCreatePersona={handleCreatePersona} />
      <main>
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
      <CreatePersonaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}

export default App;