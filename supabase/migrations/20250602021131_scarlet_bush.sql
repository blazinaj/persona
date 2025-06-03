-- Create policy that allows authenticated users to join public spaces
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