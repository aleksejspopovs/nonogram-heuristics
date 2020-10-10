import {CellState, Nonogram} from './nonogram.js'
import {Puzzles} from './puzzle_data.js'
import {solve} from './solver.js'
import {makeChild} from './utils.js'

function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

async function makeProgress(nonogram, root) {
  nonogram.render(root)

  let startTime = performance.now()
  await solve(nonogram, async () => {
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
    button.addEventListener('click', async event => {
      event.preventDefault()

      let key = event.target.dataset.key
      let [rowHints, colHints, creditText] = Puzzles[key]

      document.getElementById('credits').innerText = creditText
      document.getElementById('picker').style.display = 'none'

      let nonogram = new Nonogram(rowHints, colHints)
      let root = document.getElementById('puzzle')
      let clickBlocked = false
      nonogram.renderInitial(root, async (y, x, primary) => {
        if (clickBlocked) {
          return
        }
        if (nonogram.row(y).get(x) !== CellState.Unknown) {
          return
        }

        clickBlocked = true
        nonogram.row(y).set(x, primary ? CellState.Filled : CellState.Empty)
        await makeProgress(nonogram, root)
        clickBlocked = false
      })

      clickBlocked = true
      await makeProgress(nonogram, root)
      clickBlocked = false
    })
  }

}

init()
