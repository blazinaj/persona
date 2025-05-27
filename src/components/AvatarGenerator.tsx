import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Image, Loader2, Sparkles, Download, RefreshCw, Check, Copy } from 'lucide-react';
import Button from './ui/Button';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { getAvatarUrl } from '../utils/avatarHelpers';

const avatarSchema = z.object({
  prompt: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  style: z.enum(['realistic', 'cartoon', 'anime', 'digital-art', 'oil-painting', 'watercolor']).default('realistic'),
});

type AvatarFormData = z.infer<typeof avatarSchema>;

interface AvatarGeneratorProps {
  onSelectAvatar: (url: string) => void;
  onClose: () => void;
  initialAvatar?: string;
}

export const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ 
  onSelectAvatar, 
  onClose,
  initialAvatar
}) => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(initialAvatar || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<AvatarFormData>({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      style: 'realistic',
    }
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 5242880, // 5MB
    onDrop: handleImageDrop,
    disabled: isUploading,
  });

  async function handleImageDrop(acceptedFiles: File[]) {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setError(null);
    setIsUploading(true);
    
    try {
      // Create a preview
      const preview = URL.createObjectURL(file);
      setUploadedImage(preview);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('persona-avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('persona-avatars')
        .getPublicUrl(filePath);
        
      setUploadedImage(filePath);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  const onSubmit = async (data: AvatarFormData) => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress('Preparing your request...');
    
    try {
      setGenerationProgress('Creating your avatar...');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-avatar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            prompt: data.prompt,
            style: data.style,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate avatar');
      }
      
      const result = await response.json();
      
      if (!result || !result.imageUrl) {
        throw new Error('No image was generated');
      }
      
      // Store the path, not the full URL
      setGeneratedImage(result.imageUrl); 
    } catch (error) {
      console.error('Error generating avatar:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate avatar');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleSelectAvatar = () => {
    if (activeTab === 'generate' && generatedImage) {
      onSelectAvatar(generatedImage);
    } else if (activeTab === 'upload' && uploadedImage) {
      onSelectAvatar(uploadedImage);
    }
  };

  const handleDownloadImage = async () => {
    const imageUrl = activeTab === 'generate' ? generatedImage : uploadedImage;
    if (!imageUrl) return;
        
    try {
      const response = await fetch(getAvatarUrl(imageUrl));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `persona-avatar-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image');
    }
  };

  const handleCopyImageUrl = async () => {
    const imageUrl = activeTab === 'generate' ? generatedImage : uploadedImage;
    if (!imageUrl) return;
        
    try {
      await navigator.clipboard.writeText(getAvatarUrl(imageUrl));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
      setError('Failed to copy image URL');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-3xl transform rounded-xl bg-white p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Avatar Generator</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span>AI Generate</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium text-sm border-b-2 ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload size={16} />
                <span>Upload</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side - Form or Upload */}
            <div>
              {activeTab === 'generate' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe your avatar
                    </label>
                    <textarea
                      {...register('prompt')}
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Describe physical characteristics, style, expression, etc."
                    />
                    {errors.prompt && (
                      <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['realistic', 'cartoon', 'anime', 'digital-art', 'oil-painting', 'watercolor'].map((style) => (
                        <label
                          key={style}
                          className={`flex items-center justify-center p-2 rounded border cursor-pointer transition-colors ${
                            watch('style') === style
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            value={style}
                            {...register('style')}
                            className="sr-only"
                          />
                          <span className="text-sm capitalize">{style.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={isGenerating}
                    leftIcon={isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                  >
                    {isGenerating ? generationProgress : 'Generate Avatar'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isUploading
                        ? 'bg-gray-100 border-gray-300'
                        : 'hover:bg-gray-50 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Drag and drop an image, or click to select
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Uploading...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Preview */}
            <div className="flex flex-col space-y-4">
              <div className="bg-gray-100 rounded-lg flex items-center justify-center h-64 overflow-hidden">
                {(activeTab === 'generate' && generatedImage) || (activeTab === 'upload' && uploadedImage) ? (
                  <img
                    ref={imageRef}
                    src={getAvatarUrl(activeTab === 'generate' ? generatedImage! : uploadedImage!)}
                    alt="Avatar preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6">
                    <Image size={48} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {activeTab === 'generate'
                        ? 'Generated avatar will appear here'
                        : 'Uploaded image will appear here'}
                    </p>
                  </div>
                )}
              </div>

              {((activeTab === 'generate' && generatedImage) || (activeTab === 'upload' && uploadedImage)) && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={handleDownloadImage}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                    onClick={handleCopyImageUrl}
                  >
                    {copied ? 'Copied!' : 'Copy URL'}
                  </Button>
                  {activeTab === 'generate' && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<RefreshCw size={16} />}
                      onClick={() => handleSubmit(onSubmit)()}
                      disabled={isGenerating}
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSelectAvatar}
                disabled={
                  (activeTab === 'generate' && !generatedImage) ||
                  (activeTab === 'upload' && !uploadedImage)
                }
              >
                Use This Avatar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarGenerator;