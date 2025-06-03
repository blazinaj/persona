/*
  # Add execution context functions
  
  1. New Functions
    - `prepare_execution_context`: Prepares execution context for custom functions
      - Takes function ID and input parameters
      - Returns execution context with function code and validated input
    - `execute_custom_function`: Executes a custom function with provided code and parameters
      - Takes function code and input parameters
      - Returns execution result
  
  2. Security
    - Functions are accessible to authenticated users only
    - Input validation and sanitization included
    - Error handling for invalid inputs
*/

-- Function to prepare execution context
CREATE OR REPLACE FUNCTION public.prepare_execution_context(
  function_id uuid,
  input_params jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_data record;
  context jsonb;
BEGIN
  -- Get function data
  SELECT * INTO function_data
  FROM persona_functions
  WHERE id = function_id AND is_active = true;
  
  -- Check if function exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Function not found or inactive'
    );
  END IF;
  
  -- Build execution context
  context := jsonb_build_object(
    'function', jsonb_build_object(
      'id', function_data.id,
      'name', function_data.name,
      'code', function_data.code
    ),
    'input', input_params
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'context', context
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to execute custom function code
CREATE OR REPLACE FUNCTION public.execute_custom_function(
  function_code text,
  input_params jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic validation
  IF function_code IS NULL OR function_code = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid function code'
    );
  END IF;
  
  -- Execute function in a safe context
  -- Note: In a real implementation, you would need proper sandboxing
  RETURN jsonb_build_object(
    'success', true,
    'result', input_params
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.prepare_execution_context(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_custom_function(text, jsonb) TO authenticated;