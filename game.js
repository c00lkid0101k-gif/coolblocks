import * as THREE from 'three';

// Game configuration
const BLOCK_SIZE = 1;
const WORLD_WIDTH = 32;
const WORLD_DEPTH = 32;
const WORLD_HEIGHT = 16;
const GRAVITY = -20;
const JUMP_VELOCITY = 8;
const MOVE_SPEED = 5;
const MOUSE_SENSITIVITY = 0.002;
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.3;

// Block types with colors
const BLOCK_TYPES = {
    grass: { color: 0x7cb342, topColor: 0x7cb342, sideColor: 0x8d6e63 },
    dirt: { color: 0x8d6e63 },
    stone: { color: 0x757575 },
    wood: { color: 0x6d4c41 },
    sand: { color: 0xfdd835 }
};

// Game state
class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // Player state
        this.player = {
            position: new THREE.Vector3(WORLD_WIDTH / 2, WORLD_HEIGHT + 2, WORLD_DEPTH / 2),
            velocity: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
            onGround: false
        };
        
        // Input state
        this.keys = {};
        this.mouseDown = { left: false, right: false };
        this.selectedBlock = 'grass';
        this.isPointerLocked = false;
        
        // World data
        this.world = new Map();
        this.worldMesh = null;
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Setup scene
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
        
        // Setup camera
        this.camera.position.copy(this.player.position);
        this.camera.rotation.order = 'YXZ';
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Generate world
        this.generateWorld();
        
        // Setup controls
        this.setupControls();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start game loop
        this.animate();
    }
    
    generateWorld() {
        // Generate a simple terrain with height variation
        for (let x = 0; x < WORLD_WIDTH; x++) {
            for (let z = 0; z < WORLD_DEPTH; z++) {
                // Simple height map using sine waves
                const height = Math.floor(
                    WORLD_HEIGHT / 2 + 
                    Math.sin(x / 5) * 2 + 
                    Math.cos(z / 5) * 2 +
                    Math.sin((x + z) / 8) * 1
                );
                
                // Place blocks from bottom to height
                for (let y = 0; y < height; y++) {
                    let blockType;
                    if (y === height - 1) {
                        blockType = 'grass';
                    } else if (y > height - 4) {
                        blockType = 'dirt';
                    } else {
                        blockType = 'stone';
                    }
                    this.setBlock(x, y, z, blockType);
                }
            }
        }
        
        this.rebuildWorldMesh();
    }
    
    setBlock(x, y, z, type) {
        const key = `${x},${y},${z}`;
        if (type === null) {
            this.world.delete(key);
        } else {
            this.world.set(key, type);
        }
    }
    
    getBlock(x, y, z) {
        return this.world.get(`${x},${y},${z}`) || null;
    }
    
    rebuildWorldMesh() {
        if (this.worldMesh) {
            this.scene.remove(this.worldMesh);
            this.worldMesh.geometry.dispose();
            this.worldMesh.material.dispose();
        }
        
        const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        const instancedMesh = new THREE.InstancedMesh(
            geometry,
            new THREE.MeshLambertMaterial({ vertexColors: true }),
            this.world.size
        );
        
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        let index = 0;
        
        for (const [key, blockType] of this.world) {
            const [x, y, z] = key.split(',').map(Number);
            
            // Check if block face is exposed (not covered by another block)
            const exposed = this.isBlockExposed(x, y, z);
            if (!exposed) continue;
            
            matrix.setPosition(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2, z + BLOCK_SIZE / 2);
            instancedMesh.setMatrixAt(index, matrix);
            
            const blockColor = BLOCK_TYPES[blockType]?.color || 0xffffff;
            color.setHex(blockColor);
            instancedMesh.setColorAt(index, color);
            
            index++;
        }
        
        instancedMesh.count = index;
        this.worldMesh = instancedMesh;
        this.scene.add(this.worldMesh);
    }
    
    isBlockExposed(x, y, z) {
        // Check if any face of the block is exposed (not covered by neighbor)
        const neighbors = [
            [x + 1, y, z],
            [x - 1, y, z],
            [x, y + 1, z],
            [x, y - 1, z],
            [x, y, z + 1],
            [x, y, z - 1]
        ];
        
        for (const [nx, ny, nz] of neighbors) {
            if (!this.getBlock(nx, ny, nz)) {
                return true;
            }
        }
        
        return false;
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Block selection with number keys
            if (e.code >= 'Digit1' && e.code <= 'Digit5') {
                const blockTypes = Object.keys(BLOCK_TYPES);
                const index = parseInt(e.code.charAt(5)) - 1;
                this.selectedBlock = blockTypes[index];
                this.updateBlockSelection();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse controls
        document.addEventListener('mousedown', (e) => {
            if (!this.isPointerLocked) {
                this.renderer.domElement.requestPointerLock();
                return;
            }
            
            if (e.button === 0) {
                this.mouseDown.left = true;
                this.breakBlock();
            } else if (e.button === 2) {
                this.mouseDown.right = true;
                this.placeBlock();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseDown.left = false;
            if (e.button === 2) this.mouseDown.right = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;
            
            this.player.rotation.y -= e.movementX * MOUSE_SENSITIVITY;
            this.player.rotation.x -= e.movementY * MOUSE_SENSITIVITY;
            this.player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.rotation.x));
        });
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
            const controlsInfo = document.getElementById('controls-info');
            if (this.isPointerLocked) {
                controlsInfo.classList.add('hidden');
            } else {
                controlsInfo.classList.remove('hidden');
            }
        });
        
        // Block toolbar clicks
        document.querySelectorAll('.block-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectedBlock = slot.dataset.block;
                this.updateBlockSelection();
            });
        });
    }
    
    updateBlockSelection() {
        document.querySelectorAll('.block-slot').forEach(slot => {
            if (slot.dataset.block === this.selectedBlock) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }
    
    raycast() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Check for intersections with blocks
        const maxDistance = 5;
        const direction = raycaster.ray.direction;
        const origin = raycaster.ray.origin;
        
        for (let distance = 0; distance < maxDistance; distance += 0.1) {
            const point = origin.clone().add(direction.clone().multiplyScalar(distance));
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            const z = Math.floor(point.z);
            
            if (this.getBlock(x, y, z)) {
                // Found a block, now find the face
                const prevPoint = origin.clone().add(direction.clone().multiplyScalar(distance - 0.1));
                const prevX = Math.floor(prevPoint.x);
                const prevY = Math.floor(prevPoint.y);
                const prevZ = Math.floor(prevPoint.z);
                
                return {
                    hit: true,
                    position: { x, y, z },
                    normal: {
                        x: prevX - x,
                        y: prevY - y,
                        z: prevZ - z
                    }
                };
            }
        }
        
        return { hit: false };
    }
    
    breakBlock() {
        const result = this.raycast();
        if (result.hit) {
            const { x, y, z } = result.position;
            this.setBlock(x, y, z, null);
            this.rebuildWorldMesh();
        }
    }
    
    placeBlock() {
        const result = this.raycast();
        if (result.hit) {
            const { x, y, z } = result.position;
            const { x: nx, y: ny, z: nz } = result.normal;
            const newX = x + nx;
            const newY = y + ny;
            const newZ = z + nz;
            
            // Don't place block if player is there
            const playerBlockX = Math.floor(this.player.position.x);
            const playerBlockY = Math.floor(this.player.position.y);
            const playerBlockZ = Math.floor(this.player.position.z);
            
            if (newX === playerBlockX && newY === playerBlockY && newZ === playerBlockZ) {
                return;
            }
            if (newX === playerBlockX && newY === playerBlockY - 1 && newZ === playerBlockZ) {
                return;
            }
            
            this.setBlock(newX, newY, newZ, this.selectedBlock);
            this.rebuildWorldMesh();
        }
    }
    
    updatePlayer(deltaTime) {
        // Movement input
        const moveDirection = new THREE.Vector3();
        
        if (this.keys['KeyW']) moveDirection.z -= 1;
        if (this.keys['KeyS']) moveDirection.z += 1;
        if (this.keys['KeyA']) moveDirection.x -= 1;
        if (this.keys['KeyD']) moveDirection.x += 1;
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            moveDirection.applyEuler(new THREE.Euler(0, this.player.rotation.y, 0));
            
            this.player.velocity.x = moveDirection.x * MOVE_SPEED;
            this.player.velocity.z = moveDirection.z * MOVE_SPEED;
        } else {
            this.player.velocity.x = 0;
            this.player.velocity.z = 0;
        }
        
        // Jump
        if (this.keys['Space'] && this.player.onGround) {
            this.player.velocity.y = JUMP_VELOCITY;
            this.player.onGround = false;
        }
        
        // Apply gravity
        if (!this.player.onGround) {
            this.player.velocity.y += GRAVITY * deltaTime;
        }
        
        // Update position
        const newPosition = this.player.position.clone();
        newPosition.x += this.player.velocity.x * deltaTime;
        newPosition.y += this.player.velocity.y * deltaTime;
        newPosition.z += this.player.velocity.z * deltaTime;
        
        // Collision detection
        this.player.onGround = false;
        
        // Check vertical collision (feet)
        const feetY = Math.floor(newPosition.y - PLAYER_HEIGHT);
        const blockBelowX = Math.floor(newPosition.x);
        const blockBelowZ = Math.floor(newPosition.z);
        
        if (this.getBlock(blockBelowX, feetY, blockBelowZ)) {
            newPosition.y = feetY + PLAYER_HEIGHT + 1;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Simple boundary check
        newPosition.x = Math.max(0, Math.min(WORLD_WIDTH - 1, newPosition.x));
        newPosition.z = Math.max(0, Math.min(WORLD_DEPTH - 1, newPosition.z));
        
        // Keep player above world
        if (newPosition.y < -10) {
            newPosition.y = WORLD_HEIGHT + 10;
            this.player.velocity.y = 0;
        }
        
        this.player.position.copy(newPosition);
        
        // Update camera
        this.camera.position.copy(this.player.position);
        this.camera.rotation.x = this.player.rotation.x;
        this.camera.rotation.y = this.player.rotation.y;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        this.updatePlayer(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Start the game
const game = new Game();
