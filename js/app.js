import {Nonogram} from './nonogram.js'
import {Puzzles} from './puzzle_data.js'
import {solve} from './solver.js'
import {makeChild} from './utils.js'

function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

function startSolving(nonogram) {
  let root = document.getElementById('puzzle')
  nonogram.render(root)

  let startTime = performance.now()
  solve(nonogram, async () => {
    let endTime = performance.now()
    console.log(`step in ${endTime - startTime} ms`)

    nonogram.render(root)
    await sleep(10)

    startTime = performance.now()
  })
}

function init() {
  let list = document.getElementById('puzzle-list')
  for (let key of Object.keys(Puzzles)) {
    let button = makeChild(list, 'a')
    button.href = '#'
    button.innerText = key
    button.dataset.key = key
    button.addEventListener('click', event => {
      event.preventDefault()

      let key = event.target.dataset.key
      let [rowHints, colHints, creditText] = Puzzles[key]

      document.getElementById('credits').innerText = creditText
      document.getElementById('picker').style.display = 'none'

      let nonogram = new Nonogram(rowHints, colHints)
      startSolving(nonogram)
    })
  }

}

init()
