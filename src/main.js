import { initScene } from './three/scene-setup.js';
import { placeQueens } from './three/scene-setup.js';

// Call this after DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const n = 8;
  const scene = initScene(n);
  
  const sampleSolution = [0, 4, 7, 5, 2, 6, 1, 3]; // sample solution for 8x8
  placeQueens(scene, sampleSolution);
});

