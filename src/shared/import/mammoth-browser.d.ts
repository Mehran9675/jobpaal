/** The self-contained browser build of mammoth (the main entry needs Node built-ins). */
declare module 'mammoth/mammoth.browser.js' {
  import mammoth = require('mammoth');
  export = mammoth;
}
