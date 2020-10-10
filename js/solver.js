import {CellState} from './nonogram.js'

export async function solve(nonogram, step) {
  for (let i = 0; i < 3; i++) {
    nonogram.state[0][i] = CellState.Filled
    await step()
  }
}
