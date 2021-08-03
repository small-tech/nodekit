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
    <get>
      return db.todos
    </get>

    <post>
      db.todos.push(request.params.todo)
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
