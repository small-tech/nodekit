<script>
  import { onMount } from 'svelte'
  import { scale } from 'svelte/transition'

  export let show = false
  export let hasCloseButton = true
  export let hasActionButton = false
  export let title = 'Modal'
  export let url

  let showing = false
  let mounted = false

  let MicroModal

  function visitPlaceHandler() {
    window.open(url, '_blank')
  }

  onMount(async () => {
    MicroModal = (await import('micromodal')).default
    MicroModal.init()
    mounted = true
  })

  $: if (mounted) {
    if (show && !showing) {
      MicroModal.show('modal', {
        onShow: modal => console.log(`${modal.id} is showing`),
        onClose: modal => console.log(`${modal.id} is hidden`),
        awaitOpenAnimation: true,
        awaitCloseAnimation: true,
      })
      showing = true
    } else if (!show && showing) {
      MicroModal.close('modal')
      showing = false
    }
  }
</script>

<div class="modal micromodal-slide" id="modal" aria-hidden=true>
  <div class="modal__overlay" tabindex="-1" data-micromodal-close={hasCloseButton ? true : null}>
    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal__header">
        <h2 class="modal__title" id="modal-title">
          {@html title}
        </h2>
        <!--
        {#if hasCloseButton}
          <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
        {/if}
        -->
      </header>
      <main class="modal__content" id="modal-content">
        <slot />
      </main>
      {#if hasCloseButton || hasActionButton}
      <footer class="modal__footer" in:scale={{duration: 600}}>
        {#if hasActionButton}
          <button class="modal__btn modal__btn-primary" on:click={visitPlaceHandler}>Visit your place</button>
        {/if}
        {#if hasCloseButton}
          <button class="modal__btn" data-micromodal-close aria-label="Close this dialog window">Close</button>
        {/if}
      </footer>
      {/if}
    </div>
  </div>
</div>

<style>
  /* https://gist.github.com/ghosh/4f94cf497d7090359a5c9f81caf60699 */
  .modal__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

  .modal__container {
    background-color: #fff;
    padding: 30px;
    max-width: 600px;
    max-height: 100vh;
    border-radius: 1em;
    overflow-y: auto;
    box-sizing: border-box;
    box-shadow: rgba(0,0,0,0.5) 1em 1em 1em;
  }

  .modal__header {
    /* display: flex; */
    /* justify-content: space-between; */
    /* align-items: center; */
  }

  .modal__footer {
    text-align: center;
  }

  .modal__title {
    margin-top: 0;
    margin-bottom: 0;
    font-weight: 500;
    font-size: 2.5rem;
    line-height: 1.25;
    /* color: #00449e; */
    box-sizing: border-box;
    text-align: center;
  }

  .modal__close {
    background: transparent;
    border: 0;
  }

  .modal__header .modal__close:before { content: "\2715"; }

  .modal__content {
    margin-top: 2rem;
    margin-bottom: 2rem;
    line-height: 1.5;
    color: rgba(0,0,0,.8);
  }

  .modal__btn {
    font-size: 1.25rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: .5rem;
    padding-bottom: .5rem;
    background-color: #e6e6e6;
    color: rgba(0,0,0,.8);
    border-radius: .25rem;
    border-style: none;
    border-width: 0;
    cursor: pointer;
    -webkit-appearance: button;
    text-transform: none;
    overflow: visible;
    line-height: 1.15;
    margin: 0;
    will-change: transform;
    -moz-osx-font-smoothing: grayscale;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    transition: -webkit-transform .25s ease-out;
    transition: transform .25s ease-out;
    transition: transform .25s ease-out,-webkit-transform .25s ease-out;
  }

  .modal__btn:not(:last-of-type) {
    margin-right: 0.25em;
  }

  .modal__btn:focus, .modal__btn:hover {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }

  .modal__btn-primary {
    background-color: #008000;
    color: #fff;
  }

  /* Animation */

  @keyframes mmfadeIn {
      from { opacity: 0; }
        to { opacity: 1; }
  }

  @keyframes mmfadeOut {
      from { opacity: 1; }
        to { opacity: 0; }
  }

  @keyframes mmslideIn {
    from { transform: translateY(15%); }
      to { transform: translateY(0); }
  }

  @keyframes mmslideOut {
      from { transform: translateY(0); }
      to { transform: translateY(-10%); }
  }

  :global(.micromodal-slide) {
    display: none;
  }

  :global(.micromodal-slide.is-open) {
    display: block;
  }

  :global(.micromodal-slide[aria-hidden="false"] .modal__overlay) {
    animation: mmfadeIn .3s cubic-bezier(0.0, 0.0, 0.2, 1);
  }

  :global(.micromodal-slide[aria-hidden="false"] .modal__container) {
    animation: mmslideIn .3s cubic-bezier(0, 0, .2, 1);
  }

  :global(.micromodal-slide[aria-hidden="true"] .modal__overlay) {
    animation: mmfadeOut .3s cubic-bezier(0.0, 0.0, 0.2, 1);
  }

  :global(.micromodal-slide[aria-hidden="true"] .modal__container) {
    animation: mmslideOut .3s cubic-bezier(0, 0, .2, 1);
  }

  :global(.micromodal-slide .modal__container,
  .micromodal-slide .modal__overlay) {
    will-change: transform;
  }
</style>