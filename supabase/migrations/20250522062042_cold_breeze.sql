/*
  # Fix function generator validation and execution
  
  1. Changes
    - Add better validation for function code
    - Add proper error handling
    - Fix function execution context
*/

-- Drop existing validation function and create improved version
DROP FUNCTION IF EXISTS validate_function_code(text);

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
     code LIKE '%Buffer%' THEN
    RETURN false;
  END IF;

  -- Ensure code contains required structure
  IF code NOT LIKE '%async function execute(input)%' OR
     code NOT LIKE '%try%' OR
     code NOT LIKE '%catch%' OR
     code NOT LIKE '%return%' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function to include better error messages
CREATE OR REPLACE FUNCTION validate_function_code_trigger()
RETURNS trigger AS $$
BEGIN
  IF NOT validate_function_code(NEW.code) THEN
    RAISE EXCEPTION 'Invalid function code: Must be a valid async function with proper error handling';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;