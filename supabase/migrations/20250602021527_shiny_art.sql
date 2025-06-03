-- Check if policy exists before creating it
DO $$ 
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'space_members'
    AND policyname = 'Allow authenticated users to join public spaces'
  ) THEN
    -- Create the policy only if it doesn't exist
    EXECUTE $POLICY$
      CREATE POLICY "Allow authenticated users to join public spaces"
      ON public.space_members
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid() AND 
        EXISTS (
          SELECT 1 FROM public.spaces 
          WHERE spaces.id = space_members.space_id 
          AND spaces.is_public = TRUE
        )
      );
    $POLICY$;
  END IF;
END $$;