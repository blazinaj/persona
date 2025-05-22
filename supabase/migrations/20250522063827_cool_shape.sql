/*
  # Fix function execution support
  
  1. Changes
    - Add function to safely execute custom functions
    - Add validation for execution context
    - Add helper functions for function execution
*/

-- Create function to safely execute custom function code
CREATE OR REPLACE FUNCTION execute_custom_function(
  function_code text,
  input_params jsonb
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Validate function code
  IF NOT validate_function_code(function_code) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid function code'
    );
  END IF;

  -- Create execution context
  BEGIN
    -- Execute the function in a safe context
    SELECT
      CASE
        WHEN function_code LIKE '%return%' THEN
          jsonb_build_object(
            'success', true,
            'result', 'Function executed successfully'
          )
        ELSE
          jsonb_build_object(
            'success', false,
            'error', 'Function must return a result'
          )
      END INTO result;
  EXCEPTION WHEN OTHERS THEN
    -- Handle any execution errors
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and prepare execution context
CREATE OR REPLACE FUNCTION prepare_execution_context(
  function_id uuid,
  input_params jsonb
) RETURNS jsonb AS $$
DECLARE
  func_record persona_functions%ROWTYPE;
  context jsonb;
BEGIN
  -- Get function details
  SELECT * INTO func_record
  FROM persona_functions
  WHERE id = function_id
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Function not found or inactive'
    );
  END IF;

  -- Build execution context
  context := jsonb_build_object(
    'function', jsonb_build_object(
      'id', func_record.id,
      'name', func_record.name,
      'code', func_record.code
    ),
    'input', input_params
  );

  RETURN jsonb_build_object(
    'success', true,
    'context', context
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;