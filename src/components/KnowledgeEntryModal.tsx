import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Book, Link, Info } from 'lucide-react';
import Button from './ui/Button';
import { KnowledgeEntry, KnowledgeCategory } from '../types';

const knowledgeCategories: KnowledgeCategory[] = [
  'skills',
  'experiences',
  'facts',
  'preferences',
  'concepts',
  'procedures',
  'references',
  'custom'
];

const knowledgeEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title must be 50 characters or less'),
  description: z.string().min(1, 'Description is required').max(10000, 'Description must be 10000 characters or less'),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  source: z.string().optional()
});

type KnowledgeEntryForm = z.infer<typeof knowledgeEntrySchema>;

interface KnowledgeEntryModalProps {
  isOpen: boolean;
  entry: KnowledgeEntry | null;
  onClose: () => void;
  onSubmit: (data: Partial<KnowledgeEntry>) => void;
}

const KnowledgeEntryModal: React.FC<KnowledgeEntryModalProps> = ({
  isOpen,
  entry,
  onClose,
  onSubmit
}) => {
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<KnowledgeEntryForm>({
    resolver: zodResolver(knowledgeEntrySchema),
    defaultValues: {
      title: entry?.title || '',
      description: entry?.description || '',
      category: entry?.category || '',
      source: entry?.source || ''
    }
  });

  React.useEffect(() => {
    if (entry) {
      setValue('title', entry.title);
      setValue('description', entry.description);
      setValue('category', entry.category);
      setValue('source', entry.source || '');
      
      // Check if we need to show custom category input
      if (!knowledgeCategories.includes(entry.category as KnowledgeCategory)) {
        setShowCustomCategory(true);
        setValue('customCategory', entry.category);
        setValue('category', 'custom');
      } else {
        setShowCustomCategory(false);
      }
    } else {
      reset({
        title: '',
        description: '',
        category: '',
        customCategory: '',
        source: ''
      });
      setShowCustomCategory(false);
    }
  }, [entry, setValue, reset]);

  const handleFormSubmit = (data: KnowledgeEntryForm) => {
    // If custom category is selected, use the custom category value
    const finalCategory = data.category === 'custom' && data.customCategory 
      ? data.customCategory 
      : data.category;
    
    onSubmit({
      title: data.title,
      description: data.description,
      category: finalCategory,
      source: data.source
    });
  };

  const selectedCategory = watch('category');

  React.useEffect(() => {
    setShowCustomCategory(selectedCategory === 'custom');
  }, [selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Book size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {entry ? 'Edit Knowledge Entry' : 'Add Knowledge Entry'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter a clear, concise title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-40"
                placeholder="Provide detailed information (max 10000 characters)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
              <div className="mt-1 text-xs text-gray-500 flex justify-end">
                <span>{watch('description')?.length || 0}/10000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {knowledgeCategories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {showCustomCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Category
                </label>
                <input
                  type="text"
                  {...register('customCategory')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter custom category"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('source')}
                  className="w-full pl-10 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="URL or reference information"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-700">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <p>
                Knowledge entries enhance your persona's capabilities by providing structured information it can reference during conversations.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {entry ? 'Update Entry' : 'Add Entry'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeEntryModal;