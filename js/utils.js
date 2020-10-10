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
