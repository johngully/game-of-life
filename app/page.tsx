'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { Cell, CellState, Grid } from '../types/gameOfLife';

const generationDelayMilliseconds = 150;

function createInitialGrid(width: number, height: number, aliveCells: Cell[] = []): Grid {
  // First, create cells with all dead state
  const cells: Cell[][] = Array(height).fill(null).map((_, y) =>
    Array(width).fill(null).map((_, x) => ({
      state: 'dead',
      x,
      y,
      neighbors: [],
    }))
  );

  // Set the state of alive cells
  for (const aliveCell of aliveCells) {
    if (aliveCell.x < width && aliveCell.y < height) {
      cells[aliveCell.y][aliveCell.x].state = 'alive';
    }
  }

  // Assign neighbors to each cell
  for (const row of cells) {
    for (const cell of row) {
      cell.neighbors = getNeighbors(cells, cell, width, height);
    }
  }

  return { cells, width, height, generation: 0 };
}

function getNeighbors(cells: Cell[][], cell: Cell, width: number, height: number): Cell[] {
  const neighbors: Cell[] = [];
  const directions = [
    { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 },
    { x: 0, y: -1 },                  { x: 0, y: 1 },
    { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }
  ];

  for (const direction of directions) {
    const newX = cell.x + direction.x;
    const newY = cell.y + direction.y;
    if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
      const neighbor = cells[newY][newX];
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

function createNextGeneration(currentGrid: Grid): Grid {
  const newCells: Cell[][] = currentGrid.cells.map(row =>
    row.map(cell => {
      const state = getNextCellState(cell);
      const newCell = { ...cell, state };
      return newCell;
    })
  );

  for (const row of newCells) {
    for (const cell of row) {
      cell.neighbors = getNeighbors(newCells, cell, currentGrid.width, currentGrid.height);
    }
  }

  return { 
    ...currentGrid, 
    cells: newCells, 
    generation: currentGrid.generation + 1  // Increment generation
  };
}

function getNextCellState(cell: Cell): CellState {
  const state = shouldSurvive(cell) || shouldBeBorn(cell) ? 'alive' : 'dead';
  return state;

}

function countLiveNeighbors(cell: Cell): number {
  return cell.neighbors.filter(neighbor => neighbor.state === 'alive').length;
}

function shouldSurvive(cell: Cell): boolean {
  const liveNeighbors = countLiveNeighbors(cell);
  return cell.state === 'alive' && (liveNeighbors === 2 || liveNeighbors === 3);
}

function shouldBeBorn(cell: Cell): boolean {
  const liveNeighbors = countLiveNeighbors(cell);
  return cell.state === 'dead' && liveNeighbors === 3;
}

function areGridsEqual(grid1: Grid, grid2: Grid): boolean {
  if (grid1.width !== grid2.width || grid1.height !== grid2.height) {
    return false;
  }
  for (let y = 0; y < grid1.height; y++) {
    for (let x = 0; x < grid1.width; x++) {
      if (grid1.cells[y][x].state !== grid2.cells[y][x].state) {
        return false;
      }
    }
  }
  return true;
}

function getGenerationColor(generation: number): string {
  const colors = [
    'bg-red-500', 'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500', 
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500', 'bg-cyan-500', 
    'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 
    'bg-amber-500', 'bg-orange-500', 'bg-red-500'
  ];
  return colors[generation % colors.length];
}

export default function Home() {
  const width = 25;
  const height = 25;
  const [aliveCells, setAliveCells] = useState<Cell[]>([]);
  const [grid, setGrid] = useState<Grid>(createInitialGrid(width, height));
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<'alive' | 'dead'>('alive');

  const advanceGeneration = useCallback(() => {
    setGrid(currentGrid => {
      const nextGrid = createNextGeneration(currentGrid);
      if (areGridsEqual(currentGrid, nextGrid)) {
        setIsAutoAdvancing(false);
        setIsRunning(false);
      }
      return nextGrid;
    });
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning && isAutoAdvancing) {
      intervalId = setInterval(advanceGeneration, generationDelayMilliseconds); // Advance every 500ms
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, isAutoAdvancing, advanceGeneration]);

  function toggleCellState(x: number, y: number) {
    if (isRunning) return;

    setAliveCells(currentAliveCells => {
      const cellIndex = currentAliveCells.findIndex(cell => cell.x === x && cell.y === y);
      if (cellIndex > -1) {
        return currentAliveCells.filter((_, index) => index !== cellIndex);
      } else {
        return [...currentAliveCells, { state: 'alive', x, y, neighbors: [] }];
      }
    });

    const newAliveCells = [
      ...aliveCells,
      { state: 'alive' as const, x, y, neighbors: [] }
    ];
    const newGrid = createInitialGrid(width, height, newAliveCells);
    setGrid(newGrid);
  }

  function handleMouseDown(x: number, y: number) {
    if (isRunning) return;
    setIsDragging(true);
    const newState = grid.cells[y][x].state === 'alive' ? 'dead' : 'alive';
    setDragState(newState);
    toggleCellState(x, y);
  }

  function handleMouseEnter(x: number, y: number) {
    if (isRunning || !isDragging) return;
    if (dragState === 'alive' && grid.cells[y][x].state === 'dead') {
      toggleCellState(x, y);
    } else if (dragState === 'dead' && grid.cells[y][x].state === 'alive') {
      toggleCellState(x, y);
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  function startSimulation() {
    setIsRunning(true);
  }

  function toggleAutoAdvance() {
    setIsAutoAdvancing(current => !current);
  }

  function resetGrid() {
    setAliveCells([]);
    setGrid(createInitialGrid(width, height));
    setIsRunning(false);
    setIsAutoAdvancing(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-3">
      <div>Generation: {grid.generation}</div>
      <div 
        className="grid gap-1 py-3" 
        style={{ gridTemplateColumns: `repeat(${grid.width}, 1fr)` }}
        onMouseLeave={() => setIsDragging(false)}
      >
        {grid.cells.flat().map((cell) => (
          <div
            key={`${cell.x}-${cell.y}`}
            className={`rounded-full w-6 h-6 border ${
              cell.state === 'alive' ? getGenerationColor(grid.generation) : 'bg-white'
            } ${!isRunning ? 'cursor-pointer hover:bg-gray-200' : ''}`}
            onMouseDown={() => handleMouseDown(cell.x, cell.y)}
            onMouseEnter={() => handleMouseEnter(cell.x, cell.y)}
          />
        ))}
      </div>
      <div className="flex gap-4 py-3">
        {!isRunning && (
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={startSimulation}
          >
            Start
          </button>
        )}
        {isRunning && (
          <>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={advanceGeneration}
            >
              Next
            </button>
            <button 
              className={`px-4 py-2 ${isAutoAdvancing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded`}
              onClick={toggleAutoAdvance}
            >
              {isAutoAdvancing ? 'Pause' : 'Auto'}
            </button>
          </>
        )}
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={resetGrid}
        >
          Reset
        </button>
      </div>
    </main>
  );
}
