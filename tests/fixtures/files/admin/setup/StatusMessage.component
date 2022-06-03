<script>
  // Icons courtesy of Bootstrap icons (https://icons.getbootstrap.com/)
  import ServiceState from './ServiceState.js'

  import { Lines } from '@small-tech/spinners'

  export let state = new ServiceState()
</script>

<div class='statusMessage'>
  {#if $state.is(state.UNKNOWN)}
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="unknown" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247zm2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z"></path>
    </svg>
  {/if}

  {#if $state.is(state.PROCESSING)}
    <Lines />
  {/if}

  {#if $state.is(state.OK)}
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="ok" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg>
  {/if}

  {#if $state.is(state.NOT_OK)}
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="notOk" viewBox="0 -1 16 17">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
    </svg>
  {/if}

  <span id='message'><slot></slot></span>
</div>

<style>
  .unknown { color: gray; }
  .ok { color: green; }
  .notOk { color: red; }

  /* Align icon to text */
  .statusMessage {
    display: inline-flex;
    align-items:center;
  }

  #message {
    display: block;
    margin-left: 0.25em;
  }
</style>
