import React, { useState, useEffect, useMemo } from 'react';
import { Book, Code, Puzzle, Zap, MessageSquare, Users, Star, Wrench, Lock, Globe, Search, ChevronRight, ArrowRight, Bookmark, BookOpen } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { categories, articles } from '../data/articles';
import { Markdown } from '../components/ui/Markdown';

const STORAGE_KEY_BOOKMARKS = 'persona_docs_bookmarks';
const STORAGE_KEY_RECENT = 'persona_docs_recent';

export const Resources = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENT);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Save recently viewed to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const toggleBookmark = (articleId: string) => {
    setBookmarks(prev => 
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleArticleClick = (articleId: string) => {
    setSelectedArticle(articleId);
    
    // Update recently viewed
    setRecentlyViewed(prev => {
      const newRecent = [articleId, ...prev.filter(id => id !== articleId)].slice(0, 5);
      return newRecent;
    });
  };

  const filteredArticles = useMemo(() => articles.filter(article => {
    const matchesSearch = searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !selectedCategory || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }), [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
                <Badge variant="primary" className="uppercase">v2.0</Badge>
              </div>
              <p className="text-lg text-gray-600">
                Everything you need to know about creating and managing AI personas
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-8">
              {/* Categories */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
                <ul className="space-y-2">
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors gap-2 ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {React.createElement(category.icon, { size: 16, className: selectedCategory === category.id ? 'text-blue-600' : 'text-gray-500' })}
                        <span>{category.title}</span>
                        <ChevronRight size={16} className="ml-auto" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Recently Viewed</h3>
                  <ul className="space-y-2">
                    {recentlyViewed.map(articleId => {
                      const article = articles.find(a => a.id === articleId);
                      if (!article) return null;
                      return (
                        <li key={articleId}>
                          <button
                            onClick={() => handleArticleClick(articleId)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                          >
                            <BookOpen size={16} />
                            <span className="ml-2 truncate">{article.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Bookmarks */}
              {bookmarks.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Bookmarks</h3>
                  <ul className="space-y-2">
                    {bookmarks.map(articleId => {
                      const article = articles.find(a => a.id === articleId);
                      if (!article) return null;
                      return (
                        <li key={articleId}>
                          <button
                            onClick={() => handleArticleClick(articleId)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                          >
                            <Bookmark size={16} className="text-blue-600" />
                            <span className="ml-2 truncate">{article.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedArticle ? (
              // Article content view
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  {(() => {
                    const article = articles.find(a => a.id === selectedArticle);
                    if (!article) return null;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <button
                            onClick={() => setSelectedArticle(null)}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                          >
                            <ChevronRight size={16} className="rotate-180 mr-1" />
                            Back to articles
                          </button>
                          <button
                            onClick={() => toggleBookmark(article.id)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Bookmark
                              size={16}
                              className={bookmarks.includes(article.id) ? 'text-blue-600' : 'text-gray-400'}
                              fill={bookmarks.includes(article.id) ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                        <div className="prose prose-blue max-w-none">
                          <Markdown content={article.content} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              // Articles grid view
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredArticles.map(article => (
                  <div
                    key={article.id}
                    className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(article.id);
                          }}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <Bookmark
                            size={16}
                            className={bookmarks.includes(article.id) ? 'text-blue-600' : 'text-gray-400'}
                            fill={bookmarks.includes(article.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                      <p className="text-gray-600 mb-4">{article.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          Updated {new Date(article.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredArticles.length === 0 && (
                  <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <Search size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;