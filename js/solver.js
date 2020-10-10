import {CellState} from './nonogram.js'
import {arraysEqual, assert, countWhere, sum, takeAfter} from './utils.js'

async function stepIfModified(row, step) {
  if (row.consumeModifiedFlag()) {
    await step()
  }
}

function blockCanStart(rowState, start, blockSize) {
  // returns true if none of the `blockSize` cells starting at `start`
  // are known to be empty.
  return takeAfter(rowState, start, blockSize).every(c => c !== CellState.Empty)
}

function earliestStart(rowState, start, blockSize) {
  // returns the earliest coordinate that a block of size `blockSize`
  // (plus the empty cell after it) might begin if it must be placed
  // at or after coordinate `start`.

  // if there is some cell among `start, start + 1, start + 2,
  // ..., start + blockSize - 1` that is known to be empty, the block cannot
  // start at `start`
  while (!blockCanStart(rowState, start, blockSize)) {
    start++
  }
  return start
}

function rowPlaceHint(row, index) {
  // first, narrow down the segment where this block might be found
  // by stuffing the other hints to the sides greedily.
  let hints = row.hints()
  let blockSize = hints[index]

  let rowState = row.snapshot()
  let leftSkip = 0
  for (let i = 0; i < index; i++) {
    leftSkip = earliestStart(rowState, leftSkip, hints[i])
    leftSkip += hints[i] + 1
  }
  leftSkip = earliestStart(rowState, leftSkip, blockSize)

  let rowStateM = row.mirror().snapshot()
  let rightSkip = 0
  for (let i = row.hints().length - 1; i > index; i--) {
    rightSkip = earliestStart(rowStateM, rightSkip, hints[i])
    rightSkip += hints[i] + 1
  }
  rightSkip = earliestStart(rowStateM, rightSkip, blockSize)

  assert(leftSkip + blockSize + rightSkip <= row.length())

  let left = leftSkip
  let right = row.length() - 1 - rightSkip
  // the block must be entirely somewhere between `left` and `right`.
  if (right - left + 1 === blockSize) {
    // exact fit, let's fill it in and put empties around it too.
    for (let i = left; i <= right; i++) {
      row.set(i, CellState.Filled)
    }
    if (left > 0) {
      row.set(left - 1, CellState.Empty)
    }
    if (right < row.length() - 1) {
      row.set(right + 1, CellState.Empty)
    }
  } else if (right - left + 1 < 2 * blockSize) {
    // it is not an exact fit, but there are less than `2 * blockSize`
    // cells available, meaning that no matter how the block is placed,
    // some of the middle cells are guaranteed to be filled.
    let slack = (right - left + 1) - blockSize
    for (let i = left + slack; i <= right - slack; i++) {
      row.set(i, CellState.Filled)
    }
  }
}

function rowPlaceFirstBlock(row) {
  assert(row.hints().length > 0)

  let blockSize = row.hints()[0]

  // first, let's mark as empty all contiguous unknown blocks
  // at the beginning that are too small to be the first block.
  // e.g., if blockSize is 4,
  //       .-..-.... -> -----....
  let start = earliestStart(row.snapshot(), 0, blockSize)
  for (let i = 0; i < start; i++) {
    row.set(i, CellState.Empty)
  }

  // now we know the first block cannot start to the left of
  // `start`.
  // maybe we can place the first block uniquely now?
  // dealing with this here simplifies some cases below.
  if (start + blockSize === row.length()) {
    for (let i = start; i < start + blockSize; i++) {
      row.set(i, CellState.Filled)
    }
    return
  }

  // if there are any cells that are already filled
  // among `start, start + 1, ..., start + blockSize`
  // (notice that that's `(blockSize + 1)` cells in total!),
  // those must all belong to the first block (if they belong
  // to the second, the first has nowhere to go), so we can
  // connect them all and maybe get additional constraints.
  if (!takeAfter(row.snapshot(), start, blockSize + 1).some(c => c === CellState.Filled)) {
    return
  }
  let leftmostFilled = start
  while (row.get(leftmostFilled) !== CellState.Filled) {
    leftmostFilled++
  }

  // if `leftmostFilled` is filled, then everything
  // from there to `start + blockSize - 1` must be filled
  // (because there aren't enough empty cells to the left
  // of `leftmostFilled` to add up to `blockSize`).
  // e.g. if blockSize is 5,
  //      .x.x... -> .xxxx..
  for (let i = leftmostFilled + 1; i < start + blockSize; i++)
  {
    row.set(i, CellState.Filled)
  }

  // if there are more filled cells after `start + blockSize - 1`,
  // those must also be part of the first block since they connect
  // to the ones we just found. this allows us to mark
  // some of `start, start + 1, ...` as empty.
  // e.g. ..xxx.. -> -.xxx..
  //         ^ rightmostFilled
  let rightmostFilled = start + blockSize - 1
  while (
    (rightmostFilled < row.length() - 1)
    && (row.get(rightmostFilled + 1) === CellState.Filled)
  ) {
    row.set(start, CellState.Empty)
    start++
    rightmostFilled++
  }

  if (rightmostFilled - leftmostFilled + 1 === blockSize) {
    // we have managed to locate the whole block, so we can put
    // an empty to the right of it.
    if (rightmostFilled < row.length() - 1) {
      row.set(rightmostFilled + 1, CellState.Empty)
    }
  }
}

