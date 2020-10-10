import {CellState} from './nonogram.js'
import {assert, countWhere, reverse, sum, takeAfter} from './utils.js'

async function stepIfModified(row, step) {
  if (row.consumeModifiedFlag()) {
    await step()
  }
}

function blockCanStart(rowState, start, blockSize) {
  // returns true if none of the `blockSize` cells starting at `start`
  // are known to be empty.
  return takeAfter(rowState, start, blockSize).every(c => c != CellState.Empty)
}

function skipBlock(rowState, start, blockSize) {
  // returns the earliest coordinate that a block of size `blockSize`
  // (plus the empty cell after it) might end if it must be placed
  // at or after coordinate `start`.

  // if there is some cell among `start, start + 1, start + 2,
  // ..., start + blockSize - 1` that is known to be empty, the block cannot
  // start at `start`
  while (!blockCanStart(rowState, start, blockSize)) {
    start++
  }
  // place block here and skip the one empty cell after it.
  return start + blockSize + 1
}

function rowPlaceHint(row, index) {
  // first, narrow down the segment where this block might be found
  // by stuffing the other hints to the sides greedily.
  let hints = row.hints()
  let blockSize = hints[index]

  let rowState = row.snapshot()
  let leftSkip = 0
  for (let i = 0; i <= index; i++) {
    leftSkip = skipBlock(rowState, leftSkip, hints[i])
  }
  // last iteration skipped over the current block too
  // (we still run it because we want it to skip over any segments
  // that are too short to fit the block)
  leftSkip -= blockSize + 1

  let rowStateM = reverse(rowState)
  let rightSkip = 0
  for (let i = row.hints().length - 1; i >= index; i--) {
    rightSkip = skipBlock(rowStateM, rightSkip, hints[i])
  }
  rightSkip -= blockSize + 1

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

  // additionally, if we're dealing with the first block,
  // anything to the left of it is empty.
  if (index === 0) {
    for (let i = 0; i < left; i++) {
      row.set(i, CellState.Empty)
    }
  }

  // and similarly for last block.
  if (index === row.hints().length) {
    for (let i = right + 1; i < row.length(); i++) {
      row.set(i, CellState.Empty)
    }
  }
}

function rowDelimitCompleteBlocks(row) {
  // if we find a contiguous block that's as long as the biggest hint,
  // it must be surrounded by empties.
  let maxBlockSize = Math.max(...row.hints())
  let rowState = row.snapshot()
  for (let i = 0; i < row.length() - maxBlockSize + 1; i++) {
    if (takeAfter(rowState, i, maxBlockSize).every(c => c == CellState.Filled)) {
      if (i > 0) {
        assert(row.get(i - 1) != CellState.Filled)
        row.set(i - 1, CellState.Empty)
      }
      if (i + maxBlockSize < row.length()) {
        assert(row.get(i + maxBlockSize) != CellState.Filled)
        row.set(i + maxBlockSize, CellState.Empty)
      }
    }
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

  rowDelimitCompleteBlocks(row)
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
