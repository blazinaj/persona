/*
  # Fix ambiguous ID reference in get_space_persona_members function

  1. Changes
    - Update get_space_persona_members function to use qualified column names
    - Ensure all ID references specify their table source
    - Maintain existing functionality while fixing the ambiguity error

  2. Technical Details
    - Replace generic 'id' references with table-qualified column names
    - Use table aliases for clearer and more maintainable code
    - Return the same structure but with unambiguous column references
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_space_persona_members;

-- Recreate the function with unambiguous column references
CREATE OR REPLACE FUNCTION get_space_persona_members(space_id_input uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  personality text[],
  knowledge text[],
  tone text,
  instructions text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.personality,
    p.knowledge,
    p.tone,
    p.instructions
  FROM personas p
  INNER JOIN space_members sm ON sm.persona_id = p.id
  WHERE sm.space_id = space_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;