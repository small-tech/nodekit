<script>
  import { getContext, onMount } from 'svelte'
  const lastTabPanelIndex = getContext('lastTabPanelIndex')
  const activeTabIndex = getContext('activeTabIndex')
  const focusedTabPanelIndex = getContext('focusedTabPanelIndex')

  let section

  // The id is rendered on the server.
  let index = ++$lastTabPanelIndex
  let id = `section${index}`
  let role = undefined

  // We keep track of the mounted state so that the full
  // DOM is rendered on the server-side and progressively-enhanced
  // only if JavaScript is available on the client.
  let mounted = false

  onMount(() => {
    mounted = true
    role = 'tabpanel'
  })

  $: if ($focusedTabPanelIndex === index) {
    section.focus()
    console.log('focus is on tab panel', index)
  }
</script>

<section
  {id}
  {role}
  hidden={mounted && ($activeTabIndex !== index)}
  tabindex={mounted ? -1 : undefined}
  aria-labelledby={mounted ? `tab${index}` : undefined}
  bind:this={section}>
  <slot active={$activeTabIndex === index}></slot>
</section>

<style>
  *:global([role="tabpanel"]) {
    /* border: 2px solid;      */
    /* padding: 1.5rem; */
  }

  *:global([role="tabpanel"] > *) {
    margin-top: 0.75rem;
  }

  @media (max-width: 550px) {
    *:global([role="tabpanel"]) {
      border-top: 0;
    }
  }
</style>
