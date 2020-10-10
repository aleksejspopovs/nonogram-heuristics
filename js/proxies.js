import {CellState} from './nonogram.js'
import {assert} from './utils.js'

class BaseProxy {
  constructor (nonogram) {
    this.nonogram = nonogram
    this.modified = false
  }

  coords (i) {
    throw new Error('abstract!')
  }

  length () {
    throw new Error('abstract!')
  }

  hints () {
    throw new Error('abstract!')
  }

  snapshot () {
    let result = []
    for (let i = 0; i < this.length(); i++) {
      result.push(this.get(i))
    }
    return result
  }

  get (i) {
    let [y, x] = this.coords(i)
    return this.nonogram.state[y][x]
  }

  set (i, state) {
    if (this.get(i) === CellState.Unknown) {
      this.modified = true
      let [y, x] = this.coords(i)
      this.nonogram.state[y][x] = state
    } else {
      assert(this.get(i) === state, 'overwriting a set cell')
    }
  }

  consumeModifiedFlag () {
    let result = this.modified
    this.modified = false
    return result
  }
}

export class RowProxy extends BaseProxy {
  constructor (nonogram, index) {
    super(nonogram)
    this.index = index
  }

  coords (i) {
    return [this.index, i]
  }

  length () {
    return this.nonogram.cols
  }

  hints () {
    return this.nonogram.rowHints[this.index]
  }
}

export class ColProxy extends BaseProxy {
  constructor (nonogram, index) {
    super(nonogram)
    this.index = index
  }

  coords (i) {
    return [i, this.index]
  }

  length () {
    return this.nonogram.rows
  }

  hints () {
    return this.nonogram.colHints[this.index]
  }
}
