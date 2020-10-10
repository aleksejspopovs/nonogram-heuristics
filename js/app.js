import {Nonogram} from './nonogram.js'
import {solve} from './solver.js'

function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

let Nonograms = {
  // puzzle #1 on webpbn.com by Jan Wolter (jan)
  'webpbn_1': [
    [[2], [2, 1], [1, 1], [3], [1, 1], [1, 1], [2], [1, 1], [1, 2], [2]],
    [[2, 1], [2, 1, 3], [7], [1, 3], [2, 1]],
  ],
  // puzzle #34383 on webpbn.com by Brian Bellis (mootpoint)
  'webpbn_34383': [
    [[3], [5], [7], [8], [10], [1, 1, 5, 2], [8, 1, 3], [1, 6, 1, 1, 1, 2], [2, 5, 3, 1, 1, 3], [3, 3, 5, 1, 1, 1, 1, 1, 1, 1], [4, 9, 1, 1, 1, 1, 1, 2], [13, 3, 1, 1, 1, 1, 1, 2], [14, 5, 1, 1, 1, 1, 1], [5, 8, 6, 1, 1, 1, 2], [4, 7, 9, 1, 3], [4, 4, 14, 1], [4, 4, 13, 2], [4, 4, 13, 2], [5, 4, 12, 3], [5, 5, 11, 3], [6, 6, 6, 5], [6, 6, 4, 2, 4], [6, 6, 3, 4], [6, 6, 3, 4], [6, 6, 3, 4], [6, 5, 3, 4], [6, 5, 3, 4], [4, 3, 3, 5], [3, 2, 3, 5], [3, 2, 3, 5]],
    [[6, 7], [21], [5, 20], [4, 3, 20], [10, 19], [5, 4, 2, 9, 1], [10, 3], [8, 5], [6, 6, 6], [4, 19], [2, 22], [1, 1, 22], [1, 1, 19, 1], [2, 1, 1, 3, 7], [2, 3, 4], [1, 1, 10], [1, 1, 9], [2, 1, 9], [2, 11], [1, 1, 10, 1], [1, 1, 9, 2], [1, 1, 8, 3], [1, 1, 8, 7], [1, 1, 6, 7, 1], [1, 1, 1, 5, 6, 2], [1, 1, 7, 3], [1, 1, 1, 3, 10], [1, 1, 2, 12], [2, 2, 13], [17]],
  ]
}

function init() {
  let root = document.getElementById('content')
  let [rowHints, colHints] = Nonograms.webpbn_34383
  let nonogram = new Nonogram(rowHints, colHints)

  nonogram.render(root)

  let startTime = performance.now()
  solve(nonogram, async () => {
    let endTime = performance.now()
    console.log(`step in ${endTime - startTime} ms`)

    nonogram.render(root)
    await sleep(100)

    startTime = performance.now()
  })
}

init()
