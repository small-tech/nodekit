# NodeKit

An opinionated Small Web server.

## Features

  - Single-line install on development/staging/production
  - Always uses latest Node.js LTS (you don’t need to have Node.js installed)
  - Automatic TLS (https) on development/staging/production
  - Language is a superset of Svelte (you can use any svelte component)
  - Integrated database ([JSDB](https://github.com/small-tech/jsdb))
  - Simple data exchange and server-side rendering (REST and WebSockets)
  - No scaffolding (no `npm init my-project-template`, just start, it’s easy)
  - No build stage
  - Small as possible in size and dependencies.
  - As opinionated as possible.

## Install

```shell
  wget -qO- https://nodekit.dev/install | bash
```

## Create your first site/app.

```shell
mkdir todo
cd todo
touch index.page
```

Open _index.page_ in your editor and add the following code:

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

## Production

Setting up a production server is as easy as running NodeKit on your development machine.

On your production machine (a VPS works well for this):

  1. Install NodeKit
  2. Run:

     ```shell
     nodekit enable
     ```
  3. Hit your server’s domain in the browser.

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

### Using NoteKit

If you like, you can also declare your production remote and deploy using a couple of aliases NodeKit provides to save you a few keystrokes:

```shell
nodekit remote add your-project.small-web.org
nodekit deploy
```

Once you’ve defined your git remote (either directly via git, or via NodeKit), you can use the `nodekit deploy` alias to carry out a `git push production main`.


