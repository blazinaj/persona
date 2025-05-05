# Persona - AI Agent Creation Platform

Create, customize, and manage AI agents with different personalities and skill sets. Live demo: [View Demo](https://incandescent-llama-54a88f.netlify.app)

![Persona Dashboard](https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)

## Features

- **Create Custom AI Personas**: Design AI agents with unique personalities, knowledge areas, and communication styles
- **Persona Management**: Edit, duplicate, and delete personas
- **Rich Persona Details**: Define traits, knowledge areas, example interactions, and more
- **Responsive Design**: Fully responsive interface that works on all devices
- **Modern UI**: Beautiful, intuitive interface built with Tailwind CSS
- **Type Safety**: Built with TypeScript for enhanced reliability

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
- Personality trait selection
- Knowledge area definition
- Communication style configuration
- Example interactions
- Public/private visibility setting

### Persona Management
- View detailed information
- Edit existing personas
- Create duplicates
- Delete personas
- Filter and search functionality

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

- User authentication and authorization
- Real-time chat with AI personas
- Persona sharing and marketplace
- Advanced customization options
- Integration with various AI models
- Analytics and usage tracking
- Collaborative features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.