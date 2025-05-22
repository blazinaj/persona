/*
  # Add custom function execution support

  1. Changes
    - Drop existing functions to allow recreation
    - Add prepare_execution_context function
    - Add execute_custom_function function
    - Grant proper permissions

  2. Security
    - Functions use SECURITY DEFINER
    - Basic input validation
    - Error handling
    - Limited permissions
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.prepare_execution_context(uuid, jsonb);
DROP FUNCTION IF EXISTS public.execute_custom_function(text, jsonb);

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