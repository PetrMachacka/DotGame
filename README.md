# Dots and Boxes Game

A modern implementation of the classic Dots and Boxes game built with React, TypeScript, and Vite. Play against a friend or challenge an AI bot in this interactive grid-based strategy game.

## Features

- **Two Player Mode**: Play against a friend locally
- **AI Bot**: Challenge yourself against an intelligent computer opponent
- **Customizable Grid Size**: Adjust the board size to your preference
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Score Tracking**: Real-time score display for both players
- **Game State Persistence**: Your game progress is automatically saved
- **Modern UI**: Clean, intuitive interface with hover effects and animations

## How to Play

1. Players take turns clicking on the lines between dots to draw them
2. When a player completes a box (all four sides), they score a point and get another turn
3. The game ends when all possible boxes are completed
4. The player with the most boxes wins!

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd testPages
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## Game Controls

- **Click on lines** to draw them
- **Settings button** (⚙️) to access game options
- **Start Again** button appears when the game ends

## Settings

Access the settings page to:
- Change board size (increase/decrease grid dimensions)
- Toggle AI bot on/off
- Reset the current game

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **React Router** - Navigation between game and settings
- **CSS Modules** - Scoped styling
- **Context API** - State management for game grid and player data

## Project Structure

```
src/
├── components/          # React components
│   ├── Board.tsx       # Main game board
│   ├── Block.tsx       # Individual box component
│   ├── Line.tsx        # Line drawing component
│   ├── Bot.tsx         # AI bot logic
│   ├── PlayGround.tsx  # Main game interface
│   └── Settings.tsx    # Settings page
├── Providers/          # Context providers
│   ├── GridProvider.tsx    # Game grid state management
│   └── PlayerProvider.tsx  # Player state management
├── styles/             # CSS modules
├── assets/             # SVG icons and images
└── App.tsx            # Main application component
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Classic Dots and Boxes game concept
- React community for excellent tooling and documentation

