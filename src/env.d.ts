/// <reference types="vite/client" />

declare const __JOBPAAL_TARGET__: 'chrome' | 'firefox';

declare module '*.css?inline' {
  const css: string;
  export default css;
}
