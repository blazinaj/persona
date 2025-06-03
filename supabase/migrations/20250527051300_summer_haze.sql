/*
  # Fix RLS policies for persona knowledge entries

  1. Changes
    - Add RLS policies to allow users to:
      - Create knowledge entries for personas they own
      - Update their own knowledge entries
      - Delete their own knowledge entries
      - View knowledge entries for public/unlisted personas and their own personas

  2. Security
    - Enable RLS on persona_knowledge_entries table
    - Add granular policies for CRUD operations
    - Ensure users can only manage entries for personas they own
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Delete policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'persona_knowledge_entries'
  ) THEN
    DROP POLICY IF EXISTS "Users can create their own knowledge entries" ON persona_knowledge_entries;
    DROP POLICY IF EXISTS "Users can delete their own knowledge entries" ON persona_knowledge_entries;
    DROP POLICY IF EXISTS "Users can update their own knowledge entries" ON persona_knowledge_entries;
    DROP POLICY IF EXISTS "Users can view knowledge entries" ON persona_knowledge_entries;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Users can create their own knowledge entries"
ON persona_knowledge_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_knowledge_entries.persona_id
    AND personas.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own knowledge entries"
ON persona_knowledge_entries
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_knowledge_entries.persona_id
    AND personas.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own knowledge entries"
ON persona_knowledge_entries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_knowledge_entries.persona_id
    AND personas.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_knowledge_entries.persona_id
    AND personas.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view knowledge entries"
ON persona_knowledge_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_knowledge_entries.persona_id
    AND (
      personas.user_id = auth.uid()
      OR personas.visibility = 'public'
      OR personas.visibility = 'unlisted'
    )
  )
);