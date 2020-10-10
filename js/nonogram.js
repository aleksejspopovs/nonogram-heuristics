import {enumerate, makeChild} from './utils.js'

export let CellState = {
  Unknown: Symbol('CellState.Unknown'),
  Filled: Symbol('CellState.Filled'),
  Empty: Symbol('CellState.Empty'),
}

export class Nonogram {
  constructor (rowHints, colHints) {
    this.rowHints = rowHints
    this.colHints = colHints
    this.rows = rowHints.length
    this.cols = colHints.length

    this.state = []
    for (let i = 0; i < this.rows; i++) {
      this.state.push([])
      for (let j = 0; j < this.cols; j++) {
        this.state[i].push(CellState.Unknown)
      }
    }
  }

  render (root) {
    if (root.querySelector('table') === null) {
      let table = makeChild(root, 'table')

      let trColHints = makeChild(table, 'tr')
      makeChild(trColHints, 'td')
      for (let hints of this.colHints) {
        makeChild(trColHints, 'td', ['col-hints']).innerHTML = hints.join('<br>')
      }

      for (let [i, hints] of enumerate(this.rowHints)) {
        let tr = makeChild(table, 'tr')
        makeChild(tr, 'td', ['row-hints']).innerText = hints.join(' ')
        for (let j = 0; j < this.cols; j++) {
          makeChild(tr, 'td', ['cell']).dataset.coords = `${i}-${j}`
        }
      }
    }

    let table = root.querySelector('table')
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        let cell = table.querySelector(`[data-coords="${i}-${j}"]`)
        cell.classList.toggle('cell-unknown', this.state[i][j] == CellState.Unknown)
        cell.classList.toggle('cell-filled', this.state[i][j] == CellState.Filled)
        cell.classList.toggle('cell-empty', this.state[i][j] == CellState.Empty)
      }
    }
  }
}
