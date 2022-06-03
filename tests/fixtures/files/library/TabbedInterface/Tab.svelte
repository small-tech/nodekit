<script>
  import { onMount, getContext } from 'svelte'

  export let navStyle = false

  let tab
  let link
  let isActiveTab

  // Set initial roles (as rendered server-side) to empty strings,
  // which are inapplicable according to:
  // https://act-rules.github.io/rules/674b10#inapplicable-example-3
  let tabRole = ''
  let linkRole = undefined

  // Get the current tab index. We will be have the next one.
  const lastTabIndex = getContext('lastTabIndex')

  // Get the initial active tab index.
  const activeTabIndex = getContext('activeTabIndex')

  // Get the focused panel index.
  const focusedTabPanelIndex = getContext('focusedTabPanelIndex')

  // Set our own tab index and ensure the id
  // is calculated and rendered on the server so
  // regular links work by default even if not
  // progressively-enhanced.
  let index = ++$lastTabIndex
  let id = `tab${index}`

  let isMounted = false
  onMount(() => {
    // Progressively-enhance the roles.
    tabRole = 'presentation'
    linkRole = 'tab'
    isMounted = true
  })

  let i = 0

  // Reactively set whether we’re the active tab or not.
  $: isActiveTab = index === $activeTabIndex

  $: if (isMounted && isActiveTab) {
    if (i === 0 && index === 0) {
      i++
      window.scrollTo(0,0)
      document.activeElement.blur()
    } else {
      link.focus()
    }
  }

  function tabClick (event) {
    if (index !== $activeTabIndex) {
      $activeTabIndex = index
    }
  }

  function keyHandler(event) {
    let direction =
      /* left?  */ event.which === 37 && index !== 0 ? index - 1 :
      /* right? */ event.which === 39 && index !== $lastTabIndex ? index + 1 :
      /* down?  */ event.which === 40 ? 'down' : null
    if (direction !== null) {
      event.preventDefault()
      // If the down key is pressed, move focus to the open panel,
      // otherwise switch to the adjacent tab.
      if (direction === 'down') {
        // Unset and set the tab panel index (in case it was
        // the previously-focused panel also). TODO: this is rather
        // hacky. Instead, we should separate the active tab and
        // focused element concepts and manage them separately.
        $focusedTabPanelIndex = -1
        $focusedTabPanelIndex = index
      } else {
        // Navigate to an adjacent tab.
        $activeTabIndex = direction
      }
    }
  }
</script>

<li bind:this={tab} role={tabRole}>
  <a
    {id}
    href={`#section${index}`}
    tabindex={isActiveTab ? undefined : -1}
    aria-selected={isActiveTab || undefined}
    role={linkRole}
    class:navStyle
    bind:this={link}
    on:keydown={keyHandler}
    on:click|preventDefault={tabClick}
  >
    <slot></slot>
  </a>
</li>

<style>
  * {
    color: inherit;
    margin: 0;
  }

  a.navStyle:focus {
    outline: none;
    box-shadow: 0 6px 0 0 lightBlue;
  }

  a:focus {
    outline: none;
    box-shadow: 0 0 0 4px lightBlue;
  }

  *:global([aria-selected]) {
    /* border: 2px solid; */
    background: #ddd;
    border-radius: 2em;
    /* border-bottom: 0; */
    /* border-bottom: 2px solid black; */
    position: relative;
    /* top: 2px; */
  }

  *:global([aria-selected].navStyle) {
    /* border: 2px solid; */
    background:none;
    border-radius: 0;
    /* border-bottom: 0; */
    border-bottom: 2px solid black;
    position: relative;
    font-weight: 600;
    /* top: 2px; */
  }


  @media (max-width: 550px) {
    *:global([aria-selected]) {
      position: static;
      font-weight: bold;
    }
  }
</style>
