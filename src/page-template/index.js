export function renderPage(_route, className, html, css, hydrationScript, data) {
  return `
  <!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8'>
      <meta http-equiv='X-UA-Compatible' content='IE=edge'>
      <meta name='viewport' content='width=device-width, initial-scale=1.0'>
      <link rel="icon" href="data:,">
      <title></title>
      <style id='__style__'>${css}</style>
    </head>
    <body>
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
    </body>
    </html>
  `
}

