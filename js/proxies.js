import {CellState} from './nonogram.js'
import {assert, reverse} from './utils.js'

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

  mirror () {
    // returns a proxy object that acts just like `this`, except
    // the coordinates are mirrored (so the 0th element is what
    // used to be the last, etc). hints are also reversed accordingly.
    // note that the proxy does not have its own `modified` flag
    // ---it can write and consume `this.modified`!
    let lengthCached = this.length()
    return new Proxy(this, {
      get: function (receiver, name) {
        switch (name) {
          case 'coords': {
            return i => receiver.coords(lengthCached - 1 - i)
          }
          case 'hints': {
            return () => reverse(receiver.hints())
          }
          default: {
            return receiver[name]
          }
        }
      }
    })
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
