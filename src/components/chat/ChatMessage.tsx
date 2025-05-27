import React from 'react';
import { Loader2, Copy, Check, Download, Volume2, VolumeX } from 'lucide-react';
import { Markdown } from '../ui/Markdown';
import { Avatar } from '../ui/Avatar';
import { getAvatarUrl } from '../../utils/avatarHelpers';
import { Persona } from '../../types';

interface ChatMessageProps {
  message: any;
  persona: Persona;
  isSpeaking: boolean;
  copiedMessageId: string | null;
  setCopiedMessageId: (id: string | null) => void;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  setError: (error: string | null) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  persona,
  isSpeaking,
  copiedMessageId,
  setCopiedMessageId,
  speakText,
  stopSpeaking,
  setError
}) => {
  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Stop any ongoing speech when copying
      if (isSpeaking) {
        stopSpeaking();
      }
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error('Invalid image URL');
      }

      let response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          Accept: 'image/*',
        },
      });

      if (!response.ok && response.type === 'opaque') {
        response = await fetch(imageUrl, {
          mode: 'no-cors',
          headers: {
            Accept: 'image/*',
          },
        });
      }

      if (!response.ok && response.status !== 0) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        throw new Error('Invalid content type: Expected an image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extension = contentType ? contentType.split('/')[1] : 'png';
      link.download = `generated-image-${Date.now()}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Image download error:', err);
      let errorMessage = 'Failed to download image';

      if (err.message.includes('Invalid image URL')) {
        errorMessage = 'Invalid image URL provided';
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Failed to fetch image: ${err.message}`;
      } else if (err.message.includes('Invalid content type')) {
        errorMessage = 'Invalid file type: Expected an image';
      }

      setError(errorMessage);
    }
  };

  return (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex items-start space-x-2 max-w-[80%] ${
          message.role === 'user'
            ? 'flex-row-reverse space-x-reverse'
            : 'flex-row'
        }`}
      >
        {message.role === 'assistant' && (
          <Avatar
            src={getAvatarUrl(persona)}
            name={persona.name}
            className="w-8 h-8 mt-1"
          />
        )}
        <div
          className={`rounded-lg p-3 ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Markdown content={message.content} />
              <div
                className={`flex items-center space-x-2 mt-2 text-xs justify-end ${
                  message.role === 'user'
                    ? 'justify-start text-blue-200'
                    : 'justify-end text-gray-400'
                }`}
              >
                {message.role === 'assistant' && (
                 <>
                   <button
                     onClick={() => {
                       const textContent = message.content.replace(/!\[.*?\]\(.*?\)/g, '').trim();
                       if (isSpeaking && copiedMessageId === message.id) {
                         stopSpeaking();
                       } else {
                         setCopiedMessageId(message.id);
                         speakText(textContent);
                       }
                     }}
                     className="hover:text-gray-600 transition-colors"
                     title="Listen to message"
                   >
                     {isSpeaking && copiedMessageId === message.id ? (
                       <VolumeX size={14} />
                     ) : (
                       <Volume2 size={14} />
                     )}
                   </button>
                   <button
                     onClick={() =>
                       handleCopyMessage(message.content, message.id)
                     }
                     className="hover:text-gray-600 transition-colors"
                     title="Copy message"
                   >
                     {copiedMessageId === message.id && !isSpeaking ? (
                       <Check size={14} />
                     ) : (
                       <Copy size={14} />
                     )}
                   </button>
                 </>
                )}

                {message.content.includes('![') && (
                  <button
                    onClick={() => {
                      const imageUrl = message.content.match(
                        /!\[.*?\]\((.*?)\)/
                      )?.[1];
                      if (imageUrl) {
                        handleDownloadImage(imageUrl);
                      }
                    }}
                    className="hover:text-gray-600 transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;