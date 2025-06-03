/*
  # Add knowledge retrieval function
  
  1. New Functions
    - `search_persona_knowledge`: Searches knowledge entries for a persona based on query
    - `get_persona_knowledge`: Gets all knowledge entries for a persona
  
  2. Security
    - Functions use RLS policies for access control
    - Only return knowledge for accessible personas
*/

-- Function to search knowledge entries for a persona
CREATE OR REPLACE FUNCTION search_persona_knowledge(
  persona_id_input UUID,
  query_text TEXT
)
RETURNS SETOF persona_knowledge_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this persona
  IF NOT EXISTS (
    SELECT 1 FROM personas
    WHERE id = persona_id_input
    AND (
      user_id = auth.uid()
      OR visibility IN ('public', 'unlisted')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to persona knowledge';
  END IF;

  -- Return matching knowledge entries
  RETURN QUERY
  SELECT *
  FROM persona_knowledge_entries
  WHERE persona_id = persona_id_input
  AND (
    to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', query_text)
    OR title ILIKE '%' || query_text || '%'
    OR description ILIKE '%' || query_text || '%'
  )
  ORDER BY 
    CASE WHEN title ILIKE '%' || query_text || '%' THEN 0 ELSE 1 END,
    created_at DESC;
END;
$$;

-- Function to get all knowledge entries for a persona
CREATE OR REPLACE FUNCTION get_persona_knowledge(
  persona_id_input UUID
)
RETURNS SETOF persona_knowledge_entries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this persona
  IF NOT EXISTS (
    SELECT 1 FROM personas
    WHERE id = persona_id_input
    AND (
      user_id = auth.uid()
      OR visibility IN ('public', 'unlisted')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to persona knowledge';
  END IF;

  -- Return all knowledge entries
  RETURN QUERY
  SELECT *
  FROM persona_knowledge_entries
  WHERE persona_id = persona_id_input
  ORDER BY created_at DESC;
END;
$$;