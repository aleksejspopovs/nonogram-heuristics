import {CellState, Nonogram} from './nonogram.js'
import {solveSingleRowForTestingOnly} from './solver.js'
import {arraysEqual, assert, makeChild} from './utils.js'

const TestCases = [
  [[], '...', '---'],
  [[3], '...', 'xxx'],
  [[2], '...', '.x.'],
  [[2, 1], '....', 'xx-x'],
  [[4], '.x....', '.xxx.-'],
  [[4], '..x...', '..xx..'],
  [[4], '.-..-..x.x..', '------.xxx.-'],
  [[5], '.x.x..', '.xxxx.'],
  [[4], '..xxx.', '-.xxx.'],
  [[1, 4], '........', '....xx..'],
  [[2, 2], '..xx..xx..', '--xx--xx--'],
  [[3], '..-x...', '---xxx-'],

  [[2, 2], '.x....x.', '.x.--.x.'],
]

function parseRow(hints, partialString) {
  partialString = Array.from(partialString)

  assert(
    partialString.every((val, idx) => (
      (val === 'x') || (val === '-') || (val === '.')
    )),
  )

  // these aren't technically the right hints,
  // but we ignore that since we're only testing row
  // solving for now.
  let colHints = partialString.map(() => [])
  let nonogram = new Nonogram([hints], colHints)
  let row = nonogram.row(0)
  for (let i = 0; i < partialString.length; i++) {
    if (partialString[i] == 'x') {
      row.set(i, CellState.Filled)
    }
    if (partialString[i] == '-') {
      row.set(i, CellState.Empty)
    }
  }

  return nonogram
}

function equalStates(output, expected) {
  if (output.rows != expected.rows) {
    return false
  }

  return output.state.every((row, idx) => arraysEqual(row, expected.state[idx]))
}

async function runTestCase(testCase) {
  let [hints, inputRow, expectedRow] = testCase

  let input = parseRow(hints, inputRow)
  let output = parseRow(hints, inputRow)
  let expected = parseRow(hints, expectedRow)

  try {
    await solveSingleRowForTestingOnly(output.row(0), () => {})
  } catch (error) {
    return {
      passed: false,
      error: true,
      errorDetails: error,
      input,
      expected,
    }
  }

  if (equalStates(output, expected)) {
    return {
      passed: true,
      input,
      output,
      expected,
    }
  } else {
    return {
      passed: false,
      error: false,
      input,
      output,
      expected,
    }
  }
}

function reportResult(root, result) {
  let node = makeChild(root, 'tr')

  result.input.render(makeChild(node, 'td'))
  result.expected.render(makeChild(node, 'td'))

  let resultTd = makeChild(node, 'td')

  if (!result.passed && result.error) {
    resultTd.innerText = result.errorDetails
  } else {
    result.output.render(resultTd)
  }
}

async function init() {
  let passedCases = 0
  let failedCases = 0
  let fails = document.getElementById('failed-tests').querySelector('tbody')
  let passes = document.getElementById('passed-tests').querySelector('tbody')

  for (let testCase of TestCases) {
    let result = await runTestCase(testCase)
    if (result.passed) {
      passedCases++
    } else {
      failedCases++
    }
    reportResult(result.passed ? passes : fails, result)
  }

  document.getElementById('failed-count').innerText = failedCases
  document.getElementById('passed-count').innerText = passedCases
}

init()
