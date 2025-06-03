import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronRight, ArrowLeft, Book, Code, Puzzle, Zap, MessageSquare, Users, Star, Wrench, Lock, Globe, Copy, Check, Info, FileText, X, Clock, BookOpen, Coffee, Terminal, Shield, Settings, Menu, Download } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Markdown } from '../components/ui/Markdown';
import { articles, categories } from '../data/articles';
import { APP_VERSION } from '../utils/constants';

const STORAGE_KEY_BOOKMARKS = 'persona_docs_bookmarks';
const STORAGE_KEY_RECENT = 'persona_docs_recent';
const STORAGE_KEY_LAST_VISITED = 'persona_docs_last_visited';

export const Resources = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // URL parameters
  const urlParams = new URLSearchParams(location.search);
  const articleParam = urlParams.get('article');
  const categoryParam = urlParams.get('category');
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(articleParam);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      // Load bookmarks
      const savedBookmarks = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
      
      // Load recently viewed
      const savedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
      if (savedRecent) {
        setRecentlyViewed(JSON.parse(savedRecent));
      }
      
      // Load last visited category
      const lastVisited = localStorage.getItem(STORAGE_KEY_LAST_VISITED);
      if (lastVisited && !categoryParam && !articleParam) {
        setSelectedCategory(lastVisited);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, [categoryParam, articleParam]);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);
  
  useEffect(() => {
    if (selectedCategory) {
      localStorage.setItem(STORAGE_KEY_LAST_VISITED, selectedCategory);
    }
  }, [selectedCategory]);

  // Scroll to top when selecting article
  useEffect(() => {
    if (selectedArticle && mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [selectedArticle]);

  // Update URL with selected article and category
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedArticle) {
      params.set('article', selectedArticle);
    }
    if (selectedCategory && !selectedArticle) {
      params.set('category', selectedCategory);
    }
    
    // Only update URL if something is selected
    if (selectedArticle || selectedCategory) {
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [selectedArticle, selectedCategory, navigate]);

  const toggleBookmark = (articleId: string) => {
    setBookmarks(prev => 
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleArticleClick = (articleId: string) => {
    setSelectedArticle(articleId);
    setSelectedCategory(null);
    
    // Update recently viewed
    setRecentlyViewed(prev => {
      const newRecent = [articleId, ...prev.filter(id => id !== articleId)].slice(0, 5);
      return newRecent;
    });
    
    // Close mobile menu when selecting an article
    setMobileMenuOpen(false);
  };
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    setMobileMenuOpen(false);
  };
  
  const handleBackToCategory = () => {
    if (selectedArticle) {
      const article = articles.find(a => a.id === selectedArticle);
      if (article) {
        setSelectedCategory(article.category);
        setSelectedArticle(null);
      }
    }
  };
  
  const handleBackToList = () => {
    setSelectedArticle(null);
    setSelectedCategory(null);
  };

  // Filter articles based on search term and selected category
  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } 
    // Filter by category if no search term
    else if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }
    
    // Sort articles
    if (sortBy === 'date') {
      return filtered.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
    }
    
    // For relevance, prioritize title matches, then description, then content
    if (searchTerm) {
      return filtered.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(searchTerm.toLowerCase());
        const bTitle = b.title.toLowerCase().includes(searchTerm.toLowerCase());
        if (aTitle !== bTitle) return bTitle ? 1 : -1;
        
        const aDesc = a.description.toLowerCase().includes(searchTerm.toLowerCase());
        const bDesc = b.description.toLowerCase().includes(searchTerm.toLowerCase());
        if (aDesc !== bDesc) return bDesc ? 1 : -1;
        
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      });
    }
    
    // Default sort by date
    return filtered.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [searchTerm, selectedCategory, sortBy, articles]);

  // Generate table of contents from article content
  const extractTableOfContents = (content: string) => {
    const headings: { level: number; text: string; id: string }[] = [];
    const regex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ level, text, id });
    }
    
    return headings;
  };

  // Create an article slug from title
  const getArticleSlug = (title: string) => {
    return title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  };
  
  // Copy the current article's link
  const copyArticleLink = () => {
    if (!selectedArticle) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('article', selectedArticle);
    
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render current article view
  const renderArticleView = () => {
    if (!selectedArticle) return null;
    
    const article = articles.find(a => a.id === selectedArticle);
    if (!article) return null;
    
    const tableOfContents = extractTableOfContents(article.content);
    const articleSlug = getArticleSlug(article.title);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 sm:p-8 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button
              onClick={handleBackToCategory}
              className="flex items-center hover:text-gray-700"
            >
              <ArrowLeft size={16} className="mr-1" />
              {categories.find(c => c.id === article.category)?.title || 'Back'}
            </button>
            {article.tags.map(tag => (
              <Badge 
                key={tag}
                variant="secondary"
                className="capitalize"
              >
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" id={articleSlug}>
              {article.title}
            </h1>
            <div className="flex items-center">
              <button
                onClick={() => toggleBookmark(article.id)}
                className={`p-2 rounded-full ${
                  bookmarks.includes(article.id)
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={bookmarks.includes(article.id) ? 'Remove bookmark' : 'Bookmark this article'}
              >
                <Star size={20} fill={bookmarks.includes(article.id) ? 'currentColor' : 'none'} />
              </button>
              
              <button
                onClick={copyArticleLink}
                className={`p-2 rounded-full ${
                  copied
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="Copy link to this article"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>

              <button
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className={`p-2 rounded-full md:hidden ${
                  showTableOfContents
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="Table of contents"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
          
          <p className="text-lg text-gray-600 mt-2">{article.description}</p>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <Clock size={16} className="mr-1" />
              Last updated: {new Date(article.lastUpdated).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            
            {tableOfContents.length > 0 && (
              <div className="hidden md:block">
                <button
                  onClick={() => setShowTableOfContents(!showTableOfContents)}
                  className="text-sm flex items-center text-blue-600 hover:text-blue-800"
                >
                  {showTableOfContents ? 'Hide Contents' : 'Show Contents'}
                  <ChevronRight size={16} className={`ml-1 transform transition-transform ${showTableOfContents ? 'rotate-90' : ''}`} />
                </button>
              </div>
            )}
          </div>
          
          {showTableOfContents && tableOfContents.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Table of Contents</h3>
              <ul className="space-y-1">
                {tableOfContents.map((heading, index) => (
                  <li 
                    key={index}
                    className="ml-[${(heading.level - 1) * 16}px]"
                    style={{ marginLeft: `${(heading.level - 1) * 16}px` }}
                  >
                    <a 
                      href={`#${heading.id}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(heading.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div 
          className="p-6 sm:p-8 prose prose-blue max-w-none"
          ref={mainContentRef}
        >
          <Markdown content={article.content} />

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-100">
            <div className="flex items-center text-gray-500">
              <Info size={16} className="mr-2" />
              <span className="text-sm">Was this article helpful?</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
              >
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render category view
  const renderCategoryView = () => {
    if (!selectedCategory || selectedArticle) return null;
    
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return null;
    
    const categoryArticles = filteredArticles.filter(article => 
      article.category === selectedCategory
    );
    
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToList}
                className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{category.title}</h1>
            </div>
            <p className="text-gray-600 mt-1">{category.description}</p>
          </div>
        </div>
        
        {categoryArticles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Book size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No articles found</h3>
            <p className="text-gray-500">
              No articles in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {categoryArticles.map(article => (
              <div
                key={article.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer"
                onClick={() => handleArticleClick(article.id)}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium text-lg text-gray-900">{article.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article.id);
                    }}
                    className={`p-1.5 rounded-full ${
                      bookmarks.includes(article.id)
                        ? 'text-blue-600'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Star size={16} fill={bookmarks.includes(article.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-gray-600 mt-2">{article.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{article.tags.length - 3}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(article.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-100 text-sm">
                  <span className="text-blue-600 flex items-center">
                    Read article <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render all categories view
  const renderCategoriesView = () => {
    if (selectedCategory || selectedArticle) return null;
    
    return (
      <div className="space-y-6">
        {searchTerm ? (
          // Search results view
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Search Results</h2>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Search size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
                <p className="text-gray-500">
                  Try adjusting your search term or browse the categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredArticles.map(article => (
                  <div
                    key={article.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer"
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg text-gray-900">{article.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Book size={14} className="mr-1" />
                          <span>{categories.find(c => c.id === article.category)?.title}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(article.id);
                        }}
                        className={`p-1.5 rounded-full ${
                          bookmarks.includes(article.id)
                            ? 'text-blue-600'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Star size={16} fill={bookmarks.includes(article.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-gray-600 mt-2">{article.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{article.tags.length - 3}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(article.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Categories grid view
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const categoryArticlesCount = articles.filter(article => article.category === category.id).length;
                const Icon = category.icon;
                
                return (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-6 cursor-pointer flex flex-col"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Icon size={20} />
                      </div>
                    </div>
                    <h3 className="font-medium text-lg text-gray-900">{category.title}</h3>
                    <p className="text-gray-600 mt-2 flex-1">{category.description}</p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{categoryArticlesCount} article{categoryArticlesCount !== 1 ? 's' : ''}</span>
                      <span className="text-sm text-blue-600 flex items-center">
                        Browse <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recently viewed section */}
            {recentlyViewed.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Viewed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyViewed.map(articleId => {
                    const article = articles.find(a => a.id === articleId);
                    if (!article) return null;
                    
                    return (
                      <div
                        key={article.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer"
                        onClick={() => handleArticleClick(article.id)}
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900">{article.title}</h3>
                          <Clock size={16} className="text-gray-400" />
                        </div>
                        <p className="text-gray-600 mt-1 text-sm line-clamp-2">{article.description}</p>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                          <Badge variant="secondary" className="text-xs">
                            {categories.find(c => c.id === article.category)?.title}
                          </Badge>
                          <span className="text-blue-600 text-xs">Read again</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Bookmarks section */}
            {bookmarks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Bookmarked Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarks.map(articleId => {
                    const article = articles.find(a => a.id === articleId);
                    if (!article) return null;
                    
                    return (
                      <div
                        key={article.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer"
                        onClick={() => handleArticleClick(article.id)}
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900">{article.title}</h3>
                          <Star size={16} className="text-blue-600" fill="currentColor" />
                        </div>
                        <p className="text-gray-600 mt-1 text-sm line-clamp-2">{article.description}</p>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                          <Badge variant="secondary" className="text-xs">
                            {categories.find(c => c.id === article.category)?.title}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(article.id);
                            }}
                            className="text-xs text-gray-500 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
                <Badge variant="primary" className="uppercase">v{APP_VERSION}</Badge>
              </div>
              <p className="text-lg text-gray-600">Complete guide to using the Persona platform</p>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setSelectedCategory(null);
                    setSelectedArticle(null);
                  }
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <nav className="space-y-8 sticky top-6">
              {/* Categories */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Documentation</h3>
                <ul className="space-y-2">
                  {categories.map(category => {
                    const CategoryIcon = category.icon;
                    const isActive = selectedCategory === category.id && !selectedArticle;
                    const categoryArticlesCount = articles.filter(article => article.category === category.id).length;
                    
                    return (
                      <li key={category.id}>
                        <button
                          onClick={() => handleCategoryClick(category.id)}
                          className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <CategoryIcon size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span>{category.title}</span>
                          </div>
                          <span className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                            {categoryArticlesCount}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Recently Viewed</h3>
                  <ul className="space-y-2">
                    {recentlyViewed.map(articleId => {
                      const article = articles.find(a => a.id === articleId);
                      if (!article) return null;
                      
                      const isActive = selectedArticle === article.id;
                      
                      return (
                        <li key={articleId}>
                          <button
                            onClick={() => handleArticleClick(articleId)}
                            className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Clock size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className="truncate">{article.title}</span>
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
                  <h3 className="font-medium text-gray-900 mb-3">Bookmarks</h3>
                  <ul className="space-y-2">
                    {bookmarks.map(articleId => {
                      const article = articles.find(a => a.id === articleId);
                      if (!article) return null;
                      
                      const isActive = selectedArticle === article.id;
                      
                      return (
                        <li key={articleId}>
                          <button
                            onClick={() => handleArticleClick(articleId)}
                            className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Star size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-blue-500'}`} fill="currentColor" />
                            <span className="truncate">{article.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Quick Links */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => navigate('/changelog')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Clock size={16} className="mr-2 text-gray-500" />
                      <span>Changelog</span>
                    </button>
                  </li>
                  <li>
                    <a 
                      href="https://github.com/your-repo/persona" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Code size={16} className="mr-2 text-gray-500" />
                      <span>GitHub</span>
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate('/api')}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Terminal size={16} className="mr-2 text-gray-500" />
                      <span>API Reference</span>
                    </button>
                  </li>
                  <li>
                    <a 
                      href="mailto:support@personify.mobi" 
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <MessageSquare size={16} className="mr-2 text-gray-500" />
                      <span>Contact Support</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Version Info */}
              <div className="pt-6 mt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Version {APP_VERSION}</span>
                  <a 
                    href="/changelog" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    What's new
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="fixed bottom-4 right-4 z-10 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div className="absolute inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-lg p-5 overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-medium text-gray-900">Documentation</h3>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                
                <nav className="space-y-6">
                  {/* Categories */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mb-2">Categories</h4>
                    <ul className="space-y-1">
                      {categories.map(category => {
                        const CategoryIcon = category.icon;
                        const isActive = selectedCategory === category.id && !selectedArticle;
                        
                        return (
                          <li key={category.id}>
                            <button
                              onClick={() => {
                                handleCategoryClick(category.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <CategoryIcon size={16} className={`mr-2 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                              <span>{category.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  
                  {/* Recent & Bookmarks sections - similar to desktop */}
                  {recentlyViewed.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mb-2">Recently Viewed</h4>
                      <ul className="space-y-1">
                        {recentlyViewed.map(articleId => {
                          const article = articles.find(a => a.id === articleId);
                          if (!article) return null;
                          
                          return (
                            <li key={articleId}>
                              <button
                                onClick={() => {
                                  handleArticleClick(articleId);
                                  setMobileMenuOpen(false);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                              >
                                <Clock size={16} className="mr-2 text-gray-500" />
                                <span className="truncate">{article.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {bookmarks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mb-2">Bookmarks</h4>
                      <ul className="space-y-1">
                        {bookmarks.map(articleId => {
                          const article = articles.find(a => a.id === articleId);
                          if (!article) return null;
                          
                          return (
                            <li key={articleId}>
                              <button
                                onClick={() => {
                                  handleArticleClick(articleId);
                                  setMobileMenuOpen(false);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                              >
                                <Star size={16} className="mr-2 text-blue-500" fill="currentColor" />
                                <span className="truncate">{article.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {/* Quick links */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mb-2">Quick Links</h4>
                    <ul className="space-y-1">
                      <li>
                        <button
                          onClick={() => {
                            navigate('/changelog');
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          <Clock size={16} className="mr-2 text-gray-500" />
                          <span>Changelog</span>
                        </button>
                      </li>
                      <li>
                        <a 
                          href="https://github.com/your-repo/persona" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          <Code size={16} className="mr-2 text-gray-500" />
                          <span>GitHub</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </nav>
                
                {/* Version info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Version {APP_VERSION}</span>
                    <a 
                      href="/changelog" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/changelog');
                        setMobileMenuOpen(false);
                      }}
                    >
                      What's new
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {renderArticleView()}
            {renderCategoryView()}
            {renderCategoriesView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;