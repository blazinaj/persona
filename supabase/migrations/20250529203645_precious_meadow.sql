/*
  # Fix ambiguous profile_id references

  1. Changes
    - Qualify ambiguous profile_id references in trigger functions and policies
    - Update profile stats trigger to use explicit table references
    - Ensure all column references are properly qualified

  2. Security
    - No changes to existing security policies
    - Maintains existing RLS policies
*/

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS update_profile_stats_trigger CASCADE;

-- Recreate the trigger function with qualified column references
CREATE OR REPLACE FUNCTION update_profile_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update profile stats
    INSERT INTO profile_stats (profile_id, total_personas, public_personas)
    SELECT 
        p.user_id,
        COUNT(p.id) as total_personas,
        COUNT(CASE WHEN p.visibility = 'public' THEN 1 END) as public_personas
    FROM personas p
    WHERE p.user_id = NEW.user_id
    GROUP BY p.user_id
    ON CONFLICT (profile_id) 
    DO UPDATE SET
        total_personas = EXCLUDED.total_personas,
        public_personas = EXCLUDED.public_personas,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER persona_stats_update
AFTER INSERT OR DELETE OR UPDATE ON personas
FOR EACH ROW
EXECUTE FUNCTION update_profile_stats_trigger();