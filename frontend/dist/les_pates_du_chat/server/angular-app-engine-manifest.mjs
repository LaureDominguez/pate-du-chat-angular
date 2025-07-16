
export default {
  basePath: '/',
  supportedLocales: {
  "fr": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
