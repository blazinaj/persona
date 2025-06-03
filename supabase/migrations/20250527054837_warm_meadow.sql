/*
  # Add knowledge retrieval functions
  
  1. New Functions
    - `retrieve_relevant_knowledge`: Retrieves relevant knowledge entries for a query
    - `calculate_relevance_score`: Calculates relevance score between query and knowledge entry
  
  2. Security
    - Functions use SECURITY DEFINER to ensure proper access control
    - Validate persona access before retrieving knowledge
*/

-- Function to calculate relevance score between query and knowledge entry
CREATE OR REPLACE FUNCTION calculate_relevance_score(
  query_text TEXT,
  entry_title TEXT,
  entry_description TEXT
)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
  title_match FLOAT;
  description_match FLOAT;
  query_words TEXT[];
  word TEXT;
  title_score FLOAT := 0;
  description_score FLOAT := 0;
BEGIN
  -- Normalize text for comparison
  query_text := lower(query_text);
  entry_title := lower(entry_title);
  entry_description := lower(entry_description);
  
  -- Direct matches (highest weight)
  IF entry_title ILIKE '%' || query_text || '%' THEN
    title_match := 1.0;
  ELSE
    title_match := 0.0;
  END IF;
  
  IF entry_description ILIKE '%' || query_text || '%' THEN
    description_match := 0.8;
  ELSE
    description_match := 0.0;
  END IF;
  
  -- Word-by-word matching for more nuanced scoring
  query_words := regexp_split_to_array(query_text, '\s+');
  
  FOREACH word IN ARRAY query_words
  LOOP
    -- Skip very short words and common stop words
    IF length(word) > 2 AND word NOT IN ('the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'not') THEN
      -- Check title matches
      IF entry_title ILIKE '%' || word || '%' THEN
        title_score := title_score + 0.2;
      END IF;
      
      -- Check description matches
      IF entry_description ILIKE '%' || word || '%' THEN
        description_score := description_score + 0.1;
      END IF;
    END IF;
  END LOOP;
  
  -- Combine scores with appropriate weights
  RETURN (title_match * 0.6) + (description_match * 0.4) + (title_score * 0.3) + (description_score * 0.2);
END;
$$;

-- Function to retrieve relevant knowledge entries for a query
CREATE OR REPLACE FUNCTION retrieve_relevant_knowledge(
  persona_id_input UUID,
  query_text TEXT,
  max_results INTEGER DEFAULT 5,
  min_score FLOAT DEFAULT 0.2
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  source TEXT,
  relevance_score FLOAT
)
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