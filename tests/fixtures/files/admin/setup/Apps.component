<script>
  import ServiceState from './ServiceState.js'

  export let settings
  export const state = new ServiceState()

  $: switch(settings) {
    case undefined:
      state.set(state.UNKNOWN)
    break

    default:
      state.set(settings.apps.length > 0 ? state.OK : state.NOT_OK)
  }

  let app = 0
</script>

{#if settings}
  <h3>App Settings</h3>

  <label for='app'>App</label>
  <select id='app' bind:value={app} size={settings.apps.length} class='openSelectBox'>
    {#each settings.apps as app, index}
      <option value={index}>{app.name}</option>
    {/each}
  </select>

  <label for='appName'>Name</label>
  <input
    id='appName'
    name='appName'
    type='text'
    bind:value={settings.apps[app].name}
  />

  <label for='appDescription'>Description</label>
  <textarea id='appDescription' name='appDescription' bind:value={settings.apps[app].description} />

  <label for='appLogo'>Logo (SVG)</label>

  <div>
    <div class='appLogo'>{@html settings.apps[app].logo}</div>
    <div class='appLogo'>{@html settings.apps[app].logo}</div>
    <div class='appLogo'>{@html settings.apps[app].logo}</div>
    <div class='appLogo'>{@html settings.apps[app].logo}</div>
    <div class='appLogo'>{@html settings.apps[app].logo}</div>
  </div>

  <textarea id='appLogo' name='appLogo' bind:value={settings.apps[app].logo} />

  <label for='appCloudInit'>Cloud Init</label>
  <p>Please only change the Cloud Init configuration if you know what you’re doing.</p>
  <textarea id='appCloudInit' name='appCloudInit' bind:value={settings.apps[app].cloudInit} />
{/if}

<style>
  *:global(.appLogo) {
    display: inline-block;
  }

  *:global(.appLogo svg) {
    border: 1px solid black;
    padding: 1em;
    width: 3em;
    height: 3em;
    vertical-align: middle;
  }

  /* Show the logo in various colours and also inverted
     to underscore its nature. */

  *:global(.appLogo:nth-of-type(2) svg) {
    color: white;
    background-color: black;
  }

  /* Colours courtesy of: https://cssgradient.io/ */

  *:global(.appLogo:nth-of-type(3) svg) {
    color: #FF033E; /* American rose. */
  }

  *:global(.appLogo:nth-of-type(4) svg) {
    color: #006A4E; /* Bottle green. */
  }

  *:global(.appLogo:nth-of-type(5) svg) {
    color: #6CB4EE; /* Argentine blue. */
  }

  #appLogo, #appCloudInit {
    min-height: 420px;
  }

  #appDescription {
    min-height: 100px;
  }
</style>
