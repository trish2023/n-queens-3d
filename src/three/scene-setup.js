import * as THREE from 'three';

let scene, camera, renderer;
let controls;
let dynamicLight; // Reference to our camera-relative light

// OrbitControls implementation (since import path may not work)
class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3();
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;
    this.panOffset = new THREE.Vector3();
    
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    
    this.isMouseDown = false;
    
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this));
  }
  
  onMouseDown(event) {
    this.isMouseDown = true;
    this.rotateStart.set(event.clientX, event.clientY);
  }
  
  onMouseMove(event) {
    if (!this.isMouseDown) return;
    
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(0.01);
    
    this.sphericalDelta.theta -= this.rotateDelta.x;
    this.sphericalDelta.phi -= this.rotateDelta.y;
    
    this.rotateStart.copy(this.rotateEnd);
  }
  
  onMouseUp() {
    this.isMouseDown = false;
  }
  
  onWheel(event) {
    if (event.deltaY < 0) {
      this.scale *= 0.995;
    } else {
      this.scale *= 1.005;
    }
  }
  
  update() {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.target);
    
    this.spherical.setFromVector3(offset);
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.radius *= this.scale;
    
    // Limit zoom distance to prevent going through board or too far away
    this.spherical.radius = Math.max(5, Math.min(50, this.spherical.radius));
    
    // Limit phi to avoid flipping
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    
    offset.setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
    
    if (this.enableDamping) {
      this.sphericalDelta.theta *= (1 - this.dampingFactor);
      this.sphericalDelta.phi *= (1 - this.dampingFactor);
      this.scale = 1 + (this.scale - 1) * (1 - this.dampingFactor);
    } else {
      this.sphericalDelta.set(0, 0, 0);
      this.scale = 1;
    }
  }
}

export function initScene(n) {
  // Scene
  scene = new THREE.Scene();
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(n / 2, n, n * 1.2);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  
  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0, 0);
  controls.update();
  
  // Main dynamic directional light that follows camera perspective
  dynamicLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dynamicLight.castShadow = true;
  dynamicLight.shadow.mapSize.width = 4096;
  dynamicLight.shadow.mapSize.height = 4096;
  dynamicLight.shadow.camera.near = 0.5;
  dynamicLight.shadow.camera.far = 50;
  dynamicLight.shadow.camera.left = -15;
  dynamicLight.shadow.camera.right = 15;
  dynamicLight.shadow.camera.top = 15;
  dynamicLight.shadow.camera.bottom = -15;
  dynamicLight.shadow.bias = -0.0001;
  scene.add(dynamicLight);
  
  // Add softer ambient light (stays constant)
  const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
  scene.add(ambientLight);
  
  // Add a subtle fill light from opposite side for better depth
  const fillLight = new THREE.DirectionalLight(0x9bb5ff, 0.15);
  fillLight.position.set(-8, 6, -8);
  scene.add(fillLight);
  
  // Create chessboard
  createChessboard(n, scene);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
  
  // Return the scene so it can be passed to other functions
  return scene;
}

function createChessboard(size, scene) {
  const boardSize = size;
  const squareSize = 1;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const geometry = new THREE.BoxGeometry(squareSize, 0.1, squareSize);
      
      // Alternate colors
      const isLight = (i + j) % 2 === 0;
      const color = isLight ? 0xf0d9b5 : 0xb58863;
      const material = new THREE.MeshLambertMaterial({ color: color });
      
      const square = new THREE.Mesh(geometry, material);
      square.receiveShadow = true;
      square.position.set(
        i * squareSize - (boardSize * squareSize) / 2 + squareSize / 2,
        0,
        j * squareSize - (boardSize * squareSize) / 2 + squareSize / 2
      );
      
      scene.add(square);
    }
  }
}

