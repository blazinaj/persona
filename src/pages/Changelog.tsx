import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Code, Book, Star, Search, Download, Globe, Settings, Shield, Coffee, Tag, MessageSquare, Sparkles, CheckCircle, Bot, Info, Plus } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { APP_VERSION } from '../utils/constants';

// Define changelog entry types
type ChangeType = 'feature' | 'improvement' | 'bugfix' | 'security' | 'performance' | 'docs';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: ChangeType;
    title: string;
    description: string;
  }[];
  highlights?: string[];
}

// Define the changelog data
const changelog: ChangelogEntry[] = [
  {
    version: '2.0.0',
    date: 'May 2025',
    highlights: [
      'Complete redesign of the user interface',
      'Added AI-powered avatar generation',
      'Implemented custom JavaScript functions for personas',
      'Enhanced embedding options',
      'Added Spaces for collaborative AI interactions'
    ],
    changes: [
      {
        type: 'feature',
        title: 'Avatar Generator',
        description: 'Create unique avatars for your personas using AI or by uploading your own images.'
      },
      {
        type: 'feature',
        title: 'Custom Functions',
        description: 'Extend your personas with JavaScript functions for advanced capabilities.'
      },
      {
        type: 'feature',
        title: 'API Enhancements',
        description: 'Full access to all platform features via REST API with improved documentation.'
      },
      {
        type: 'feature',
        title: 'Embedding Improvements',
        description: 'Enhanced widget for embedding personas on websites with more customization options.'
      },
      {
        type: 'feature',
        title: 'Spaces Feature',
        description: 'Create collaborative spaces where multiple personas and users can interact.'
      },
      {
        type: 'improvement',
        title: 'Redesigned Dashboard',
        description: 'More intuitive layout with improved organization and navigation.'
      },
      {
        type: 'improvement',
        title: 'Dark Mode',
        description: 'System-wide dark mode support for reduced eye strain.'
      },
      {
        type: 'improvement',
        title: 'Mobile Optimization',
        description: 'Fully responsive design for all screen sizes.'
      },
      {
        type: 'feature',
        title: 'Community Features',
        description: 'Follow creators and discover popular personas.'
      },
      {
        type: 'improvement',
        title: 'Profile Customization',
        description: 'More options for personalizing your profile.'
      },
      {
        type: 'improvement',
        title: 'Enhanced Security',
        description: 'Improved authentication and data protection.'
      },
      {
        type: 'security',
        title: 'End-to-End Encryption',
        description: 'Optional end-to-end encryption for private conversations with personas.'
      }
    ]
  },
  {
    version: '1.5.0',
    date: 'March 2025',
    changes: [
      {
        type: 'feature',
        title: 'Conversation Management',
        description: 'Save, organize, and continue multiple conversations with your personas.'
      },
      {
        type: 'feature',
        title: 'Message Actions',
        description: 'Copy messages and download generated images.'
      },
      {
        type: 'feature',
        title: 'Smart Suggestions',
        description: 'Context-aware suggestions for chat interactions.'
      },
      {
        type: 'feature',
        title: 'Image Generation',
        description: 'Generate images using natural language descriptions.'
      },
      {
        type: 'improvement',
        title: 'Responsive Design',
        description: 'Improved mobile experience with better navigation.'
      },
      {
        type: 'improvement',
        title: 'Persona Creation',
        description: 'Enhanced workflow for creating and editing personas.'
      },
      {
        type: 'improvement',
        title: 'Chat Interface',
        description: 'Better message rendering and interaction options.'
      },
      {
        type: 'improvement',
        title: 'Analytics',
        description: 'More detailed analytics for persona usage.'
      },
      {
        type: 'bugfix',
        title: 'Conversation History',
        description: 'Fixed issues with conversation history not loading correctly.'
      },
      {
        type: 'bugfix',
        title: 'Authentication',
        description: 'Resolved authentication persistence problems.'
      }
    ]
  },
  {
    version: '1.0.0',
    date: 'January 2025',
    changes: [
      {
        type: 'feature',
        title: 'Initial Release',
        description: 'First public release of the Persona platform.'
      },
      {
        type: 'feature',
        title: 'Persona Creation',
        description: 'Design AI agents with unique personalities and knowledge areas.'
      },
      {
        type: 'feature',
        title: 'Chat Interface',
        description: 'Engage in conversations with your personas.'
      },
      {
        type: 'feature',
        title: 'Persona Management',
        description: 'Edit, duplicate, and delete personas.'
      },
      {
        type: 'feature',
        title: 'Explore Section',
        description: 'Discover and use public personas.'
      },
      {
        type: 'feature',
        title: 'Basic Embedding',
        description: 'Embed personas on websites.'
      },
      {
        type: 'feature',
        title: 'User Authentication',
        description: 'Secure account creation and management.'
      }
    ]
  }
];

