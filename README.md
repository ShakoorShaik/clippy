# Clippy

A modern, feature-rich drawing application inspired by MS Paint with AI-powered drawing challenges. Built with p5.js and powered by OpenAI's GPT-4.


## DEMO

https://github.com/user-attachments/assets/1f05ed35-a38f-4962-bda8-71261988edc0


![Clippy Banner](https://img.shields.io/badge/p5.js-ED225D?style=for-the-badge&logo=p5.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

## Features

### Core Drawing Tools
- **Multiple Brush Tools**: Standard brush, eraser, spray paint, and precise drawing tools
- **Shape Tools**: Draw perfect lines, rectangles, and circles with live previews
- **Text Tool**: Add custom text with adjustable size
- **Color Customization**: Full RGB color picker for brush and background colors
- **Adjustable Brush Size**: 1-50px range with visual slider feedback

### Advanced Features

- **Multi-Layer System**: Create and manage multiple drawing layers independently
- **Undo/Redo**: (Ctrl+Z / Ctrl+Y)
- **Canvas Zoom**: Scale canvas from 30% to 300% (Ctrl +/- and Ctrl+0 to reset)
- **Export**: Save your artwork as PNG files
- **Keyboard Shortcuts**: Quick access to all tools and common actions

### AI-Powered Game Mode 🎮
- **Drawing Challenges**: Get random AI-generated prompts to draw
- **Real-time Prompts**: Powered by OpenAI's GPT-4o-mini
- **Start/Stop Controls**: Begin new challenges or stop current ones at any time

## 🛠️ Technologies Used

### Frontend
- **p5.js (v1.7.0)**: Canvas-based graphics library for smooth drawing operations
- **HTML5 & CSS3**: Modern, responsive UI with polished effects
- **Google Fonts (Inter)**: Clean, professional typography
- **Javascript**: Powers the entire interactive drawing app (i.e. handling tools, layers, mouse input, undo/redo, and game logic using p5.js) on the front end

### Backend
- **Node.js**: JavaScript runtime for server operations
- **Express.js**: Minimal web framework for API endpoints
- **OpenAI API**: GPT-4o-mini model for generating creative drawing prompts

## 🚀 GETTING STARTED

### Prerequisites
- Node.js
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
   git clone 
   cd clippy
```

2. **Install dependencies**
```bash
   npm install express node-fetch dotenv
```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
```

4. **Organize your files**
   
   Ensure your project structure looks like this:
```
   clippy/
   ├── public/
   │   ├── index.html
   │   └── sketch.js
   ├── server.js
   ├── .env
   └── package.json
```

5. **Start the server**
```bash
   node server.js
```

6. **Open in browser**
   
   Navigate to `http://localhost:3000`

## 🎮 How to Use

### Basic Drawing
1. Select a tool from the sidebar dropdown
2. Choose your brush color and size
3. Click and drag on the canvas to draw
4. Use the background color picker to change the canvas color

### Layer Management
1. Click "+ New" to create a new layer
2. Switch between layers using the dropdown
3. Each layer maintains its own undo/redo history
4. Clear individual layers with the "Clear" button

### Game Mode
1. Click "Start Game" to receive an AI-generated drawing prompt
2. The prompt appears both in the sidebar and as an overlay on the canvas
3. Draw the prompted object
4. Click "Stop Game" when done or to get a new prompt

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `1-5` | Set brush size (5, 10, 15, 20, 30) |
| `B` | Brush tool |
| `E` | Eraser tool |
| `S` | Spray tool |
| `L` | Line tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `T` | Text tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save canvas |
| `Ctrl +` | Zoom in |
| `Ctrl -` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `Delete/Backspace` | Clear active layer |

## 🎨 Features in Detail

### Drawing Tools
- **Brush**: Freehand drawing with smooth line interpolation
- **Eraser**: Remove content without affecting other layers
- **Spray**: Particle-based spray paint effect
- **Line**: Click and drag to draw straight lines with preview
- **Rectangle**: Draw rectangular outlines with live preview
- **Circle**: Create circles from center point with live preview
- **Triangle**: Create trianglas from top point with live preview
- **Text**: Click to place custom text with adjustable size

### Layer System
Each layer is an independent p5.Graphics object, allowing for:
- Non-destructive editing across multiple layers
- Independent undo/redo history per layer
- Ability to clear or modify layers without affecting others
- Composite rendering for the final image 

### AI Integration
The game mode uses OpenAI's GPT-4o-mini to generate creative, single-word drawing prompts. The system:
- Makes asynchronous API calls to maintain smooth UI performance
- Handles errors gracefully with user feedback
- Allows unlimited prompt generation (subject to API rate limits)
- Displays prompts both in the sidebar and as a canvas overlay

## 👨‍💻 Author

Created with ❤️ using p5.js and modern web technologies