// Function to create a chess queen geometry
function createQueenGeometry() {
  const group = new THREE.Group();
  
  // Base (wide and stable)
  const baseGeometry = new THREE.CylinderGeometry(0.4, 0.45, 0.12, 32);
  const base = new THREE.Mesh(baseGeometry);
  base.position.y = 0.06;
  group.add(base);
  
  // Lower section (tapered)
  const lowerGeometry = new THREE.CylinderGeometry(0.32, 0.4, 0.2, 32);
  const lower = new THREE.Mesh(lowerGeometry);
  lower.position.y = 0.22;
  group.add(lower);
  
  // Narrow waist (distinctive cinched middle)
  const waistGeometry = new THREE.CylinderGeometry(0.18, 0.32, 0.15, 32);
  const waist = new THREE.Mesh(waistGeometry);
  waist.position.y = 0.395;
  group.add(waist);
  
  // Upper body (flares out)
  const upperGeometry = new THREE.CylinderGeometry(0.28, 0.18, 0.18, 32);
  const upper = new THREE.Mesh(upperGeometry);
  upper.position.y = 0.56;
  group.add(upper);
  
  // Neck (slight taper)
  const neckGeometry = new THREE.CylinderGeometry(0.22, 0.28, 0.08, 32);
  const neck = new THREE.Mesh(neckGeometry);
  neck.position.y = 0.69;
  group.add(neck);
  
  // Crown base (wider platform)
  const crownBaseGeometry = new THREE.CylinderGeometry(0.26, 0.22, 0.06, 32);
  const crownBase = new THREE.Mesh(crownBaseGeometry);
  crownBase.position.y = 0.76;
  group.add(crownBase);
  
  // Crown middle section
  const crownMiddleGeometry = new THREE.CylinderGeometry(0.24, 0.26, 0.08, 32);
  const crownMiddle = new THREE.Mesh(crownMiddleGeometry);
  crownMiddle.position.y = 0.83;
  group.add(crownMiddle);
  
  // Crown spikes (5 main spikes like traditional queen)
  const spikeGeometry = new THREE.ConeGeometry(0.04, 0.18, 12);
  const spikePositions = [
    { x: 0, z: 0, height: 0.22 },        // center (tallest)
    { x: 0.15, z: 0, height: 0.15 },     // right
    { x: -0.15, z: 0, height: 0.15 },    // left
    { x: 0, z: 0.15, height: 0.15 },     // front
    { x: 0, z: -0.15, height: 0.15 },    // back
  ];
  
  spikePositions.forEach((pos) => {
    const spikeGeo = new THREE.ConeGeometry(0.04, pos.height, 12);
    const spike = new THREE.Mesh(spikeGeo);
    spike.position.set(pos.x, 0.87 + pos.height/2, pos.z);
    group.add(spike);
  });
  
  // Top orb (crown jewel)
  const orbGeometry = new THREE.SphereGeometry(0.05, 16, 12);
  const orb = new THREE.Mesh(orbGeometry);
  orb.position.y = 1.09;
  group.add(orb);
  
  return group;
}

export function placeQueens(sceneParam, positions) {
  // Use the passed scene parameter instead of global scene
  const targetScene = sceneParam || scene;
  
  // Remove any existing queens first
  const objectsToRemove = [];
  targetScene.traverse((child) => {
    if (child.userData.isQueen) {
      objectsToRemove.push(child);
    }
  });
  objectsToRemove.forEach((obj) => targetScene.remove(obj));

  // Golden material like the reference image
  const queenMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xDAA520,  // Golden color
    metalness: 0.8,   // High metalness for gold look
    roughness: 0.1,   // Low roughness for shiny surface
    envMapIntensity: 1.0
  });

  const boardSize = positions.length;
  const squareSize = 1;

  for (let row = 0; row < boardSize; row++) {
    const col = positions[row];

    const queenGeometry = createQueenGeometry();
    
    // Apply material to all meshes in the group
    queenGeometry.traverse((child) => {
      if (child.isMesh) {
        child.material = queenMaterial.clone();
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    queenGeometry.userData.isQueen = true; // Mark as queen for removal

    // Use the same positioning logic as the chessboard squares
    queenGeometry.position.set(
      row * squareSize - (boardSize * squareSize) / 2 + squareSize / 2,
      0.05, // Base height on the board
      col * squareSize - (boardSize * squareSize) / 2 + squareSize / 2
    );

    targetScene.add(queenGeometry);
  }
}

function animate() {
  requestAnimationFrame(animate);
  
  // Update light position to follow camera perspective for natural shadows
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  
  // Position light relative to camera but offset for good shadow angles
  const lightOffset = new THREE.Vector3();
  lightOffset.copy(camera.position);
  
  // Add some offset to create nice shadow angles
  lightOffset.x += 8;
  lightOffset.y += 5;
  lightOffset.z += 8;
  
  dynamicLight.position.copy(lightOffset);
  
  // Point light toward the board center
  dynamicLight.target.position.set(0, 0, 0);
  dynamicLight.target.updateMatrixWorld();
  
  controls.update();
  
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
}