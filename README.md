# NodeKit

A [Small Web](https://small-tech.org/research-and-development) server.

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
  - Deploy on any VPS (e.g., using [Domain](https://github.com/small-tech/domain)) or a Raspberry Pi.

## Install

```shell
  wget -qO- https://nodekit.small-web.org/install | bash
```

## Create your first site/app.

1. NodeKit does not require scaffolding. Just create a folder and start building your site or app:

    ```shell
    mkdir todo
    cd todo
    touch index.page
    ```

2. Open _index.page_ in your editor and add the following code:

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

## NodeScript

With NodeKit, you write your apps using NodeScript.

NodeScript is a superset of Svelte that includes support for server-side rendering and data exchange between the client and the server.

## APIs and working with data

For mostly static or server-rendered content with a little sprinkling of dynamic data, NodeScript you should be able to keep your code both the client and server in the same `.page` file.

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

### Valid file types

NodeKit doesn’t force you to put different types of routes into predefined folders. Instead, it uses file extensions to know how to handle different routes and other code and assets.

Here is a list of the main file types NodeKit handles and how it handles them:

| Extension | Type | Behaviour |
| --------- | ---- | --------- |
| .page     | NodeKit page (supports NodeScript) | Compiled into HTML and served in response to a HTTP GET request for the specified path. |
| .data     | A server-side data handler for a page | A handler that is called on the server while a page is being server-side rendered. Its return value is set as the `data` prop of the page. |
| .get, .head, .patch, .options, .connect, .delete, .trace, .post, .put | HTTP route | Served in response to an HTTP request for the specified method and path. |
| .socket | WebSocket route | Served in response to a WebSocket request for the specified path. |
| .component | Svelte component | Ignored by router. |
| .js | Javascript module | Ignored by router. |

### Layouts

It’s common to want a shared header and footer on pages on the same site (or in different sections of a site). You can control the layout of your pages using `.layout` files.

| File name | Type | Behaviour |
| --------- | ---- | --------- |
| Layout.page | NodeKit layout (supports NodeScript) | Any sibling or child pages are slotted into this component during page compilation. |
| Layout.reset | Empty file | Flags to compiler to not use a layout for sibling or child pages. (If a Page.layout file is present in a child directory, it will take precedence from that level on.) |

### HTTP routes

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

### Data routes

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

### Pages

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

### Route parameters

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


### Multiple roots

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

### HTML Template

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

On your production machine (a VPS works well for this):

  1. Install NodeKit
  2. Run:
     ```shell
     nodekit enable
     ```
  3. Hit your server’s domain in the browser.

_Note the server password you’re shown when your server starts in your password manager (e.g., 1password) as you will need it later when [deploying to your server](#deployment)._

The `enable` command runs NodeKit as a systemd service on your server.

Once NodeKit is running as a service, it will automatically restart should your app or server crash.

NodeKit will also periodically check for updates to itself.

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
