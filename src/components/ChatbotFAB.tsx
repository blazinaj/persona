import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { PersonaAIChat } from './PersonaAIChat';
import CreatePersonaModal from './CreatePersonaModal';
import EditPersonaModal from './EditPersonaModal';

export const ChatbotFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-xl transform transition-all duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
          <p className="text-sm text-gray-600">How can I help you manage your personas?</p>
        </div>
        <div className="p-4">
          <PersonaAIChat
            action="create"
            onOpenCreateForm={() => {
              setIsCreateModalOpen(true);
              setIsOpen(false);
            }}
            onOpenEditForm={(data) => {
              setEditingPersona(data);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </div>
      {/* Modals */}
      <CreatePersonaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data) => {
          // Handle create submission
          setIsCreateModalOpen(false);
        }}
      />
      {editingPersona && (
        <EditPersonaModal
          isOpen={true}
          persona={editingPersona}
          onClose={() => setEditingPersona(null)}
          onSubmit={async (id, data) => {
            // Handle edit submission
            setEditingPersona(null);
          }}
        />
      )}
    </>
  );
};