# ♛ N-Queens 3D

This project is a visual implementation of the N-Queens problem using Three.js in a 3D environment. It helps users understand how N queens can be placed on an N×N chessboard such that no two queens threaten each other.

## Features

- Backtracking algorithm to solve the N-Queens problem
- Real-time 3D rendering of the board and queen positions using Three.js
- Adjustable board size (supports N from 4 to 12)
- Intuitive controls to rotate, zoom, and explore the solution space

## Project Structure

```plaintext
n-queens-3d/
│
├── public/             # Static assets (if any)
├── src/
│   ├── main.js         # Main logic including board setup & algorithm
│   └── style.css       # Styling for the app
│
├── index.html          # Entry point of the app
├── package.json        # Project dependencies & scripts
└── .gitignore
```

## Technologies Used

- Three.js
- JavaScript
- HTML/CSS
- Git & GitHub for version control

## Getting Started

To run the project locally:

```bash
git clone https://github.com/trish2023/n-queens-3d.git
cd n-queens-3d
npm install
npm run dev   # or use a local server like live-server or vite
