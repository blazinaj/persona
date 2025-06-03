/*
  # Add policy for joining public spaces
  
  1. New Policies
    - Add policy allowing authenticated users to join public spaces
    
  This migration adds a row-level security policy that allows authenticated users
  to add themselves as members to public spaces. The policy checks that:
  1. The user_id in the inserted record matches the authenticated user's ID
  2. The space being joined is marked as public
*/

-- Create policy that allows authenticated users to join public spaces
CREATE POLICY "Allow authenticated users to join public spaces"
ON public.space_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.spaces 
    WHERE spaces.id = space_members.space_id 
    AND spaces.is_public = TRUE
  )
);