import fs from 'fs'
import path from 'path'

import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const developmentSocketScript = fs.readFileSync(path.join(__dirname, 'development-socket.js'))

export function renderPage(route, className, html, css, hydrationScript, data) {
  return `
  <!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8'>
      <meta http-equiv='X-UA-Compatible' content='IE=edge'>
      <meta name='viewport' content='width=device-width, initial-scale=1.0'>
      <link rel="icon" href="data:,">
      <title>${route}</title>
      <style id='__style__'>${css}</style>
      <style>
        #overlay {
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          transition: opacity 333ms;
        }
        #overlayBody {
          position: absolute;
          display: flex;
          flex-direction: column;
          border-radius: 1em;
          left: 3em; right: 3em; top: 3em; bottom: 3em;
          background-color: rgba(255, 255, 255, 0.9);
          font-family: sans-serif;
          font-size: 1.5em;
          padding: 0 2em;
        }
        #overlayBody h1 { 
          color: red;
          font-size: 3em;
          margin-top: 0.25em;
          margin-bottom: 0;
        }
        #overlayBody h2 {
          margin-top: 0; 
          margin-bottom: 0;
        }
        #overlayBody pre { 
          background-color: #ccc;
          border-radius: 1em;
          padding: 1em;
          margin-left: -1em;
          margin-right: -1em;
          margin-bottom: 2em;
          flex-grow: 1;
        }
        .hideOverlay {
          visibility: hidden;
          opacity: 0;
        }
        .showOverlay {
          visibility: visible;
          opacity: 1;
        }
      </style>
    </head>
    <body>
        <div id='overlay' class='hideOverlay'>
          <div id='overlayBody'>
            <h1 id='errorTitle'>Error title</h1>
            <h2 id='errorMessage'>Error message</h2>
            <pre><code id='errorDetails'>Error details (e.g., stack trace, etc.)</code></pre>
          </div>
        </div>
        <div id='application'>
          ${html}
        </div>

        <script type='module'>
        ${hydrationScript}

        new ${className}({
          target: document.getElementById('application'),
          hydrate: true,
          props: {
            data: ${JSON.stringify(data)}
          }
        })
    </script>
    ${process.env.PRODUCTION ? '' : `<script>${developmentSocketScript}</script>`}
    </body>
    </html>
  `
}
