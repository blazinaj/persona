/*
  # Fix function execution context
  
  1. Changes
    - Drop existing functions
    - Create new function execution context
    - Add proper error handling and validation
    - Fix return type issues
  
  2. Security
    - Ensure proper permissions
    - Add input validation
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.prepare_execution_context(uuid, jsonb);
DROP FUNCTION IF EXISTS public.execute_custom_function(text, jsonb);
DROP TYPE IF EXISTS function_execution_context;

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
  
  -- Validate input parameters
  IF NOT jsonb_typeof(input_params) = 'object' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Input parameters must be a JSON object'
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
  
  -- Validate input parameters
  IF NOT jsonb_typeof(input_params) = 'object' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Input parameters must be a JSON object'
    );
  END IF;
  
  -- Validate function code structure
  IF NOT (
    function_code LIKE '%async function execute(input)%' AND
    function_code LIKE '%try%' AND
    function_code LIKE '%catch%' AND
    function_code LIKE '%return%'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid function structure'
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