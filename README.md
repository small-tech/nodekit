# NodeKit

A [Small Web](https://small-tech.org/research-and-development) server.

_Because creating a modern web site should be simple if your aim isn’t to do something nasty to people._

__TODO: Only one of these lists should exist. Prune/edit as necessary.__

## Core design decisions

  - Node.js only.
  - No build step.
  - No scaffolding/project generators.
  - Run same server on development and production.
  - < 60 seconds to get started in both development and production.
  - Optimise for server-side rendering.
  - TLS everywhere by default.
  - File-based router that uses (experimental) ES Module Loaders.
  - Integrated database as first-class citizen.
  - Convention over configuration.
  - Forgiving (will render a simple static HTML file if you want).
  - Own scripting syntax (NodeScript) for pages that extends Svelte to make it trivial to include data from your database in your server-side rendered pages.
  - Integrated git server for deployments and app auto updates.


## Features

  - Single-line install on development/staging/production.
  - Always uses latest Node.js LTS (you don’t need to have Node.js installed).
  - Automatic TLS (https) on development/staging/production.
  - NodeScript, a superset of Svelte, lets you define your pages, including server-side data fetching for automatic client-side hydration.
  - Use any svelte component in your interfaces.
  - File-based routing made as elegant and flexible as possible using Node ES Module loaders.
  - Integrated database ([JSDB](https://github.com/small-tech/jsdb)).
  - Simple data exchange and server-side rendering (REST and WebSockets).
  - No scaffolding (no `npm init my-project-template`, just start, it’s easy).
  - No build stage.
  - Integrated git server for deployments and app auto updates.
  - Small as possible in size and dependencies.
  - As opinionated as possible.
  - Deploy on any VPS (e.g., using [Domain](https://github.com/small-tech/domain)) or own your own hardware (e.g., a Raspberry Pi).

## Install

```shell
  wget -qO- https://nodekit.small-web.org/install | bash
```

The NodeKit installer installs two files onto your system. The first is the NodeKit bundle. This is a JavaScript file that contains NodeKit. The other is the version of Node.js [LTS](https://nodejs.org/en/about/releases/) that it has been tested with (this will be kept current with the latest LTS release).

___NoteKit has one prerequisite:__ if you want to deploy to a production machine or if you want to update NodeKit itself, you must have a recent version of [git](https://git-scm.com/) installed on your system. Needless to say, in the 2020s, most developers will already have a machine that meets this requirement and NodeKit will warn you if you don’t and prompt you to install it._

## Update

To update NodeKit to the latest version:

  - __In development,__ run:
    ```shell
    nodekit update
    ```
  - __On production,__ you don’t have to do anything as NodeKit will automatically update itself and its companion Node.js binary as and when necessary.

## Hello, world!

Let’s quickly create and test your first “Hello, world!” NodeKit site.

Enter the following four commands in your terminal:

```shell
mkdir hello-world
cd hello-world
echo '<h1>Hello, world!</h1>' > index.html
nodekit
```

Now hit _https://localhost` and you should see your new site.

Yes, NodeKit will happily serve any HTML and static content just like any other good web server should. You can start playing with it as simply as you like and it is designed, like HTML itself (as you can see in the above example), to be as forgiving as possible.

But you can do that with any web server… Let’s do something that no other web server can do now, shall we?

## To do or not to do?

Let’s create a server-side rendered, dynamic to-do list web app:

1. You’ve already seen that NodeKit does not require scaffolding. Just create a folder and start building your site or app:

    ```shell
    mkdir todo
    cd todo
    touch index.page
    ```

2. Open _index.page_ in your editor and add the following code into it:

    ```svelte
    <data>
      export default (request, response) => {
        return db.todos
      }
    </data>

    <post>
      export default (request, response) => {
        db.todos.push(request.params.todo)
        request.end()
      }
    </post>

    <script>
      export let data
    </script>

    <ul>
      {#each data.todo as todo, index}
        <li>
          <label>
            <input type='checkbox' value={todo.description}>
          </label>
        </li>
      {/each}
    </ul>

    <label>New todo:</label>
    <textarea />
    <button>Add</button>
    ```

3. Run NodeKit.

    ```shell
    nodekit
    ```

Hit https://localhost and you will see your new NodeKit app. Go ahead and add some todos and check them off and reload the page to see them persist.

Take a moment to let it sink in that with just the above code, we created an app that:

  - Is server-side rendered with the latest list of to-dos from a database.
  - Is hydrated on the client and updates the list of to-dos every minute.
  - Enables you to add and check off to-dos and persists them in the database.
  - Includes all the server and client side code in a single file.

We were able to do all that mainly thanks to NodeKit’s use of [NodeScript](#nodescript), which extends [Svelte](https://svelte.dev) to make creating server-side rendered applications as simple as possible, the integrated [JavaScript Database (JSDB)](https://github.com/small-tech/jsdb), and [esbuild](https://esbuild.github.io/), which is working behind the scenes to bundle the client-side hydration scripts.

If you want to learn more about the inner workings of NodeKit, look at the list of its [core dependencies](#core-dependencies) in the [Technical Design](#technical-design) section.

## NodeScript

With NodeKit, you write your apps using NodeScript.

NodeScript is a superset of [Svelte](https://svelte.dev) that includes support for server-side rendering and simple data exchange between the client and the server.

## APIs and working with data

For many projects, you should be able to keep your both your client and server code in the same `.page` file using NodeScript.

However, if you have an API or purely data-related routes, you can create server-side routes by creating files with any valid HTTP1/1.1 method lowercased as the file extension (i.e., `.get`, `.post`, `.patch`, `.head`, etc.)

Also, you can create a WebSocket route simply by creating a `.socket` file.

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

Optionally, to organise larger projects, you can encapsulate your site within a `src` folder. If a `src` folder does exist, NodeKit will only serve routes from that folder and not from the project root.

e.g.,

```text
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
| .data     | A server-side data handler for a page | A handler that is called on the server while a page is being server-side rendered. Its return value is set as the `data` prop of the page. |
| .get, .head, .patch, .options, .connect, .delete, .trace, .post, .put | HTTP route | Served in response to an HTTP request for the specified method and path. |
| .socket | WebSocket route | Served in response to a WebSocket request for the specified path. |
| .component | Svelte component | Ignored by router. |
| .svelte | Svelte component (.component is just an alias for .svelte) | Ignored by router. |
| .js | Javascript module | Ignored by router. |

## Layouts

It’s common to want a shared header and footer on pages on the same site (or in different sections of a site). You can control the layout of your pages using `.layout` files.

| File name | Type | Behaviour |
| --------- | ---- | --------- |
| Layout.page | NodeKit layout (supports NodeScript) | Any sibling or child pages are slotted into this component during page compilation. |
| Layout.reset | Empty file | Flags to compiler to not use a layout for sibling or child pages. (If a Page.layout file is present in a child directory, it will take precedence from that level on.) |

## HTTP routes

HTTP data routes are served in response to an HTTP request for the specified method and path.

All HTTP request methods are supported.

You create an HTTP route by create a JavaScript file named with the HTTP request method you want to respond to.

For example, to respond to GET requests at `/books`, you would create a file named `books.get` in the root of your source folder.

The content of HTTP routes is an ESM module that exports a standard Node route request handler that takes [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) arguments.

__TODO: As we’re going to add to these, document those additions here.__

For example, your `books.get` route might look like this:

```js
export default (request, response) => {
  const books = db.books.get()
  response.end(books)
}
```

## Data routes

A generic HTTP route that returns some piece of data is generally considered to be part of your site’s Application Programming Interface (API).

Generic API routes are useful when the same route is going to be called from the browser by a number of different pages.

But what if you wanted to get the list of books from your database just to render them in your Books page?

For that use case you, can create a `.data` file, which is essentially an HTTP GET route for data that is tightly coupled to a single page.

__books.data__
```js
export default (request, response) => {
  const books = db.books.get()
  return {books}
}
```

__books.page__

```svelte
<script>
  export let data

  setInterval(() => {
    // Refresh the list of books every minute.
    data = await (await fetch('/books/data')).json()
  }, 60000)
</script>

<h1>Books</h1>
<ul>
  {#each data.books as book}
    <li><a href='{book.link}'>{book.title}</a></li>
  {/each}
</ul>
```

Note that the data route is almost identical to the HTTP GET route. The main difference is that unlike regular request handlers, which call `response.end()`, your data handler shares the same path as a page (which is rendered in response to a HTTP GET request) and so your data handler must `return` its value.

(You cannot end the response in your GET handler as NodeKit still needs to take the data you’ve returned and render the page.)

## Pages

A NodeKit page is written in NodeScript, which is an extension of Svelte.

Specifically, NodeScript extends Svelte to enable you to easily server-side render your routes. As pages are being rendered, you can, for example, get data from the integrated [JSDB](https://github.com/small-tech/jsdb) database and include it in the rendered page. Once the page is rendered, if JavaScript is available on the client, the page will be hydrated.

While you can define your [HTTP routes](#http-routes) in separate files, you can also define them inline, right inside your pages.

So, for example, instead of a separate `books.get` route, your `books.page` could look like this:

```svelte
<data>
  export default (request, response) => {
    const books = db.books.get()
    return {books}
  }
</data>

<script>
  export let data

  setInterval(() => {
    // Refresh the list of books every minute.
    data = await (await fetch('/books/data')).json()
  }, 60000)
</script>

<h1>Books</h1>
<ul>
  {#each data.books as book}
    <li><a href='{book.link}'>{book.title}</a></li>
  {/each}
</ul>
```

In the above example, when someone hits `/books`:

1. The `get` handler will run and retrieve a list of the books from the integrated database. (The reference to `db` is globally accessible from all routes.)

2. While the page is being rendered, the value of `data` will have the value returned from the `get` route.

3. As the page is being rendered, the value of data will be used to display the list of books in the unordered list.

Once the page has loaded, it will be hydrated and the script in the `<script>` tag will run in the browser, setting up an interval that will refresh the list of books every minute.

Note that when doing the `fetch` request, we specify `/books/data` as the URL. This is an automatically generated HTTP GET route that you can call for exactly this sort of purpose.

Also note that the behaviour of inline data request handlers is the same as for the external ones.

## Database

NodeKit has an integrated [JSDB](https://github.com/small-tech/jsdb) database that’s available from all your routes as `db`.

JSDB is a transparent, in-memory, streaming write-on-update JavaScript database for the Small Web that persists to a JavaScript transaction log.

NodeKit supports [migrations](#migrations) on the integrated database.

If you’ve created at least one table on the database, you can find it in the `.db` folder. Tables in JSDB are simply JavaScript objects or arrays and JSDB writes to plain old JavaScript files.

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

So you can access the route via, say, `https://my.site/books/3/pages/10`.

You can also specify the same routes using folder structures. For example, the following directory structure will result in the same route as above:

```text
my-site
  ╰ books
     ╰ [id]
         ╰ pages
             ╰ [page].page
```

Note that you could also have set the name of the page to `index_[page].page`. Using just `[page].page` for a parameterised index page is a shorthand.

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

In all of the above versions, HTTP GET calls to `/contacts` will find `contacts.page` and HTTP POST calls to `/contacts` will find `contacts.post`.

_(If you wanted your `contacts.post` route to be accessible from `/api/contacts` instead, you would just remove the `#` and make it a regular folder.)_

## Static files

NodeKit will serve any assets (images, etc.) it finds in your source folder. If you want to group all your assets in a single folder for organisational purposes, just make use of the multiple roots feature explained above.

For example:

```unicode
my-project
  ├ index.page
  ╰ #static
    ├ header.svg
    ╰ demo.mp4
```

_Note that the use of the name `#static` is purely for convention. You could have called it anything._

## Ignoring folders

While NodeKit will ignore folders that do not contain any routes by default, you can explicitly state that certain folders or files should be ignored by preceding their name with an underscore.

```unicode
my-project
  ├ index.page
  ╰ _ignore-these-files
    ├ this-file.txt
    ╰ and-this-file-especially.mp4
```

You might want to do this to stop NodeKit from serving certain files as static assets, to clarify your intent and organise your project better, and for better performance if you have lots of files in a folder that you know should be ignored to save NodeKit some effort.

There are also a couple of features like [migrations](#migrations) and [middleware](#middleware), that take advantage of this feature.

## Migrations

__TODO: Migrations are currently not supported in JSDB.__

The integrated [JSDB](https://github.com/small-tech/jsdb) database supports migrations.

A migration is simply a JavaScript file with a special name that you place in a folder called `_migrations` in the root of your source.

The naming convention is:

`version-N.js`

Where `N` is the database version you are defining. `N` starts at zero (for the initial database setup and increases by 1 each time).

NodeKit will run your migrations in order and update the `version` property of the database accordingly.

## Middleware

NodeKit supports Connect-style middleware. All you have to do is define your middleware in a JavaScript file in folder called `_middleware` in the root of your source.

For example, to allow all Cross Origin Requests (CORS), save the following middleware in a file called `allow-all-cors.js` in your `_middleware` folder:

```js
module.exports = (request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*')
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
}
```

## The HTML Template

__Tentative: THIS FEATURE MIGHT BE REMOVED.__

By default, NodeKit uses a very basic outermost HTML template and expects you to use [layouts](#layouts) and the <a href='https://svelte.dev/docs#svelte_head'>&lt;svelte:head&gt;</a> element to inject anything you might need into `document.head`.

That said, you can override this template by providing a `Layout.html` in your main source folder.

When creating a custom Layout template, you must include the special placeholders that tell NodeKit where to include different parts of a page.

For example:

```html
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta http-equiv='X-UA-Compatible' content='IE=edge'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <link rel="icon" href="data:,">
  <title>{title}</title>
  <style>{css}</style>
</head>
<body>
  {page}
</body>
</html>
```

## Build

_Just kidding._ NodeKit does not have a build stage. It is a server you run on both on your development machine and in production.

NodeKit will automatically build and rebuild things as and when necessary. You don’t have to worry about it. It’s really how web development should be.

## Production

Setting up a production server is almost easy as running NodeKit on your development machine.

### Prerequisites:

  1. [systemd](https://systemd.io/)
  1. Either [wget](https://www.gnu.org/software/wget/) or [curl](https://curl.se/) (so you can download the installer)
  2. A recent version of [git](https://git-scm.com/)

### Process:

On your production machine (a VPS works well for this):

  1. [Install NodeKit.](#installation)
  2. Start the server as a service:
     ```shell
     nodekit enable
     ```
  3. Hit your server’s domain in the browser.

_Note the server password you’re shown when your server starts in your password manager (e.g., 1password) as you will need it later when [deploying to your server](#deployment)._

The `enable` command runs NodeKit as a systemd service on your server.

Once NodeKit is running as a service, it will automatically restart should your app or server crash.

NodeKit will also periodically check for updates to itself.

## Other prerequisites (common to setting up any server) and how to avoid them

Setting up any production machine involves the following non-trivial prerequisites:

  - commissioning a server (e.g., a VPS or running off your own hardware, which could be a Raspberry Pi)
  - registering a domain name
  - setting up your DNS information to point your domain name to your server

If you want to get up and running with a NodeKit production machine in under a minute, you can set one up on [small-web.org](https://small-web.org).

You can also run [Domain](https://github.com/small-tech/domain) – the same software that powers [small-web.org](https://small-web.org) – yourself. Some ideas:

  - Run a private instance for your family or maybe the school or other organisation you work for.
  - Run a non-commercial instance for a municipality or other community.
  - Run a commercial service open to the public at large.

If you do use, enjoy, and benefit from NodeKit and/or Domain, please consider becoming [a patron of Small Technology Foundation](https://small-tech.org/fund-us) to enable us to keep working on them.

## Deployment

Once your production server is up and running, you need some way to deploy your application to it.

With NodeKit, you deploy your application using Git.

### Using git directly

Add your production site’s git repository as your production remote in git.

For example, say you’re hosting it on small-web.org and your project/domain is called `your-project`. To deploy:

```shell
git remote add production https://your-project.small-web.org/source/self.git
git push production main
```

Before allowing you to push, NodeKit will ask you for your server’s password.

You can get your servers password by running the following command on your server:

```shell
nodekit password
```

(If you used Domain to set up your server, you should have been shown your password during the setup process. Please store your server’s password in a password manager like 1password.)

### Using NoteKit’s aliases

If you like, you can also declare your production remote and deploy using a couple of aliases NodeKit provides to save you a few keystrokes:

```shell
nodekit remote add your-project.small-web.org
nodekit deploy
```

Once you’ve defined your git remote (either directly via git, or via NodeKit), you can use the `nodekit deploy` alias to carry out a `git push production main`.

## Setting up a production server with pull updates

When setting up a production server, you can ask that it regularly polls for source changes on a public git remote.

You would do this if you want other people to be able to deploy your app using NodeKit and/or Domain and get auto updates whenever you make a new release.

When you push updates to your repository, their instances will get automatically updated the next time they poll your repository for changes.

_(Using [Domain](https://github.com/small-tech/domain), anyone can install any NodeKit app simply by providing its URL.)_


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
