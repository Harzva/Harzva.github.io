# dsh.fish market client and React runtime

`hub-client.js` is the unmodified `package/lib/client.js` from
[`@dsh-fish/hub@0.5.1`](https://registry.npmjs.org/@dsh-fish/hub/-/hub-0.5.1.tgz).
The npm tarball integrity is
`sha512-sWj/GYLeA8XaICblSoXTKNpyxTTBEEx0jOnmyTcdpa7URd58sYSQlZLnPkEHtxE/Ka/cR/s3kRLCRODWy23t5g==`.
The client SHA-256 is `b761828e229b239473e06aa5b67aa4a406cab58cec52abdbcd8047b7c6657eed`.
The package includes the MIT license in `LICENSE.hub.txt`.

`react-runtime.js` bundles the production exports of `react@18.3.1`,
`react-dom@18.3.1` and its `scheduler@0.23.2` dependency with
`esbuild@0.25.12`. React, React DOM and Scheduler share the included
`LICENSE.react.txt`. The runtime SHA-256 is
`ddcf4bae9c0e7ac636947238eb4750f66b2e98b01a176a58eda1ca23315c4345`.
It is served locally; the panel does not load any remote scripts.

To regenerate from an isolated directory with the pinned npm packages, write
this entry:

```js
export { default as React } from 'react';
export { createRoot } from 'react-dom/client';
export * as jsxRuntime from 'react/jsx-runtime';
```

Then run:

```sh
./node_modules/.bin/esbuild entry.js --bundle --platform=browser --target=chrome120 \
  --format=iife --global-name=OpenBotDshReact --define:process.env.NODE_ENV='"production"' \
  --minify --legal-comments=eof --outfile=react-runtime.js
```

`index.html`, `hub-bootstrap.js` and `hub-shell.css` provide the local
document and DSH client slot host; they are OpenBot code.
