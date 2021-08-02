# NodeKit

An opinionated Small Web server.

## Features

  - Single-line install on development/staging/production
  - Always uses latest Node.js LTS (you don’t need to have Node.js installed)
  - Automatic TLS (https) on development/staging/production
  - Language is a superset of Svelte (you can use any svelte component)
  - Built-in database
  - Simple data exchange and server-side rendering (REST and WebSockets)
  - No scaffolding (no `npm init my-project-template`, just start, it’s easy)
  - No build stage

??? Should we just support WebSocket and not REST at all?

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
