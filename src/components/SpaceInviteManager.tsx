import React, { useState, useEffect } from 'react';
import { Clock, Copy, RefreshCw, ToggleLeft, ToggleRight, X, Mail, Key, Calendar, AlertTriangle, UserPlus, Check, Loader2, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import { Space } from '../types';

interface SpaceInviteManagerProps {
  space: Space;
  onClose?: () => void;
}

export const SpaceInviteManager: React.FC<SpaceInviteManagerProps> = ({ 
  space, 
  onClose
}) => {
  const [isInviteCodeEnabled, setIsInviteCodeEnabled] = useState(space.inviteCodeEnabled || false);
  const [inviteCode, setInviteCode] = useState(space.inviteCode || '');
  const [expiryDate, setExpiryDate] = useState<string | undefined>(
    space.inviteCodeExpiresAt 
      ? new Date(space.inviteCodeExpiresAt).toISOString().split('T')[0]
      : undefined
  );
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Direct invitation states
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Load pending invites
  useEffect(() => {
    fetchPendingInvites();
  }, [space.id]);
  
  const fetchPendingInvites = async () => {
    try {
      setLoadingInvites(true);
      
      // Get pending invitations
      const { data, error } = await supabase
        .from('space_invitations')
        .select(`
          id, 
          email, 
          role, 
          created_at,
          expires_at,
          created_by_id,
          profiles(display_name, avatar_url)
        `)
        .eq('space_id', space.id)
        .is('accepted_at', null);
        
      if (error) throw error;
      
      setPendingInvites(data || []);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    setIsGeneratingCode(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Determine expiry interval
      const expiryInterval = expiryDate 
        ? `${Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` 
        : null;
      
      // Call the function to generate a new code
      const { data: newCode, error } = await supabase
        .rpc('create_space_invite_code', { 
          space_id_input: space.id,
          expires_in: expiryInterval
        });

      if (error) throw error;
      
      // Update local state
      setInviteCode(newCode);
      setIsInviteCodeEnabled(true);
      setSuccess('Invite code generated successfully!');
      
      // Clear success message after a delay
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      setError(error.message || 'Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleToggleInviteCode = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      if (isInviteCodeEnabled) {
        // Disable the code
        const { error } = await supabase
          .rpc('disable_space_invite_code', { 
            space_id_input: space.id
          });

        if (error) throw error;
        
        setIsInviteCodeEnabled(false);
        setSuccess('Invite code disabled');
      } else {
        // Either generate a new code or re-enable the existing one
        await handleGenerateInviteCode();
      }
      
      // Clear success message after a delay
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error toggling invite code:', error);
      setError(error.message || 'Failed to update invite code settings');
    }
  };

  const copyInviteCode = async () => {
    if (!inviteCode) return;
    
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite code:', err);
    }
  };
  
  const copyInviteLink = async () => {
    if (!inviteCode) return;
    
    try {
      const inviteLink = `${window.location.origin}/spaces/join?code=${inviteCode}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };
  
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    setIsSendingInvite(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Send invitation
      const { data, error } = await supabase
        .rpc('create_space_invitation', {
          space_id_input: space.id,
          email_input: inviteEmail.trim(),
          role_input: inviteRole,
          expires_in: '7 days'
        });

      if (error) throw error;
      
      setSuccess('Invitation sent successfully!');
      setInviteEmail('');
      setShowInviteForm(false);
      
      // Refresh pending invites
      await fetchPendingInvites();
      
      // Clear success message after a delay
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setError(error.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };
  
  const handleCancelInvite = async (inviteId: string) => {
    setError(null);
    setSuccess(null);
    
    try {
      // Delete the invitation
      const { error } = await supabase
        .from('space_invitations')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      
      // Update local state
      setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
      setSuccess('Invitation canceled');
      
      // Clear success message after a delay
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      setError(error.message || 'Failed to cancel invitation');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Space Invites</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-start gap-2">
            <Check size={16} className="mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        {/* Invite Code Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Key size={16} className="text-blue-600" />
              <span>Invite Code</span>
            </h3>
            
            <div className="flex items-center">
              <button
                className={`p-1 rounded-full text-sm ${isInviteCodeEnabled ? 'text-green-600' : 'text-gray-400'}`}
                onClick={handleToggleInviteCode}
                disabled={isGeneratingCode}
                title={isInviteCodeEnabled ? 'Disable invite code' : 'Enable invite code'}
              >
                {isInviteCodeEnabled ? (
                  <ToggleRight size={24} className="text-green-600" />
                ) : (
                  <ToggleLeft size={24} />
                )}
              </button>
            </div>
          </div>
          
          {isInviteCodeEnabled ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md py-2 px-4 font-mono text-sm">
                  {inviteCode || 'No code generated'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteCode}
                  disabled={!inviteCode}
                  leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md py-2 px-4 text-xs truncate text-gray-500">
                  {`${window.location.origin}/spaces/join?code=${inviteCode}`}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                  disabled={!inviteCode}
                  leftIcon={copied ? <Check size={16} /> : <Share2 size={16} />}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
              
              {space.inviteCodeExpiresAt && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>Expires: {new Date(space.inviteCodeExpiresAt).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                    Expires After
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateInviteCode}
                    disabled={isGeneratingCode}
                    leftIcon={isGeneratingCode ? <Loader2 className="animate-spin" /> : <RefreshCw size={16} />}
                  >
                    {isGeneratingCode ? 'Generating...' : 'Regenerate'}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    id="expiryDate"
                    className="flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={expiryDate || ''}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpiryDate(undefined)}
                    disabled={!expiryDate}
                  >
                    No Expiry
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="text-sm text-gray-500 text-center">
                Generate an invite code to allow users to join this private space.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateInviteCode}
                disabled={isGeneratingCode}
                loading={isGeneratingCode}
                leftIcon={!isGeneratingCode ? <Key size={16} /> : undefined}
              >
                {isGeneratingCode ? 'Generating...' : 'Generate Invite Code'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Direct Invitations Section */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Mail size={16} className="text-blue-600" />
              <span>Direct Invitations</span>
            </h3>
            
            {!showInviteForm && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<UserPlus size={16} />}
                onClick={() => setShowInviteForm(true)}
              >
                Invite User
              </Button>
            )}
          </div>
          
          {showInviteForm && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${
                        inviteRole === 'member'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                      onClick={() => setInviteRole('member')}
                    >
                      Member
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md ${
                        inviteRole === 'admin'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                      onClick={() => setInviteRole('admin')}
                    >
                      Admin
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendInvite}
                    disabled={isSendingInvite || !inviteEmail.trim()}
                    loading={isSendingInvite}
                  >
                    Send Invitation
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Pending Invites List */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Pending Invitations</h4>
            
            {loadingInvites ? (
              <div className="flex justify-center py-4">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm border border-gray-100 rounded-lg">
                No pending invitations
              </div>
            ) : (
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500" />
                        <span className="font-medium">{invite.email}</span>
                        <Badge variant={invite.role === 'admin' ? 'primary' : 'secondary'}>
                          {invite.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Clock size={12} />
                        <span>Sent {new Date(invite.created_at).toLocaleDateString()}</span>
                        
                        {invite.expires_at && (
                          <>
                            <span>•</span>
                            <Calendar size={12} />
                            <span>Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleCancelInvite(invite.id)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>About Private Shared Spaces</span>
          </h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Invite codes can be shared with anyone you want to join your space</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Email invitations are sent directly to specific users</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>You can manage member permissions after they join</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Disable invite codes any time to prevent unauthorized access</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpaceInviteManager;