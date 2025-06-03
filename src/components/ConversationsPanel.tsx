import React from 'react';
import { MessageSquare, Edit2, Trash2, Clock, X } from 'lucide-react';
import Button from './ui/Button';

interface ConversationsPanelProps {
  conversations: any[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onClose?: () => void;
}

export const ConversationsPanel: React.FC<ConversationsPanelProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onClose
}) => {
  const [editingConversation, setEditingConversation] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const handleRename = (id: string) => {
    onRenameConversation(id, editTitle);
    setEditingConversation(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Conversations</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateConversation}
          >
            New Chat
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full"
            >
              <span className="sr-only">Close panel</span>
              <X size={18} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        {conversations.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <MessageSquare size={48} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start chatting to create your first conversation
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateConversation}
            >
              Start New Chat
            </Button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => editingConversation !== conversation.id && onSelectConversation(conversation.id)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                currentConversationId === conversation.id ? 'bg-blue-50' : ''
              }`}
            >
              <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingConversation === conversation.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(conversation.id);
                      } else if (e.key === 'Escape') {
                        setEditingConversation(null);
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border rounded"
                    autoFocus
                  />
                ) : (
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {conversation.title}
                  </div>
                )}
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingConversation(conversation.id);
                    setEditTitle(conversation.title);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Edit2 size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Trash2 size={14} className="text-gray-500" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};