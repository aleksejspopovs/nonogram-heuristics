export function assert(expr, msg='') {
  if (!expr) {
    throw new Error(`assertion failed (${msg})`)
  }
}

export function* enumerate(iterator, start=0) {
  let i = start
  for (let item of iterator) {
    yield [i++, item]
  }
}

export function makeChild(parent, tagName, classes=[]) {
  let child = document.createElement(tagName)
  parent.appendChild(child)
  child.classList.add(...classes)
  return child
}

export function reverse(lst) {
  let result = []
  for (let i = lst.length - 1; i >= 0; i--) {
    result.push(lst[i])
  }
  return result
}

export function takeAfter(lst, skip, count) {
  assert(skip + count <= lst.length)

  let result = []
  for (let i = skip; i < skip + count; i++) {
    result.push(lst[i])
  }
  return result
}

export function sum(lst) {
  return lst.reduce((x, y) => x + y, 0)
}

export function countWhere(filter, lst) {
  return sum(lst.map(x => filter(x) ? 1 : 0))
}

export function arraysEqual(lst1, lst2) {
  if (lst1.length !== lst2.length) {
    return false
  }
  return lst1.every((value, idx) => value === lst2[idx])
}
