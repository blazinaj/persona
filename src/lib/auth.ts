import { supabase } from './supabase';

// Helper to determine if we're in production (using a variable instead of a function)
const isProduction = window.location.hostname === 'personify.mobi' || 
                     window.location.hostname === 'www.personify.mobi';

export async function signInWithGoogle() {
  // Set the correct redirect URL based on environment
  const redirectTo = isProduction
    ? 'https://personify.mobi/auth/callback'
    : `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  return { data, error };
}

// Function to delete user account
export async function deleteAccount(userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      return { 
        success: false, 
        error: 'Not authorized to delete this account' 
      };
    }
    
    // Get the current session to use the access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'No active session'
      };
    }

    // Call the Edge Function to delete the account
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete account: ${response.status}`);
    }
    
    // Sign out after successful deletion
    await signOut();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account'
    };
  }
}