# Persona - AI Agent Creation Platform

Create, customize, and manage AI agents with different personalities and skill sets. Live demo: [View Demo](https://personify.mobi)

## 🤖 AI-Generated Prototype

This application is a prototype generated using artificial intelligence. It demonstrates the potential of AI-assisted development in creating sophisticated, production-ready applications. While the core functionality and design patterns are solid, this prototype serves as a foundation that can be further enhanced and customized for specific business needs.

## Features

- **Create Custom AI Personas**: Design AI agents with unique personalities, knowledge areas, and communication styles
- **Persona Management**: Edit, duplicate, and delete personas
- **Rich Persona Details**: Define traits, knowledge areas, example interactions, and more
- **Embeddable Chat Widget**: Easily embed your public personas into any website
- **Image Generation**: Generate images using natural language descriptions
- **Smart Suggestions**: Context-aware chat suggestions for better interactions
- **Conversation Management**: Save, organize, and continue multiple conversations
- **Message Actions**: Copy messages and download generated images
- **Responsive Design**: Fully responsive interface that works on all devices
- **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS
- **Type Safety**: Built with TypeScript for enhanced reliability
- **Subscription Plans**: Flexible usage-based pricing with free trial option

## Tech Stack

- **Frontend Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Deployment**: Netlify

## Project Structure

```
src/
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── ...
├── data/              # Mock data and constants
├── lib/               # Core utilities and services
├── pages/             # Page components
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── App.tsx            # Main application component
```

## Key Components

- **Dashboard**: Main view for managing personas
- **PersonaDetails**: Detailed view of individual personas
- **CreatePersonaModal**: Modal for creating new personas
- **Navbar**: Navigation and user interface
- **UI Components**: Reusable components like Button, Card, Badge, and Avatar

## Features in Detail

### Persona Creation
- Name and description
- Avatar image upload
- Visibility settings (private/unlisted/public)
- Personality trait selection
- Knowledge area definition
- Communication style configuration
- Example interactions

### Chat Features
- Real-time conversations
- Image generation capabilities
- Smart context-aware suggestions
- Message copying and image downloads
- Conversation history and management
- Fullscreen chat mode

### Persona Management
- View detailed information
- Edit existing personas
- Create duplicates
- Delete personas
- Filter and search functionality

### Embedding
- Generate embed code for public personas
- Responsive chat widget
- Customizable appearance
- Cross-origin support

### UI/UX Features
- Responsive design
- Modern card-based layout
- Interactive filters and search
- Beautiful gradients and animations
- Intuitive navigation

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Future Enhancements

- Advanced chat capabilities
- Custom widget themes
- Persona sharing and marketplace
- Advanced customization options
- Integration with various AI models
- Analytics and usage tracking
- Collaborative features
- Team workspaces

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.