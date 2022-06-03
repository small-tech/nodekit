<script>
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'

  // export let selectedIndex = 0

  const lastTabIndex = writable(-1)
  const lastTabPanelIndex = writable(-1)
  const activeTabIndex = writable(0 /* selectedIndex */)
  const focusedTabPanelIndex = writable(-1)

  setContext('lastTabIndex', lastTabIndex)
  setContext('lastTabPanelIndex', lastTabPanelIndex)
  setContext('activeTabIndex', activeTabIndex)
  setContext('focusedTabPanelIndex', focusedTabPanelIndex)

  export let navStyle = false
</script>

<div class='tabbed' class:navStyle>
  <slot></slot>
</div>

<style>
  * {
    color: inherit;
    margin: 0;
  }
</style>
