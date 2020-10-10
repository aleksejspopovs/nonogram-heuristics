import {Nonogram} from './nonogram.js'
import {solve} from './solver.js'

function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

function init() {
  let root = document.getElementById('content')
  let nonogram = new Nonogram(
    [[2], [2, 1], [1, 1], [3], [1, 1], [1, 1], [2], [1, 1], [1, 2], [2]],
    [[2, 1], [2, 1, 3], [7], [1, 3], [2, 1]]
  )

  nonogram.render(root)

  solve(nonogram, async () => {
    nonogram.render(root)
    await sleep(100)
  })
}

init()
