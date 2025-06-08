# Persona Discovery and Visibility Controls

## The Explore System

The Explore system enables users to discover, interact with, and use public personas created by the community. This guide explains how it works and how you can make your personas and profile discoverable.

### Overview of the Explore System

The Explore feature provides a curated marketplace of personas created by the community, allowing users to:

- Discover new personas for specific use cases
- Try personas before creating similar ones
- Learn from effective persona designs
- Connect with creators who share similar interests

### How Discovery Works

Personas appear in the Explore section based on several factors:

1. **Visibility Setting**: Only personas marked as "Public" appear in Explore
2. **Popularity Metrics**: Views, favorites, and ratings influence ranking
3. **Recency**: Newly created or recently updated personas may be featured
4. **Categories**: Personas are organized by knowledge areas and tags
5. **Search Relevance**: Personas matching search terms in their name, description, or tags

### Explore Interface Features

#### Search and Filtering

The Explore interface offers robust search and filtering capabilities:

Users can:
- Search by keywords across name, description, and tags
- Filter by category (Technical, Creative, Business, Lifestyle)
- Filter by specific tags
- Sort by popularity, trending, newest, or alphabetical

#### Featured Personas

The system highlights selected personas in the "Featured" section based on:
- High-quality personas that showcase platform capabilities
- Personas with unique or innovative designs
- Personas with high engagement metrics
- Recently updated personas with new capabilities

#### Statistics and Engagement

Each persona in Explore displays key statistics:
- View count: Number of unique users who have viewed the persona
- Favorites count: Number of users who have saved the persona to their favorites
- Public rating: Average of user ratings (1-5 stars)

Users can interact with public personas by:
- Chatting directly within the Explore interface
- Favoriting personas for quick access
- Rating and providing feedback
- Viewing the creator's profile

## Persona Visibility Settings

Personas have three visibility levels that determine who can access them and how they can be discovered.

### Visibility Levels

1. **Private (Default)**
   - Visible only to the creator
   - Not accessible via direct link
   - Not displayed in Explore or public profiles
   - Cannot be embedded or shared

2. **Unlisted**
   - Not visible in Explore or search results
   - Accessible via direct link
   - Can be embedded on websites
   - Stats and usage are tracked
   - Good for: beta testing, limited sharing, embedded use cases

3. **Public**
   - Fully discoverable in Explore
   - Accessible via direct link
   - Can be embedded on websites
   - Appears on creator's public profile
   - Stats and usage are tracked
   - Good for: showcasing work, building audience, community contributions

### Managing Visibility

Visibility can be managed in several ways:

1. **During Creation**:
   ```jsx
   <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
       Visibility
     </label>
     <select
       {...register('visibility')}
       className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
     >
       <option value="private">Private - Only visible to you</option>
       <option value="unlisted">Unlisted - Not listed but can be embedded</option>
       <option value="public">Public - Listed in explore and can be embedded</option>
     </select>
   </div>
   ```

2. **From Persona Details**:
   - Edit persona and change the visibility setting
   - Changes take effect immediately

3. **Bulk Changes**:
   - Select multiple personas on the dashboard
   - Use the batch edit feature to change visibility

### Visibility Indicators

The platform uses consistent indicators for visibility status:

- Private: 🔒 Lock icon
- Unlisted: 👥 Limited visibility icon
- Public: 🌎 Globe icon

### Database Implementation

Visibility is implemented as a PostgreSQL enum type:

```sql
-- Create visibility enum
CREATE TYPE persona_visibility AS ENUM ('private', 'unlisted', 'public');

-- Add visibility column to personas table
ALTER TABLE personas
ADD COLUMN visibility persona_visibility NOT NULL DEFAULT 'private';

-- RLS policy example
CREATE POLICY "Users can view personas"
  ON personas
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id -- Owner can view their own
    OR visibility = 'public' -- Anyone can view public
    OR visibility = 'unlisted' -- Anyone can view unlisted (for embedding)
  );
```

### Visibility Best Practices

1. **Start Private**: Begin development with private visibility
2. **Test with Unlisted**: Share with testers using unlisted status
3. **Public when Ready**: Make public once quality and content are verified
4. **Moderate Public Content**: Ensure public personas follow community guidelines
5. **Review Analytics**: Monitor view and usage stats to optimize

## Profile Visibility Controls

