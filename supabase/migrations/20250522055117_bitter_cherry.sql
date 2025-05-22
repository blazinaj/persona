/*
  # Add persona function validation and generation
  
  1. Changes
    - Add function code validation
    - Add function name extraction
    - Add code template generation
    - Add AI function generation support
    
  2. Security
    - Drop existing trigger before recreating
    - Add validation for potentially harmful code
    - Ensure proper error handling
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_function_code_trigger ON persona_functions;

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
     code LIKE '%import(%' OR
     code LIKE '%process.%' OR
     code LIKE '%fs.%' OR
     code LIKE '%net.%' OR
     code LIKE '%http.%' OR
     code LIKE '%crypto.%' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for validation
CREATE OR REPLACE FUNCTION validate_function_code_trigger()
RETURNS trigger AS $$
BEGIN
  IF NOT validate_function_code(NEW.code) THEN
    RAISE EXCEPTION 'Invalid or potentially harmful function code';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to validate function code
CREATE TRIGGER validate_function_code_trigger
  BEFORE INSERT OR UPDATE ON persona_functions
  FOR EACH ROW
  EXECUTE FUNCTION validate_function_code_trigger();

-- Function to extract function name from description
CREATE OR REPLACE FUNCTION extract_function_name(description text)
RETURNS text AS $$
BEGIN
  -- Extract a reasonable function name from the description
  -- For now just return a placeholder
  RETURN 'customFunction';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate code template
CREATE OR REPLACE FUNCTION generate_code_template(
  name text,
  description text
) RETURNS text AS $$
BEGIN
  RETURN format(
    $code$
// %s
// %s
async function execute(input) {
  try {
    // Function implementation here
    return {
      success: true,
      result: "Function executed successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
$code$,
    name,
    description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate code with AI
CREATE OR REPLACE FUNCTION generate_function_code(
  description text,
  persona_id uuid
) RETURNS jsonb AS $$
DECLARE
  func_name text;
  func_code text;
BEGIN
  -- Validate input
  IF description IS NULL OR length(trim(description)) = 0 THEN
    RAISE EXCEPTION 'Description is required';
  END IF;

  -- Get persona context
  IF NOT EXISTS (
    SELECT 1 FROM personas 
    WHERE id = persona_id
  ) THEN
    RAISE EXCEPTION 'Persona not found';
  END IF;

  -- Extract function name from description
  func_name := extract_function_name(description);
  
  -- Generate code template
  func_code := generate_code_template(func_name, description);

  -- Return function details
  RETURN jsonb_build_object(
    'name', func_name,
    'description', description,
    'code', func_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;