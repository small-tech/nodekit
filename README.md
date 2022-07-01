# ![NodeKit logo](./nodekit-logo.svg) NodeKit

> ## 💀 __Warning:__ NodeKit is in a very early state. It is not feature-complete.
> 
> Sections marked with ⚠️ represent features that are not working yet in the main branch. See the [prototype](https://github.com/small-tech/nodekit/tree/prototype) branch a preview of the functionality that is slowly being implemented in a maintainable manner here in the main branch.
>
> Please feel free to have a play but proceed at your own risk. ___Here be dragons, etc.___

## A [Small Web](https://small-tech.org/research-and-development) server.

NodeKit is a [small web](https://small-tech.org/research-and-development/) server for people, not corporations.

It has a modern integrated application framework that makes web development _even easier_ than it was in the early days. (Our goal is not to go backwards to some mythical time in the past when things were good but to go forward differently.)

NodeKit offers build-free web development with a modern stack built on top of [Node.js](https://nodejs.org/en/), [experimental ESM loaders](https://nodejs.org/docs/latest-v16.x/api/esm.html#loaders), [NodeScript](#nodescript) (a superset of [Svelte](https://svelte.dev)), and [esbuild](https://esbuild.github.io/).

And you can use it in production to host your small web sites.

_Because creating a modern web site should be simple if your aim isn’t to do nasty things to people._

## System requirements

  - Node 18+ LTS.
  - Linux

### For production servers:

  - systemd

## Install

  1. Clone this repository

      ```shell
      git clone https://github.com/small-tech/nodekit.git
      ```

  2. Switch to the NodeKit directory.

      ```shell
      cd nodekit
      ```

  3. ⚠️ Install.

      ```shell
      ./install
      ```

## Getting started

⚠️ You can run NodeKit using the following syntax:

```shell
nodekit [path to serve]
```

During development, you can also run NodeKit from the source folder like this:

```shell
bin/nodekit [path to serve]
```

> ⚠️ __2022-06-03:__ Currently, you must start NodeKit in production mode using the development syntax:
> 
> ```shell
> PRODUCTION=true bin/nodekit [path to serve]
> ```
> 
> (Development mode has not yet been implemented in the main branch and the build script has not been updated yet either.
> 
> If you want to play around with development mode, please `checkout` and play with the [prototype branch](https://github.com/small-tech/nodekit/tree/prototype).

## Production

In production mode, ⚠️ NodeKit runs as a systemd service.

You can start NodeKit in production mode by setting the `PRODUCTION` environment variable to a non-empty value. e.g.,

```shell
PRODUCTION=true bin/nodekit examples/simple-chat/
```

> 💡 By default, NodeKit will be as quiet as possible in the console and only surface warnings and errors.
>
> If you want more extensive logging, you can start it with the VERBOSE environment variable set:
>
> `VERBOSE=true nodekit [path to serve]`
>
> or
>
> `VERBOSE=true bin/nodekit [path to serve]`
>
> Similarly, if you want to see performance statistics, set `PROFILE=true`.

## Examples

The best way to get started is to play with the examples.

  - Hello Count: _examples/hello-count_
  - Persisted Hello Count: _examples/persisted-hello-count_
  - Simple Chat: _examples/simple-chat_
  - Make Fetch Happen: _examples/make-fetch-happen_
  - Streaming Fediverse Posts: _examples/streaming-fediverse-posts_
  - Non-SSR Svelte Compiled Component Workaround (Particles): _examples/non-ssr-svelte-compiled-component-workaround-particles_
  
e.g., to launch the Simple Chat example, run:

```shell
nodekit examples/simple-chat
```

💡️ Remember to run `npm install` on any examples that have a _package.json_ file in them.

⚠️ The `examples/non-ssr-svelte-source-component-boring-avatars` example is currently broken.


## Tutorials

⚠️ __2022-06-03:__ For the time being, either substitute `PRODUCTION=true bin/nodekit` for `nodekit` in the tutorials or use the [prototype branch](https://github.com/small-tech/nodekit/tree/prototype) to see behaviour that matches what is described below.

### Hello, world!

Let’s quickly create and test your first “Hello, world!” NodeKit site.

Create a file called _index.page_ and add the following content to it:

```html
<h1>Hello, world!</h1>
```

Now run `nodekit`, hit _https://localhost_, and you should see your new site.

Yes, NodeKit will happily serve any HTML you throw at it just like any other good web server should. The only catch is you need to put it into a `.page` file.

> If you have static assets you want to serve, put them in a special folder called _#static_. In fact, we _could_ have put our HTML into _#static/index.html_ and the outcome would have been identical.

But you can render HTML using any web server…

Let’s do something that no other web server can do now, shall we?

### Counting hellos.

Change your _index.page_ to read:

```html
<data>
  let count = 1

  export default () => {
    return {count: count++}
  }
</data>

<script>
  export let data
</script>

<h1>Hello, world!</h1>

<p>I’ve greeted you {data.count} times.</p>
```

Now run `nodekit` and refresh the page to see the counter increase.

✨ Ooh, magic! ✨

> #### How does it work?
>
> A page in NodeKit is written in [NodeScript](#nodescript), which is a superset of [Svelte](https://svelte.dev).
>
> In addition to what Svelte can do, NodeScript gives you the ability to add server-side code to your pages in a `<data>` block.
>
> The default function you export from it is evaluated every time the route is requested and anything it returns is injected into the `data` variable you exported from your `<script>` block.
>
> The rest of the example is simply client-side Svelte.
>
> ___If you haven’t done so already, now would be a good time to work through the entire [Svelte Tutorial](https://svelte.dev/tutorial/basics). It’s rather excellent. Go ahead, I’ll wait…___

### Persistence is the secret to success (or something)

So counting stuff is great but what happens if you restart the server?

Your count is lost! (This is a tragedy.)

So let’s fix that.

(Brace yourself, you’re about to use – _drumroll_ – a SCARY database! _Oooh!_)

> ## 👻 Scared yet?

Update your code to match this:

```html
<data>
  if (db.greetings === undefined) {
    db.greetings = { count: 1 }
  }

  export default () => {
    return {count: db.greetings.count++}
  }
</data>

<script>
  export let data
</script>

<h1>Hello, world!</h1>

<p>I’ve greeted you {data.count} times.</p>
```

Now load the page, refresh, stop the server, restart it, and load the page…

__Wait, what?__

__That’s _it?___

__Seriously?__

Yep, that’s the magic of the integrated JavaScript Database (JSDB) in NodeKit.

If you don’t believe me, restart the server and note that the count is still there.

If you _still_ don’t believe me (wow, what a cynic), look in the _.small-tech.org/nodekit/database_ folder and you should see a folder there that mirrors the path of your project (e.g., if your project is in _/var/home/aral/projects/greetings_, the folder will be _var.home.aral.projects.greetings_). Inside your project’s database folder, you should see a _greetings.js_ file. Open it up in a text editor and take a look. You should see something like this:

```js
export const _ = { 'count': 18 };
_['count'] = 19;
_['count'] = 20;
```

That’s what a table looks like in JavaScript Database (JSDB), which is integrated into NodeKit and available to all your routes via a global `db` reference.

Yes, you need never fear persistence ever again.

There’s so much more to JSDB that you can learn about in [the JSDB documentation](https://github.com/small-tech/jsdb#readme).

## Make Fetch Happen

While you can import any Node module that you install in your app from within the data block of your pages, there are are commonly used global APIs that you can use without importing. You saw one of those, the JavaScript Database (JSDB), above, that’s available as `db`. Similarly, the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) is available for use from your data blocks as `fetch`.

Here’s an example of how to use the Fetch API to get the list of public posts from a [Mastodon](https://joinmastodon.org/) instance.

This is the instance we’ll be using: https://mastodon.ar.al

And this is the JSON endpoint with the public timeline data: https://mastodon.ar.al/api/v1/timelines/public

Take a look at both to understand what we’re working with before creating a new folder called _make-fetch-happen_ with a file called _index.page_ in it. Then add the following code to that file:

```svelte
<data>
  export default async () => {
    const response = await fetch('https://mastodon.ar.al/api/v1/timelines/public')
    return await response.json()
  }
</data>

<script>
  export let data
</script>

<h1>Aral’s Fediverse Public Timeline</h1>
<ul>
  {#each data as post}
    <li>
      <a class='avatar-link' href='{post.account.url}'>
        <img class='avatar' src='{post.account.avatar}' alt='{post.account.username}’s avatar'>
      </a>
      <div class='content'>
        {@html post.content}
        {#each post.media_attachments as media}
          {#if media.type === 'image'}
            <img class='image' src='{media.url}'>
          {/if}
        {/each}
      </div>
    </li>
  {/each}
</ul>

<style>
  :global(body) { font-family: sans-serif; font-size: 1.25em; }
  :global(p:first-of-type) { margin-top: 0; }
  :global(p) { line-height: 1.5; }
  :global(a:not(.avatar-link)) {
    text-decoration: none; background-color: rgb(139, 218, 255);
    border-radius: 0.25em; padding: 0.25em; color: black;
  }
  h1 { font-size: 2.5em; text-align: center; }
  li {
    display: flex; align-items: flex-start; column-gap: 1em; padding: 1em;
    margin-bottom: 1em; background-color: #ccc; border-radius: 1em;
  }
  .avatar { width: 8em; border-radius: 1em; }
  .content { flex: 1; }
  .image { max-width: 100%; }
</style>
```

Now, run Nodekit with:

```shell
nodekit make-fetch-happen
```

And hit _https://localhost_ to see the latest public timeline from Aral’s mastodon instance.

> 💾 This example is available in _examples/make-fetch-happen_. You can also find a version that demonstrates importing a third-party module called [node-fetch](https://github.com/node-fetch/node-fetch) and using that instead in _examples/_third-party-import-in-nodescript-node-fetch_.

> 💾 There’s also version of this example that implements a streaming timeline in _examples/streaming-fediverse-posts_.

## NodeScript

With NodeKit, you write your apps using NodeScript.

NodeScript is a superset of [Svelte](https://svelte.dev) that includes support for server-side rendering and simple data exchange between the client and the server.

## APIs and working with data

For many projects, you should be able to keep your both your client and server code in the same _.page_ file using NodeScript.

However, if you have an API or purely data-related routes, you can create server-side routes by creating files with any valid HTTP1/1.1 method lowercased as the file extension (i.e., _.get_, _.post_, _.patch_, _.head_, etc.)

Also, you can create a WebSocket route simply by creating a _.socket_ file.

e.g.,

```text
my-project
  ├ index.page
  ├ index.post
  ├ about
  │   ╰ index.page
  ├ todos
  │   ╰ index.get
  ╰ chat
     ╰ index.socket
```

Optionally, to organise larger projects, you can encapsulate your site within a _src_ folder. If a _src_ folder does exist, NodeKit will only serve routes from that folder and not from the project root.

e.g.,

__`text
my-project
  ├ src
  │  ├ index.page
  │  ├ index.post
  │  ├ index.socket
  │  ╰ about
  │      ╰ index.page
  ├ test
  │   ╰ index.js
  ╰ README.md
```

## Valid file types

NodeKit doesn’t force you to put different types of routes into predefined folders. Instead, it uses file extensions to know how to handle different routes and other code and assets.

Here is a list of the main file types NodeKit handles and how it handles them:

| Extension | Type | Behaviour |
| --------- | ---- | --------- |
| .page     | NodeKit page (supports NodeScript) | Compiled into HTML and served in response to a HTTP GET request for the specified path. |
| .get, .head, .patch, .options, .connect, .delete, .trace, .post, .put | HTTP route | Served in response to an HTTP request for the specified method and path. |
| .socket | WebSocket route | Served in response to a WebSocket request for the specified path. |
| .component | Svelte component | Ignored by router. |
| .svelte | Svelte component (.component is just an alias for .svelte) | Ignored by router. |
| .js | Javascript module | Ignored by router. |

## HTTP routes

HTTP data routes are served in response to an HTTP request for the specified method and path.

All HTTP request methods are supported.

You create an HTTP route by create a JavaScript file named with the HTTP request method you want to respond to.

For example, to respond to GET requests at _/books_, you would create a file named _books.get_ in the root of your source folder.

The content of HTTP routes is an ESM module that exports a standard Node route request handler that takes [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) arguments.

For example, your _books.get_ route might look like this:

```js
export default (request, response) => {
  const books = db.books.get()
  response.end(books)
}
```

## WebSocket routes

WebSocket routes are defined in files ending with the _.socket_ extension.

They resemble HTTP routes but get the socket passed in as an extra initial parameter.

For example, here’s a basic _echo.socket_ route that repeats whatever it receives back to you:

```js
export default (socket, request, response) => {
  socket.addEventListener('message', event => {
    socket.send(event.data)
  })
}
```

> 💡 Since we’re not using the `request` or `response` objects in this route, we could have just left them off of the function signature.

And a simple _index.page_ route that uses it:

```svelte
<script>
  import { onMount } from 'svelte'

  let messageField

  let socket
  let message = ''
  let messages = []

  onMount(() => {
    // Initialise the web socket
    socket = new WebSocket(`wss://localhost/echo`)

    socket.addEventListener('open', event => {
      socket.send('Hello, there!')
    })

    socket.addEventListener('message', event => {
      messages = [...messages, event.data]
    })
  })
</script>

<h1>WebSocket Echo Demo</h1>

<form id='messageForm' on:submit|preventDefault={event => {
  socket.send(message)
  message = ''
  messageField.focus()
}}>
  <label>Message:
    <input type='text' bind:this={messageField} bind:value={message}>
  </label>
  <button type='submit'>Send</button>
</form>

<h2>Received messages</h2>

<ul id='received'>
  {#each messages as message}
    <li>{message}</li>
  {/each}
</ul>
```

## Database

NodeKit has an integrated [JSDB](https://github.com/small-tech/jsdb) database that’s available from all your routes as `db`.

JSDB is a transparent, in-memory, streaming write-on-update JavaScript database for the Small Web that persists to a JavaScript transaction log.

You can find the databases for your projects in the _~/.small-tech.org/nodekit/database_ folder. Each project gets its own folder in there with a name based on the absolute path to your project on your disk (e.g., if a NodeKit project is stored in _/var/home/aral/projects/my-project_, its database will be in a folder named _var.home.aral.projects.my-project_ in the main database folder.)

Tables in JSDB are simply JavaScript objects or arrays and JSDB writes to plain old JavaScript files.

[Learn more about JSDB.](https://github.com/small-tech/jsdb)

## Route parameters

You can include route parameters in your route paths by separating them with underscores and surrounding the parameter names in square brackets.

For example:

```text
manage_[token]_[domain].socket
```

Will create a WebSocket endpoint at:

```text
/manage/:token/:domain
```

You can also intersperse path fragments with parameters:

```text
books_[id]_pages_[page].page
```

Will compile the NodeKit page and make it available for HTTP GET requests at:

```text
/books/:id/pages/:page
```

So you can access the route via, say, _https://my.site/books/3/pages/10_.

You can also specify the same routes using folder structures. For example, the following directory structure will result in the same route as above:

```text
my-site
  ╰ books
     ╰ [id]
         ╰ pages
             ╰ [page].page
```

Note that you could also have set the name of the page to _index_[page].page_. Using just _[page].page_ for a parameterised index page is a shorthand.

You can decide which strategy to follow based on the structure of your app. If, for example, you could access not just the pages but the references and images of a book, it might make sense to use a folder structure:

```text
my-site
  ╰ books
     ╰ [id]
         ├ pages
         │   ╰ [page].page
         ├ references
         │   ╰ [reference].page
         ╰ images
             ╰ [image].page
```

You may, or may not find that easier to manage than:

```text
my-site
  ├ books_[id]_pages_[page].page
  ├ books_[id]_references_[reference].page
  ╰ books_[id]_images_[image].page
```

NodeKit leaves the decision up to you.


## Multiple roots

For larger projects, you might want to organise your routes, say, to separate your pages from your API. You can specify any folder within your source to be a new route by prefixing its name with an octothorpe (hash symbol/`#`).

For example, you can split the following directory structure:

```unicode
my-project
  ├ index.page
  ├ contacts.page
  ╰ contacts.post
```

As:

```unicode
my-project
  ├ index.page
  ╰ #api
    ├ contacts.page
    ╰ contacts.post
```

Or even:

```unicode
my-project
  ├ #pages
  │   ├ index.page
  │   ╰ contacts.page
  ╰ #api
      ╰ contacts.post
```

In all of the above versions, HTTP GET calls to _/contacts_ will find _contacts.page_ and HTTP POST calls to _/contacts_ will find _contacts.post_.

_(If you wanted your __contacts.post__ route to be accessible from __/api/contacts__ instead, you would just remove the __#__ and make it a regular folder.)_

## Static files

If you want NodeKit to serve static files, put them in a special folder called `#static`. This is a special case of the multiple roots feature explained above, where any files (excluding _dotfiles_) are served as static elements.

For example:

```unicode
my-project
  ├ index.page
  ╰ #static
    ├ header.svg
    ╰ demo.mp4
```

## Command-line interface

### serve

Default command.

> 💡 `nodekit serve [path to serve]` and `nodekit [path to serve]` are equivalent.

Note that if do not specify a path to serve, the default directory (_./_) is assumed.

### --version

Displays the version number.

_Currently does not exit the process unless when run from the distribution build._

## ⚠️ Building NodeKit

To build a distribution bundle for NodeKit, run:

```shell
./build
```

You will find the distribution under the _dist/_ folder.

To run NodeKit from the distribution folder, use the following syntax:

```shell
./nodekit [path to serve]
```

> 💡 It’s usually easier just to run `bin/nodekit [path to serve]` without building or, to test the distribution build, the _./quick-install_ script as that will run build for you and install the nodekit command into your path so you can run it as `nodekit [path to serve]`

## ⚠️ Debugging

To run NodeKit with the Node debugger (`node --inspect`), start it using:

```shell
bin/nodekit-inspect [path to serve]
```

> 💡 If you use VSCodium, you can add breakpoints in your code and attach to the process using the Attach command in the Run and Debug panel.

## Testing

Tests are written in [Tape With Promises](https://github.com/small-tech/tape-with-promises), run using [ESM Tape Runner](https://github.com/small-tech/esm-tape-runner), and displayed using [Tap Monkey](https://github.com/small-tech/tap-monkey/).

Coverage is provided by [c8](https://github.com/bcoe/c8).

Run tests:

```shell
npm -s test
```

Run coverage:

```shell
npm run -s coverage
```

💡️ The `-s` just silences the npm logs for cleaner output.

## Technical design

NodeKit is an ESM-only project for Node.js and relies on (the currently experimental) [ES Module Loaders](https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_loaders) ([follow the latest work](https://github.com/nodejs/loaders)) functionality.

Additionally, NodeKit relies on a number of core dependencies for its essential features.

## Core dependencies

| Dependency | Purpose |
| ---------- | ------- |
| [@small-tech/https](https://github.com/small-tech/https) | Drop-in replacement for Node’s native https module with automatic TLS for development and production using [@small-tech/auto-encrypt ](https://github.com/small-tech/auto-encrypt) and [@small-tech/auto-encrypt-localhost](https://github.com/small-tech/auto-encrypt-localhost). |
| [@small-tech/jsdb](https://github.com/small-tech/jsdb) | Zero-dependency, transparent, in-memory, streaming write-on-update JavaScript database that persists to JavaScript transaction logs. |
| [Polka@next](https://github.com/lukeed/polka) | Native HTTP server with added support for routing, middleware, and sub-applications. Polka uses [Trouter](https://github.com/lukeed/trouter) as its router. |
| [tinyws](https://github.com/tinyhttp/tinyws) | WebSocket middleware for Node.js based on ws. |
| [Svelte](https://svelte.dev)| Interface framework. NodeScript, used in Pages, is an extension of Svelte. Components, used in Pages, are Svelte components. |
| [esbuild](https://esbuild.github.io/) | An extremely fast JavaScript bundler. Used to bundle hydration scripts and NodeScript routes during server-side rendering. |
| [node-git-server](https://github.com/gabrielcsapo/node-git-server) | Git server for hosting your source code. Used in deployments. |
| [isomorphic-git](https://isomorphic-git.org/) | Git client used in deployments on development and for handling auto-updates on production.|
| [sade](https://github.com/lukeed/sade) | A small command-line interface (CLI) framework that uses [mri](https://github.com/lukeed/mri) for its argument parsing. |

## Frequently-Asked Questions (FAQs)

### What about serverless?

Dude, this is literally a server. If you want “serverless” (funny how folks who own servers want you to go serverless, isn’t it? It’s almost like a small group of people get to own stuff and you have to rent from them on their terms… hmm 🤔️) then use some Big Tech framework like [SvelteKit](https://kit.svelte.dev). They will bend over backwards to cater to all your Big Tech needs.

### Can you add &lt;insert Big Tech feature here&gt;?

No, go away.

### Will this scale?

Fuck off.

(Yes, it will scale for the purposes it was designed for. It will not scale for the purposes of farming the population for their data and destroying our human rights and democracy in the process. That’s a feature, not a bug.)

### Is there anything stopping me from using this to build sites or apps that violate people’s privacy and farm them for their data? (You know, the business model of Silicon Valley… that thing we call surveillance capitalism?)

No, there is nothing in the license to stop you from doing so.

But I will fucking haunt you in your nightmares.

(Just sayin’)

Also, it’s not nice. Don’t.

### Is this really a Frequently Asked Questions section or a political statement?

Can’t it be both?

(It’s a political statement.)

## Ideas

  - (Suggested by [Laura](https://laurakalbag.com)) Example apps in NodeKit covering the 7 GUIs tasks: https://eugenkiss.github.io/7guis/tasks
