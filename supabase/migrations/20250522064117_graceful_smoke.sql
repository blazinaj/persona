/*
  # Add function execution context support
  
  1. Changes
    - Create custom type for function execution context
    - Create function to prepare execution context for function calls
    - Handle function validation and context preparation
  
  2. Security
    - Function runs with SECURITY DEFINER
    - Validates function existence and active status
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.prepare_execution_context(uuid, jsonb);

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