function rowMatchBlocksToHints(row) {
  // for each contiguous block of filled cells, try to figure out
  // which hints it might correspond to.
  let hints = row.hints() // cached
  let left = 0
  while (left < row.length()) {
    if (row.get(left) !== CellState.Filled) {
      left++
      continue
    }

    let right = left
    while ((right < row.length() - 1) && (row.get(right + 1) === CellState.Filled)) {
      right++
    }

    // `left..right` is a contiguous block of filled cells.
    let possibleHints = []
    for (let i = 0; i < hints.length; i++) {
      let hint = hints[i]
      if (hint < right - left + 1) {
        // hint is too small
        continue
      }
      // TODO: stronger checks here
      possibleHints.push(i)
    }

    assert(possibleHints.length > 0)

    if (arraysEqual(possibleHints, [0])) {
      // if this must be the first block, everything to the left is empty
      for (let i = 0; i < right - hints[0] + 1; i++) {
        row.set(i, CellState.Empty)
      }
    }

    if (arraysEqual(possibleHints, [hints.length - 1])) {
      // if this must be the last block, everything to the right is empty
      for (let i = left + hints[hints.length - 1]; i < row.length(); i++) {
        row.set(i, CellState.Empty)
      }
    }

    if (possibleHints.every(i => hints[i] === right - left + 1)) {
      // every hint says this block is complete, so we can put empties
      // around it
      if (left > 0) {
        row.set(left - 1, CellState.Empty)
      }
      if (right < row.length() - 1) {
        row.set(right + 1, CellState.Empty)
      }
    }

    left = right + 1
  }
}

function rowComplete(row) {
  // if all of the hints in this block are complete,
  // all unknown cells must be empty.
  let cellsFilled = countWhere(c => c === CellState.Filled, row.snapshot())
  let cellsToBeFilled = sum(row.hints())
  assert(cellsFilled <= cellsToBeFilled)

  if (cellsFilled === cellsToBeFilled) {
    for (let i = 0; i < row.length(); i++) {
      if (row.get(i) === CellState.Unknown) {
        row.set(i, CellState.Empty)
      }
    }
  }
}

async function solveRow(row, step) {
  if (row.hints().length === 0) {
    for (let i = 0; i < row.length(); i++) {
      row.set(i, CellState.Empty)
    }
    await stepIfModified(row, step)
    return
  }

  for (let i = 0; i < row.hints().length; i++) {
    rowPlaceHint(row, i)
    await stepIfModified(row, step)
  }

  rowPlaceFirstBlock(row)
  await stepIfModified(row, step)

  rowPlaceFirstBlock(row.mirror())
  await stepIfModified(row, step)

  rowMatchBlocksToHints(row)
  await stepIfModified(row, step)

  rowComplete(row)
  await stepIfModified(row, step)
}

export async function solve(nonogram, step) {
  let progress = true
  while (progress) {
    progress = false
    let stepAndUpdate = async () => {
      progress = true
      await step()
    }

    for (let i = 0; i < nonogram.rows; i++) {
      await solveRow(nonogram.row(i), stepAndUpdate)
    }

    for (let i = 0; i < nonogram.cols; i++) {
      await solveRow(nonogram.col(i), stepAndUpdate)
    }
  }
  console.log('done solving')
}
