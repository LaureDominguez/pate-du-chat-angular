
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: "fr",
  routes: undefined,
  entryPointToBrowserMapping: {
  "src/app/components/admin/admin.component.ts": [
    {
      "path": "chunk-IW2AWZXZ.js",
      "dynamicImport": false
    }
  ]
},
  assets: {
    'index.csr.html': {size: 98672, hash: '93200a5f0d875fa10a2013cf34cff2758763c4d0a075f37dc8b882587c119f3b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1662, hash: '30167900b8fbca5d5b2b79223669e6355bb8e63ed574db16a1b765b914a49883', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-WQLF35BW.css': {size: 102162, hash: 'VIFYjbqnQcU', text: () => import('./assets-chunks/styles-WQLF35BW_css.mjs').then(m => m.default)}
  },
};
