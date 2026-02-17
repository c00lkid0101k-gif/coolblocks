# CoolBlocks 🎮

A 3D Voxel Game built with Three.js - Create your own blocky worlds like in Minecraft or Roblox!

## Features

- **3D Voxel World**: Explore and build in a procedurally generated 3D world
- **Block Building**: Place and destroy different types of blocks (Grass, Dirt, Stone, Wood, Sand)
- **First-Person Controls**: WASD movement with mouse look
- **Physics**: Gravity and collision detection
- **Terrain Generation**: Procedural terrain with natural-looking hills and valleys

## Controls

- **WASD** - Move around
- **Space** - Jump
- **Mouse** - Look around
- **Left Click** - Break blocks
- **Right Click** - Place blocks
- **1-5** - Select block type
- **Click on screen** - Start playing (locks cursor)
- **ESC** - Unlock cursor

## Installation & Running

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/c00lkid0101k-gif/coolblocks.git
cd coolblocks
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Technology Stack

- **Three.js** - 3D graphics library
- **Vite** - Build tool and dev server
- **Vanilla JavaScript** - No framework dependencies

## Game Architecture

- **Procedural Generation**: Terrain is generated using sine wave functions for natural-looking landscapes
- **Voxel System**: World is made up of 1x1x1 meter blocks
- **Instanced Rendering**: Efficient rendering of thousands of blocks
- **Raycasting**: Block selection and interaction

## License

MIT

---

*This game was created with AI assistance*
