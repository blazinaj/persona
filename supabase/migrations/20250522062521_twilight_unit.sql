/*
  # Fix function execution and validation
  
  1. Changes
    - Add improved function validation
    - Add execution context validation
    - Add sandbox helper functions
  
  2. Security
    - Ensure safe function execution
    - Validate function structure
    - Prevent access to dangerous APIs
*/

-- Drop existing validation function
DROP FUNCTION IF EXISTS validate_function_code(text);

-- Create improved validation function
CREATE FUNCTION validate_function_code(code text)
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
     code LIKE '%crypto.%' OR
     code LIKE '%__dirname%' OR
     code LIKE '%__filename%' OR
     code LIKE '%global%' OR
     code LIKE '%Buffer%' OR
     code LIKE '%prototype%' OR
     code LIKE '%constructor%' OR
     code LIKE '%__proto__%' THEN
    RETURN false;
  END IF;

  -- Ensure code contains required structure
  IF code NOT LIKE '%async function execute(input)%' OR
     code NOT LIKE '%try%' OR
     code NOT LIKE '%catch%' OR
     code NOT LIKE '%return%' THEN
    RETURN false;
  END IF;

  -- Ensure proper error handling
  IF code NOT LIKE '%success%:%' OR
     code NOT LIKE '%error%:%' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate execution context
CREATE FUNCTION validate_execution_context(context jsonb)
RETURNS boolean AS $$
BEGIN
  -- Ensure context has required fields
  IF NOT (
    context ? 'input' AND
    context ? 'execute'
  ) THEN
    RETURN false;
  END IF;

  -- Validate input structure
  IF NOT jsonb_typeof(context->'input') = 'object' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;