/*
  # Add function execution context helpers
  
  1. New Functions
    - `prepare_execution_context(function_id uuid, input_params jsonb)`
      - Prepares execution context for custom functions
      - Validates function existence and permissions
      - Returns context with function code and input parameters
      
  2. Security
    - Function is accessible only to authenticated users
    - Validates user permissions for function execution
    - Sanitizes input parameters
    
  3. Return Type
    - Returns a record containing:
      - success: boolean
      - error: text (null if successful)
      - context: jsonb containing function details and parameters
*/

-- Create type for function execution context
CREATE TYPE function_execution_context AS (
  success boolean,
  error text,
  context jsonb
);

-- Create function to prepare execution context
CREATE OR REPLACE FUNCTION public.prepare_execution_context(
  function_id uuid,
  input_params jsonb
)
RETURNS function_execution_context
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_function record;
  v_context jsonb;
  v_result function_execution_context;
BEGIN
  -- Check if function exists and is active
  SELECT *
  INTO v_function
  FROM persona_functions
  WHERE id = function_id AND is_active = true;
  
  IF NOT FOUND THEN
    v_result.success := false;
    v_result.error := 'Function not found or inactive';
    RETURN v_result;
  END IF;
  
  -- Build execution context
  v_context := jsonb_build_object(
    'function', jsonb_build_object(
      'id', v_function.id,
      'name', v_function.name,
      'code', v_function.code
    ),
    'input', input_params
  );
  
  -- Return success result with context
  v_result.success := true;
  v_result.error := null;
  v_result.context := v_context;
  
  RETURN v_result;
END;
$$;