User profiles can be public or private, which affects how others can discover and follow you.

### Profile Visibility Options

1. **Private Profile (Default)**
   - Basic profile information only visible to you
   - Public personas still visible in Explore, but not linked to profile
   - No followers or following relationships possible
   - Not discoverable in the community section

2. **Public Profile**
   - Profile information visible to all users
   - Public personas displayed on profile page
   - Can receive followers and follow others
   - Appears in community searches and recommendations

### What's Shared on Public Profiles

When a profile is public, the following information is shared:

- Display name
- Avatar
- Bio/description
- Website link (if provided)
- Social media links (if provided)
- Public personas
- Follower count
- Creation date

Private information always protected:
- Email address
- Personal messages
- Subscription details
- Private personas

### Managing Profile Visibility

Profile visibility is managed through the profile settings:

```javascript
const handleSaveProfile = async () => {
  if (!user?.id) return;
  
  setSaving(true);
  setError(null);
  
  try {
    const formattedData = {
      id: user.id,
      display_name: formData.display_name,
      bio: formData.bio,
      avatar_url: formData.avatar_url,
      website: validateUrl(formData.website),
      twitter: formData.twitter,
      github: formData.github,
      is_public: formData.is_public, // Profile visibility toggle
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(formattedData);

    if (error) throw error;
    
    setSaveSuccess(true);
    setEditMode(false);
    setProfileData(formData);
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
};
```

### Profile Privacy Implementation

Profile privacy is implemented with PostgreSQL Row Level Security (RLS) policies:

```sql
-- RLS policy for viewing profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (
  CASE
    WHEN (auth.uid() = id) THEN true  -- User can see all their own data
    WHEN (is_public = true) THEN true -- Public profiles are visible
    ELSE false                        -- Private profiles are not visible
  END
);

-- View that hides sensitive data for public profiles
CREATE OR REPLACE VIEW public_profile_view WITH (security_barrier=true) AS
SELECT
  id,
  display_name,
  bio,
  avatar_url,
  website,
  twitter,
  github,
  is_public,
  created_at,
  updated_at
FROM
  profiles
WHERE
  is_public = true OR id = auth.uid();
```

## Integrating Visibility Controls

The following examples show how these systems work together:

### Displaying Public Personas in Profiles

```jsx
const PublicProfile = () => {
  // ...

  useEffect(() => {
    const fetchPublicPersonas = async () => {
      try {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .eq('user_id', profileId)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPublicPersonas(data || []);
      } catch (error) {
        console.error('Error fetching public personas:', error);
      }
    };
    
    fetchPublicPersonas();
  }, [profileId]);

  // ...
};
```

### Tracking View Statistics

```jsx
const trackView = async () => {
  if (!user?.id || !id) return;

  try {
    // Use the RPC function to track views
    const { data, error } = await supabase
      .rpc('track_persona_view', {
        persona_id_input: id,
        viewer_id_input: user.id
      });

    if (error) throw error;
    if (!data) {
      console.warn('Unable to track view - insufficient permissions');
    }
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};
```

## Best Practices

### For Creators

1. **Profile Visibility**:
   - Make your profile public to build a following and showcase your work
   - Add a descriptive bio and relevant social media links
   - Use a recognizable avatar for consistent branding

2. **Persona Visibility**:
   - Use private visibility during development
   - Set to unlisted for testing with specific users
   - Make your best work public to build your reputation
   - Keep specialized or personal personas private

3. **Building an Audience**:
   - Create high-quality, focused personas that solve specific problems
   - Use descriptive tags to improve discoverability
   - Encourage users to rate and favorite your personas
   - Share your public persona links on social media

### For Users

1. **Discovering Personas**:
   - Use search and filters to find relevant personas
   - Check view and favorite counts as quality indicators
   - Read creator profiles to find specialists in areas of interest
   - Use the "Featured" section to discover curated content

2. **Privacy Considerations**:
   - Be aware that chat history with public personas is stored separately for each user
   - Your interactions with personas are private to you
   - Following a creator is public information if your profile is public
   - Favorites are private to your account

## Conclusion

The Explore system, visibility controls, and profile settings work together to create a balanced ecosystem where creators can showcase their work while users can discover valuable personas. By understanding how these systems interact, you can make informed decisions about how to share your creations and protect your privacy on the platform.