# Avatar Generator

The Avatar Generator is a powerful feature that allows you to create custom avatars for your personas using AI or by uploading your own images.

## Overview

The Avatar Generator provides two main methods for creating persona avatars:

1. **AI Generation**: Create unique avatars by describing them in natural language
2. **Image Upload**: Upload your own images to use as avatars

## AI Avatar Generation

### How It Works

The AI Avatar Generator uses DALL-E 3 to create high-quality, custom avatars based on your text descriptions. The system is optimized for creating professional-looking profile pictures and avatars.

### Using the AI Generator

1. Navigate to the persona creation or edit screen
2. Click the "Generate" button next to the Avatar URL field
3. In the Avatar Generator modal, select the "AI Generate" tab
4. Enter a detailed description of the avatar you want to create
5. Select a style from the available options
6. Click "Generate Avatar"
7. Once generated, you can download, copy the URL, or use the avatar directly

### Writing Effective Prompts

For best results, include details about:

- **Facial features**: Eyes, hair, skin tone, facial structure
- **Expression**: Smiling, serious, thoughtful
- **Style**: Professional, casual, artistic
- **Lighting**: Soft, dramatic, natural
- **Background**: Simple, gradient, contextual

**Example Prompts:**

```
A professional-looking woman with short dark hair, glasses, and a friendly smile. Business attire with a light blue background.
```

```
A tech-savvy young man with a beard, wearing headphones and a casual t-shirt. Warm lighting with a gradient background.
```

```
A stylized avatar of a person with curly hair and a confident expression. Minimalist design with bold colors.
```

### Style Options

The following style options are available:

- **Realistic**: Photorealistic portraits
- **Cartoon**: Stylized cartoon characters
- **Anime**: Japanese anime-inspired style
- **Digital Art**: Modern digital illustration style
- **Oil Painting**: Traditional oil painting look
- **Watercolor**: Soft watercolor painting style

## Image Upload

### Supported Formats

- PNG
- JPEG/JPG
- GIF
- WebP

### Size Limits

- Maximum file size: 5MB
- Recommended dimensions: 512x512 pixels or larger
- Aspect ratio: 1:1 (square) recommended for best results

### Upload Process

1. Navigate to the persona creation or edit screen
2. Click the "Generate" button next to the Avatar URL field
3. In the Avatar Generator modal, select the "Upload" tab
4. Drag and drop an image or click to select a file
5. Once uploaded, you can use the image as your avatar

## Technical Details

### Image Storage

Uploaded avatars are stored in Supabase Storage in the `persona-avatars` bucket. Each image is assigned a unique filename to prevent collisions.

### URL Format

Avatar URLs follow these formats:

- AI-generated avatars: Direct URL to the generated image
- Uploaded avatars: `https://vveuiuwsmndxmrmupnqj.supabase.co/storage/v1/object/public/persona-avatars/avatars/[filename]`

### Privacy Considerations

- Uploaded avatars are publicly accessible via their URLs
- We recommend not uploading sensitive or private images
- AI-generated avatars are created using your prompt but do not contain personally identifiable information

## Troubleshooting

### Common Issues

**Image Generation Fails**
- Ensure your prompt is detailed enough (at least 10 characters)
- Avoid prohibited content in your descriptions
- Try a different style option

**Upload Fails**
- Check that your file is under 5MB
- Ensure you're using a supported file format
- Try a different browser if issues persist

**Avatar Not Displaying**
- Verify the URL is correct and accessible
- Check your internet connection
- Clear your browser cache

### Getting Help

If you encounter persistent issues with the Avatar Generator, please contact our support team at support@personify.mobi.