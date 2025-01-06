# Code Generation UI

A modern React application that provides a user interface for generating code using AI. The application features real-time code generation, live preview, and file management capabilities.

## Features

- 🚀 Real-time code generation with live status updates
- 👁️ Live preview of generated code
- 📁 File tree visualization
- 💻 Syntax-highlighted code preview
- 📦 Code download functionality
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔄 Server-sent events (SSE) for real-time updates

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd code-generation-ui
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Set up environment variables:
   - Copy `.env.development` for local development
   - Copy `.env.production` for production deployment
   - Update the API URLs as needed

### Development

Run the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
# or
yarn build
```

### Environment Variables

- `VITE_API_URL`: The base URL for the code generation API
  - Development: `http://localhost:8000`
  - Production: `https://api-autogen-production.up.railway.app`

## Project Structure

```
├── src/
│   ├── components/         # React components
│   │   ├── CodePreview.tsx
│   │   ├── Preview.tsx
│   │   └── ...
│   ├── services/          # API services
│   │   └── api.ts
│   ├── styles/           # CSS styles
│   ├── config/           # Configuration files
│   │   └── env.ts
│   ├── App.tsx
│   └── main.tsx
├── public/              # Static assets
├── .env.development    # Development environment variables
├── .env.production    # Production environment variables
└── package.json
```

## Features in Detail

### Code Generation
- Real-time code generation with progress updates
- Support for multiple file types
- Error handling and validation

### Preview System
- Live preview of generated code
- Support for React components
- CSS module support
- Error boundary for safe rendering

### File Management
- Tree view of generated files
- File content preview
- Download functionality for generated code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 