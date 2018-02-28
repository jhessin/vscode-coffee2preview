// This is a partial definition file

declare module 'coffeescript' {
  export function compile(code: string, options?: object): string;
  export function transpile(js: string, options?: object): string;
  export function run(code: string, options?: object): string;
  export function eval(code: string, options?: object): string;
  export function register(): null;
}
