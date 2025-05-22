/*
  # Add function generation support
  
  1. Changes
    - Add function to validate and sanitize function code
    - Add function to generate function code using AI
    - Add helper functions for code validation
*/

-- Function to validate and sanitize function code
CREATE OR REPLACE FUNCTION validate_function_code(code text)
RETURNS boolean AS $$
BEGIN
  -- Basic validation - ensure code is not empty
  IF code IS NULL OR length(trim(code)) = 0 THEN
    RETURN false;
  END IF;

  -- Check for potentially harmful code patterns
  IF code LIKE '%rm -rf%' OR 
     code LIKE '%eval(%' OR
     code LIKE '%exec(%' OR
     code LIKE '%system(%' OR
     code LIKE '%child_process%' OR
     code LIKE '%require(%' OR
     code LIKE '%import(%' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to validate function code
CREATE TRIGGER validate_function_code_trigger
  BEFORE INSERT OR UPDATE ON persona_functions
  FOR EACH ROW
  EXECUTE FUNCTION validate_function_code_trigger();

-- Create function to generate code
CREATE OR REPLACE FUNCTION generate_function_code(
  description text,
  persona_id uuid
) RETURNS text AS $$
DECLARE
  generated_code text;
BEGIN
  -- Validate input
  IF description IS NULL OR length(trim(description)) = 0 THEN
    RAISE EXCEPTION 'Description is required';
  END IF;

  -- Get persona context
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM personas 
        WHERE id = persona_id
      ) THEN true
      ELSE false
    END INTO generated_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Persona not found';
  END IF;

  -- In a real implementation, this would call an AI service
  -- For now, return a placeholder
  RETURN '// Generated function
function execute(input) {
  // Function logic here
  return {
    success: true,
    result: "Function executed successfully"
  };
}';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;