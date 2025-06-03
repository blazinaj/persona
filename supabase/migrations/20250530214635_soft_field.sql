/*
  # Fix ambiguous ID reference in retrieve_relevant_knowledge function
  
  1. Changes
    - Drop existing retrieve_relevant_knowledge function
    - Recreate the function with properly qualified column references
    - Fix the ambiguous 'id' column reference by specifying the table name
  
  2. Security
    - Maintain SECURITY DEFINER to ensure proper access control
    - Keep existing access checks intact
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS retrieve_relevant_knowledge(uuid, text, integer, float);

-- Recreate the function with properly qualified column references
CREATE OR REPLACE FUNCTION retrieve_relevant_knowledge(
  persona_id_input uuid,
  query_text text,
  max_results integer DEFAULT 5,
  min_score float DEFAULT 0.2
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  source text,
  relevance_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this persona
  IF NOT EXISTS (
    SELECT 1 FROM personas
    WHERE personas.id = persona_id_input
    AND (
      personas.user_id = auth.uid()
      OR personas.visibility IN ('public', 'unlisted')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to persona knowledge';
  END IF;

  -- Return relevant knowledge entries with their relevance scores
  RETURN QUERY
  SELECT 
    k.id,
    k.title,
    k.description,
    k.category,
    k.source,
    calculate_relevance_score(query_text, k.title, k.description) AS relevance_score
  FROM 
    persona_knowledge_entries k
  WHERE 
    k.persona_id = persona_id_input
    AND calculate_relevance_score(query_text, k.title, k.description) >= min_score
  ORDER BY 
    relevance_score DESC
  LIMIT max_results;
END;
$$;