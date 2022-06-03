<script>
  import { onMount } from 'svelte'

  export let navStyle = false

  let tabList
  let role = undefined

  onMount(() => {
    // We are setting the ARIA role dynamically, here, instead of
    // statically in the DOM as the component is progressively-enhanced.
    role = 'tablist'
  })
</script>

<ul {role} bind:this={tabList} class:navStyle>
  <slot></slot>
  <div id='force'></div>
</ul>

<style>
  ul {
    background-color: #eee;
    border-radius: 1em;
    margin-left: -1em;
    padding-left: 1em;
    margin-right: -1em;
    padding-right: 1em;
  }

  ul.navStyle {
    background-color: #fff;
    margin: inherit;
    padding: inherit;
  }

  * {
    color: inherit;
    margin: 0;
  }

  *:global([role="tablist"]) {
    padding: 0;
  }

  *:global([role="tablist"] li), :global([role="tablist"] a) {
    display: inline-block;
  }

  *:global([role="tablist"] a) {
    text-decoration: none;
    padding: 0.5rem 1em;
  }

  @media (max-width: 550px) {
    *:global([role="tablist"] li), :global([role="tablist"] a) {
      display: block;
      position: static;
    }

    *:global([role="tablist"] a) {
      /* border: 2px solid #222 !important; */
    }

    *:global([role="tablist"] li + li a) {
      border-top: 0 !important;
    }
  }
</style>
