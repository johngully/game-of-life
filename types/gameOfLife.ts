export type CellState = 'alive' | 'dead';

export interface Cell {
  state: CellState;
  x: number;
  y: number;
  neighbors: Cell[];
}

export interface Grid {
  cells: Cell[][];
  width: number;
  height: number;
  generation: number;
}