// Converts a route in the form of, e.g.,
// '/some_thing/with/underscores-and-hyphens' to
// SomeThingWithUnderscoresAndHyphensPage
export function classNameFromRoute (route) {
  const className = route
    .split('/').join('*')
    .split('-').join('*')
    .split('_').join('*')
    .split('*')
    .map(fragment => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join('')
    + 'Page'

  return className === 'Page' ? 'IndexPage' : className
}
