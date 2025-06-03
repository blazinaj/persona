/*
  # Add instructions column to personas table

  1. Changes
    - Add `instructions` column to `personas` table
      - Type: TEXT
      - Nullable: true
      - Default: empty string
*/

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '';