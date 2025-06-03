/*
  # Fix community profile stats display
  
  1. Changes
    - Add function to get accurate profile stats
    - Fix profile followers count calculation
    - Ensure proper stats for public profiles
  
  2. Security
    - Maintain existing security model
    - Use SECURITY DEFINER for controlled execution
*/

-- Function to get accurate profile stats
CREATE OR REPLACE FUNCTION get_profile_stats(
  profile_id_input uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_personas integer;
  public_personas integer;
  total_views integer;
  total_favorites integer;
  followers_count integer;
BEGIN
  -- Check if profile exists and is public (or is the current user's profile)
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = profile_id_input
    AND (is_public = true OR id = auth.uid())
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Profile not found or not public'
    );
  END IF;

  -- Get persona counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE visibility = 'public')
  INTO
    total_personas,
    public_personas
  FROM personas
  WHERE user_id = profile_id_input;

  -- Get view count
  SELECT 
    COALESCE(SUM(view_count), 0)
  INTO
    total_views
  FROM (
    SELECT 
      COUNT(*) as view_count
    FROM persona_views
    JOIN personas ON persona_views.persona_id = personas.id
    WHERE personas.user_id = profile_id_input
    GROUP BY persona_views.persona_id
  ) as view_counts;

  -- Get favorites count
  SELECT 
    COALESCE(SUM(fav_count), 0)
  INTO
    total_favorites
  FROM (
    SELECT 
      COUNT(*) as fav_count
    FROM persona_favorites
    JOIN personas ON persona_favorites.persona_id = personas.id
    WHERE personas.user_id = profile_id_input
    GROUP BY persona_favorites.persona_id
  ) as favorite_counts;

  -- Get followers count
  SELECT 
    COUNT(*)
  INTO
    followers_count
  FROM profile_followers
  WHERE profile_id = profile_id_input;

  -- Build result
  result := jsonb_build_object(
    'total_personas', total_personas,
    'public_personas', public_personas,
    'total_views', total_views,
    'total_favorites', total_favorites,
    'followers_count', followers_count
  );

  RETURN result;
END;
$$;

-- Update the profile_stats table to ensure it has the correct data
CREATE OR REPLACE FUNCTION update_profile_stats_trigger()
RETURNS trigger AS $$
DECLARE
  profile_id uuid;
  total_personas integer;
  public_personas integer;
  total_views integer;
  total_favorites integer;
BEGIN
  -- Determine which profile to update
  IF TG_OP = 'DELETE' THEN
    profile_id := OLD.user_id;
  ELSE
    profile_id := NEW.user_id;
  END IF;

  -- Skip if no profile ID
  IF profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE visibility = 'public')
  INTO
    total_personas,
    public_personas
  FROM personas
  WHERE user_id = profile_id;

  -- Get view count
  SELECT 
    COALESCE(SUM(view_count), 0)
  INTO
    total_views
  FROM (
    SELECT 
      COUNT(*) as view_count
    FROM persona_views
    JOIN personas ON persona_views.persona_id = personas.id
    WHERE personas.user_id = profile_id
    GROUP BY persona_views.persona_id
  ) as view_counts;

  -- Get favorites count
  SELECT 
    COALESCE(SUM(fav_count), 0)
  INTO
    total_favorites
  FROM (
    SELECT 
      COUNT(*) as fav_count
    FROM persona_favorites
    JOIN personas ON persona_favorites.persona_id = personas.id
    WHERE personas.user_id = profile_id
    GROUP BY persona_favorites.persona_id
  ) as favorite_counts;

  -- Update or insert stats
  INSERT INTO profile_stats (
    profile_id,
    total_personas,
    public_personas,
    total_views,
    total_favorites,
    updated_at
  ) VALUES (
    profile_id,
    total_personas,
    public_personas,
    total_views,
    total_favorites,
    now()
  )
  ON CONFLICT (profile_id)
  DO UPDATE SET
    total_personas = EXCLUDED.total_personas,
    public_personas = EXCLUDED.public_personas,
    total_views = EXCLUDED.total_views,
    total_favorites = EXCLUDED.total_favorites,
    updated_at = EXCLUDED.updated_at;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Refresh all profile stats
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM profiles
  LOOP
    PERFORM update_profile_stats(profile_record.id);
  END LOOP;
END $$;