// Function to get badge color for change type
const getChangeTypeBadgeVariant = (type: ChangeType) => {
  switch (type) {
    case 'feature':
      return 'primary';
    case 'improvement':
      return 'success';
    case 'bugfix':
      return 'warning';
    case 'security':
      return 'danger';
    case 'performance':
      return 'secondary';
    case 'docs':
      return 'default';
    default:
      return 'secondary';
  }
};

// Function to get icon for change type
const getChangeTypeIcon = (type: ChangeType) => {
  switch (type) {
    case 'feature':
      return <Sparkles size={16} />;
    case 'improvement':
      return <CheckCircle size={16} />;
    case 'bugfix':
      return <Code size={16} />;
    case 'security':
      return <Shield size={16} />;
    case 'performance':
      return <Download size={16} />;
    case 'docs':
      return <Book size={16} />;
    default:
      return <Info size={16} />;
  }
};

const Changelog: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ChangeType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter changes based on type and search term
  const filteredChangelog = changelog.map(release => {
    const filteredChanges = release.changes.filter(change => 
      (filter === 'all' || change.type === filter) && 
      (searchTerm === '' || 
       change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       change.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return {
      ...release,
      changes: filteredChanges,
      hasChanges: filteredChanges.length > 0
    };
  }).filter(release => release.hasChanges || searchTerm === '');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/resources')}
                className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Changelog</h1>
              <Badge variant="primary" className="ml-2">v{APP_VERSION}</Badge>
            </div>
            <p className="text-lg text-gray-600">Latest updates and improvements to the Persona platform</p>
            
            {/* Search and filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
              <div className="relative w-full sm:w-auto sm:flex-grow max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search changes..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'feature'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilter('feature')}
                >
                  Features
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'improvement'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilter('improvement')}
                >
                  Improvements
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'bugfix'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilter('bugfix')}
                >
                  Bugfixes
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filter === 'security'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilter('security')}
                >
                  Security
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {filteredChangelog.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No changes found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No changelog entries match your search criteria. Try adjusting your filters or search term.
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredChangelog.map((release, index) => (
              <div key={release.version} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900">{release.version}</h2>
                        <Badge variant="primary">
                          {release.date}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="success" className="ml-2">
                            Latest
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {release.highlights && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-blue-800 mb-2">Highlights</h3>
                            <ul className="space-y-1 list-disc list-inside text-blue-700">
                              {release.highlights.map((highlight, i) => (
                                <li key={i}>{highlight}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-5">
                  {/* Group changes by type */}
                  {filter === 'all' ? (
                    <div className="space-y-6">
                      {/* Features */}
                      {release.changes.filter(change => change.type === 'feature').length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles size={18} className="text-blue-600" />
                            <span>New Features</span>
                          </h3>
                          <ul className="space-y-3">
                            {release.changes
                              .filter(change => change.type === 'feature')
                              .map((change, i) => (
                                <li key={i} className="pl-6 relative">
                                  <div className="absolute left-0 top-1 flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-600 rounded-full">
                                    <Plus size={12} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{change.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Improvements */}
                      {release.changes.filter(change => change.type === 'improvement').length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-600" />
                            <span>Improvements</span>
                          </h3>
                          <ul className="space-y-3">
                            {release.changes
                              .filter(change => change.type === 'improvement')
                              .map((change, i) => (
                                <li key={i} className="pl-6 relative">
                                  <div className="absolute left-0 top-1 flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full">
                                    <CheckCircle size={12} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{change.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Bug Fixes */}
                      {release.changes.filter(change => change.type === 'bugfix').length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Code size={18} className="text-amber-600" />
                            <span>Bug Fixes</span>
                          </h3>
                          <ul className="space-y-3">
                            {release.changes
                              .filter(change => change.type === 'bugfix')
                              .map((change, i) => (
                                <li key={i} className="pl-6 relative">
                                  <div className="absolute left-0 top-1 flex items-center justify-center w-4 h-4 bg-amber-100 text-amber-600 rounded-full">
                                    <Code size={12} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{change.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Security */}
                      {release.changes.filter(change => change.type === 'security').length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Shield size={18} className="text-red-600" />
                            <span>Security</span>
                          </h3>
                          <ul className="space-y-3">
                            {release.changes
                              .filter(change => change.type === 'security')
                              .map((change, i) => (
                                <li key={i} className="pl-6 relative">
                                  <div className="absolute left-0 top-1 flex items-center justify-center w-4 h-4 bg-red-100 text-red-600 rounded-full">
                                    <Shield size={12} />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{change.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Other changes */}
                      {release.changes.filter(change => 
                        !['feature', 'improvement', 'bugfix', 'security'].includes(change.type)
                      ).length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Info size={18} className="text-gray-600" />
                            <span>Other Changes</span>
                          </h3>
                          <ul className="space-y-3">
                            {release.changes
                              .filter(change => 
                                !['feature', 'improvement', 'bugfix', 'security'].includes(change.type)
                              )
                              .map((change, i) => (
                                <li key={i} className="pl-6 relative">
                                  <div className="absolute left-0 top-1 flex items-center justify-center w-4 h-4 bg-gray-100 text-gray-600 rounded-full">
                                    {getChangeTypeIcon(change.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{change.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show filtered changes
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        {filter === 'feature' && <Sparkles size={18} className="text-blue-600" />}
                        {filter === 'improvement' && <CheckCircle size={18} className="text-green-600" />}
                        {filter === 'bugfix' && <Code size={18} className="text-amber-600" />}
                        {filter === 'security' && <Shield size={18} className="text-red-600" />}
                        <span>
                          {filter === 'feature' && 'Features'}
                          {filter === 'improvement' && 'Improvements'}
                          {filter === 'bugfix' && 'Bug Fixes'}
                          {filter === 'security' && 'Security Updates'}
                          {!['feature', 'improvement', 'bugfix', 'security'].includes(filter) && 'Changes'}
                        </span>
                      </h3>
                      <ul className="space-y-3">
                        {release.changes.map((change, i) => (
                          <li key={i} className="pl-6 relative">
                            <div className={`absolute left-0 top-1 flex items-center justify-center w-4 h-4 rounded-full ${
                              filter === 'feature' ? 'bg-blue-100 text-blue-600' :
                              filter === 'improvement' ? 'bg-green-100 text-green-600' :
                              filter === 'bugfix' ? 'bg-amber-100 text-amber-600' :
                              filter === 'security' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {getChangeTypeIcon(change.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{change.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            Looking for older versions? <a href="/resources" className="text-blue-600 hover:text-blue-800">View full release history</a>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Current version: v{APP_VERSION} — Released {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="mt-6">
            <Button 
              variant="outline"
              leftIcon={<Book size={16} />}
              onClick={() => navigate('/resources')}
            >
              Back to Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Changelog;