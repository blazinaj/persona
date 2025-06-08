/*
  # Add invite code support for private spaces
  
  1. Changes
    - Add invite_code column to spaces table
    - Create space_invitations table for tracking invites
    - Add functions for managing invites and invite codes
    - Add policies for space invitation access control
  
  2. Security
    - Only space owners/admins can generate invite codes
    - Invitations are protected by RLS policies
    - Invite codes are cryptographically secure random strings
*/

-- Add invite_code column to spaces table
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS invite_code text;

-- Add invite code settings
ALTER TABLE spaces
ADD COLUMN IF NOT EXISTS invite_code_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS invite_code_expires_at timestamptz;

-- Create space_invitations table
CREATE TABLE IF NOT EXISTS space_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid REFERENCES spaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(space_id, email)
);

-- Enable RLS on the new table
ALTER TABLE space_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for space_invitations
CREATE POLICY "Space owners and admins can manage invitations"
  ON space_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invitations.space_id
      AND spaces.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_invitations.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_invitations.space_id
      AND spaces.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM space_members
      WHERE space_members.space_id = space_invitations.space_id
      AND space_members.user_id = auth.uid()
      AND space_members.role = 'admin'
    )
  );

-- Users can view their own invitations
CREATE POLICY "Users can view their own invitations"
  ON space_invitations
  FOR SELECT
  TO authenticated
  USING (
    -- Compare email to user's email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Function to generate a secure random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate a secure random code
  new_code := encode(gen_random_bytes(9), 'hex');
  
  -- Format as XXX-XXX-XXX for readability
  new_code := substring(new_code, 1, 3) || '-' || 
              substring(new_code, 4, 3) || '-' || 
              substring(new_code, 7, 3);
              
  RETURN new_code;
END;
$$;

-- Function to create or refresh an invite code for a space
CREATE OR REPLACE FUNCTION create_space_invite_code(
  space_id_input uuid,
  expires_in interval DEFAULT interval '7 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  space_owner_id uuid;
BEGIN
  -- Check if user is authorized (space owner or admin)
  SELECT user_id INTO space_owner_id
  FROM spaces
  WHERE id = space_id_input;
  
  IF space_owner_id != auth.uid() AND
     NOT EXISTS (
       SELECT 1 FROM space_members
       WHERE space_id = space_id_input
       AND user_id = auth.uid()
       AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Not authorized to create invite code';
  END IF;

  -- Generate a new code
  new_code := generate_invite_code();
  
  -- Update the space with the new code and enable it
  UPDATE spaces
  SET 
    invite_code = new_code,
    invite_code_enabled = true,
    invite_code_expires_at = CASE 
      WHEN expires_in IS NULL THEN NULL 
      ELSE now() + expires_in 
    END
  WHERE id = space_id_input;
  
  RETURN new_code;
END;
$$;

-- Function to disable an invite code
CREATE OR REPLACE FUNCTION disable_space_invite_code(space_id_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_owner_id uuid;
BEGIN
  -- Check if user is authorized (space owner or admin)
  SELECT user_id INTO space_owner_id
  FROM spaces
  WHERE id = space_id_input;
  
  IF space_owner_id != auth.uid() AND
     NOT EXISTS (
       SELECT 1 FROM space_members
       WHERE space_id = space_id_input
       AND user_id = auth.uid()
       AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Not authorized to disable invite code';
  END IF;

  -- Disable the invite code
  UPDATE spaces
  SET 
    invite_code_enabled = false
  WHERE id = space_id_input;
  
  RETURN true;
END;
$$;

-- Function to create a direct invitation to a space
CREATE OR REPLACE FUNCTION create_space_invitation(
  space_id_input uuid,
  email_input text,
  role_input text DEFAULT 'member',
  expires_in interval DEFAULT interval '7 days'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_owner_id uuid;
  invitation_id uuid;
  invitation_token text;
BEGIN
  -- Check if user is authorized (space owner or admin)
  SELECT user_id INTO space_owner_id
  FROM spaces
  WHERE id = space_id_input;
  
  IF space_owner_id != auth.uid() AND
     NOT EXISTS (
       SELECT 1 FROM space_members
       WHERE space_id = space_id_input
       AND user_id = auth.uid()
       AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'Not authorized to create invitations';
  END IF;
  
  -- Validate role
  IF role_input NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role. Must be "admin" or "member"';
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN space_members sm ON u.id = sm.user_id
    WHERE u.email = email_input
    AND sm.space_id = space_id_input
  ) THEN
    RAISE EXCEPTION 'User is already a member of this space';
  END IF;
  
  -- Generate a token for the invitation
  invitation_token := encode(gen_random_bytes(24), 'hex');
  
  -- Create the invitation
  INSERT INTO space_invitations (
    space_id,
    email,
    token,
    role,
    created_at,
    expires_at,
    created_by_id
  ) VALUES (
    space_id_input,
    email_input,
    invitation_token,
    role_input,
    now(),
    CASE 
      WHEN expires_in IS NULL THEN NULL 
      ELSE now() + expires_in 
    END,
    auth.uid()
  )
  ON CONFLICT (space_id, email)
  DO UPDATE SET
    token = invitation_token,
    role = role_input,
    expires_at = CASE 
      WHEN expires_in IS NULL THEN NULL 
      ELSE now() + expires_in 
    END,
    created_at = now(),
    accepted_at = NULL
  RETURNING id INTO invitation_id;
  
  RETURN invitation_id;
END;
$$;

-- Function to accept a space invitation
CREATE OR REPLACE FUNCTION accept_space_invitation(invitation_token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation record;
  user_id_var uuid;
  user_email text;
  result jsonb;
BEGIN
  -- Get user details
  SELECT id, email INTO user_id_var, user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF user_id_var IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Find the invitation
  SELECT * INTO invitation
  FROM space_invitations
  WHERE token = invitation_token_input
  AND email = user_email
  AND accepted_at IS NULL;
  
  IF invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if invitation has expired
  IF invitation.expires_at IS NOT NULL AND invitation.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  -- Add user to space
  INSERT INTO space_members (
    space_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    invitation.space_id,
    user_id_var,
    invitation.role,
    now()
  )
  ON CONFLICT (space_id, user_id) 
  DO UPDATE SET
    role = invitation.role,
    joined_at = now();
  
  -- Mark invitation as accepted
  UPDATE space_invitations
  SET accepted_at = now()
  WHERE id = invitation.id;
  
  -- Get space details
  SELECT jsonb_build_object(
    'success', true,
    'space', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'is_public', s.is_public
    )
  ) INTO result
  FROM spaces s
  WHERE s.id = invitation.space_id;
  
  RETURN result;
END;
$$;

-- Function to join a space using an invite code
CREATE OR REPLACE FUNCTION join_space_with_code(invite_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_id_var uuid;
  user_id_var uuid;
  result jsonb;
  space_record record;
BEGIN
  -- Get user ID
  user_id_var := auth.uid();
  
  IF user_id_var IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Find the space with this invite code
  SELECT id, name, description, is_public, invite_code_expires_at
  INTO space_record
  FROM spaces
  WHERE invite_code = invite_code_input
  AND invite_code_enabled = true;
  
  IF space_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or disabled invite code');
  END IF;
  
  -- Check if the invite code has expired
  IF space_record.invite_code_expires_at IS NOT NULL 
     AND space_record.invite_code_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has expired');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM space_members
    WHERE space_id = space_record.id
    AND user_id = user_id_var
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this space');
  END IF;
  
  -- Add user to space
  INSERT INTO space_members (
    space_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    space_record.id,
    user_id_var,
    'member',
    now()
  );
  
  -- Return space details
  RETURN jsonb_build_object(
    'success', true,
    'space', jsonb_build_object(
      'id', space_record.id,
      'name', space_record.name,
      'description', space_record.description,
      'is_public', space_record.is_public
    )
  );
END;
$$;

-- Function to list a user's pending invitations
CREATE OR REPLACE FUNCTION get_pending_space_invitations()
RETURNS TABLE (
  id uuid,
  space_id uuid,
  space_name text,
  role text,
  created_at timestamptz,
  expires_at timestamptz,
  created_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN;
  END IF;
  
  -- Return pending invitations
  RETURN QUERY
  SELECT
    i.id,
    i.space_id,
    s.name as space_name,
    i.role,
    i.created_at,
    i.expires_at,
    COALESCE(p.display_name, u.email) as created_by_name
  FROM space_invitations i
  JOIN spaces s ON i.space_id = s.id
  LEFT JOIN auth.users u ON i.created_by_id = u.id
  LEFT JOIN profiles p ON i.created_by_id = p.id
  WHERE i.email = user_email
  AND i.accepted_at IS NULL
  AND (i.expires_at IS NULL OR i.expires_at > now())
  ORDER BY i.created_at DESC;
END;
$$;