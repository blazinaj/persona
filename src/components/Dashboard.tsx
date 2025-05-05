import React, { useState } from 'react';
import { Search, Filter, Plus, X } from 'lucide-react';
import { Persona } from '../types';
import PersonaCard from './PersonaCard';
import Button from './ui/Button';

interface DashboardProps {
  personas: Persona[];
  onCreatePersona: () => void;
  onEditPersona: (id: string) => void;
  onDuplicatePersona: (id: string) => void;
  onDeletePersona: (id: string) => void;
  onViewPersona: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  personas,
  onCreatePersona,
  onEditPersona,
  onDuplicatePersona,
  onDeletePersona,
  onViewPersona,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get all unique tags from personas
  const allTags = Array.from(
    new Set(personas.flatMap((persona) => persona.tags))
  );

  // Filter personas based on search term and active filters
  const filteredPersonas = personas.filter((persona) => {
    const matchesSearch =
      searchTerm === '' ||
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) => persona.tags.includes(filter));

    return matchesSearch && matchesFilters;
  });

  const toggleFilter = (tag: string) => {
    if (activeFilters.includes(tag)) {
      setActiveFilters(activeFilters.filter((t) => t !== tag));
    } else {
      setActiveFilters([...activeFilters, tag]);
    }
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Personas</h1>
          <p className="text-gray-600 mt-1">
            Manage and customize your AI personas
          </p>
        </div>
        
        <Button 
          variant="primary" 
          leftIcon={<Plus size={16} />}
          onClick={onCreatePersona}
        >
          Create New Persona
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search personas..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            leftIcon={<Filter size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
            {activeFilters.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </div>
        
        {/* Filter tags */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Filter by tags</h3>
              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFilter(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.includes(tag)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {filter}
                <button
                  type="button"
                  onClick={() => toggleFilter(filter)}
                  className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                >
                  <span className="sr-only">Remove filter for {filter}</span>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {filteredPersonas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
            <Search size={24} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No personas found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || activeFilters.length > 0
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Get started by creating a new persona."}
          </p>
          <div className="mt-6">
            <Button variant="primary" leftIcon={<Plus size={16} />} onClick={onCreatePersona}>
              Create New Persona
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={onEditPersona}
              onDuplicate={onDuplicatePersona}
              onDelete={onDeletePersona}
              onView={onViewPersona}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;