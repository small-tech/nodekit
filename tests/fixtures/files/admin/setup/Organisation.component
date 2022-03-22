<script>
  import ServiceState from './ServiceState.js'

  export let settings
  export const state = new ServiceState()

  $: switch(settings) {
    case undefined:
      state.set(state.UNKNOWN)
    break

    default:
      state.set(
        settings.org.name !== ''
        && settings.org.address !== ''
        && settings.org.site !== ''
        && settings.org.email !== ''
        ? state.OK : state.NOT_OK
      )
  }
</script>

{#if settings}
  <h3 id='organisation'>Organisation settings</h3>
  <p>These details are used to populate the legal matter in the privacy policy and terms and conditions, etc. See Site.</p>

  <label for='orgName'>Name</label>
  <input name='orgName' type='text' bind:value={settings.org.name}/>

  <label for='orgName'>Official Address</label>
  <input name='orgName' type='text' bind:value={settings.org.address}/>

  <label for='orgSite'>Web site</label>
  <input name='orgSite' type='text' bind:value={settings.org.site}/>

  <label for='orgEmail'>Support email</label>
  <input name='orgEmail' type='text' bind:value={settings.org.email}/>
{/if}
