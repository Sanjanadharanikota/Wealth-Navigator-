// Type declarations for custom CSS classes
declare module 'tailwindcss' {
  export interface TailwindConfig {
    safelist?: string[];
  }
}

// Type declarations for custom CSS classes used in the project
declare global {
  interface CSSModule {
    readonly [key: string]: string;
  }
}
