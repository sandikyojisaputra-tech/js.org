export interface Resource {
  id: string;
  name: string;
  description: string;
  category: 'Frontend' | 'Backend' | 'Tooling' | 'Runtime' | 'Testing';
  url: string;
  icon: string;
}

export const JS_RESOURCES: Resource[] = [
  {
    id: 'react',
    name: 'React',
    description: 'A JavaScript library for building user interfaces.',
    category: 'Frontend',
    url: 'https://react.dev',
    icon: 'Layout'
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'The React Framework for the Web.',
    category: 'Frontend',
    url: 'https://nextjs.org',
    icon: 'Zap'
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: "JavaScript runtime built on Chrome's V8 JavaScript engine.",
    category: 'Runtime',
    url: 'https://nodejs.org',
    icon: 'Server'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScript is JavaScript with syntax for types.',
    category: 'Tooling',
    url: 'https://typescriptlang.org',
    icon: 'ShieldCheck'
  },
  {
    id: 'vite',
    name: 'Vite',
    description: 'Next generation frontend tooling.',
    category: 'Tooling',
    url: 'https://vitejs.dev',
    icon: 'Cpu'
  },
  {
    id: 'express',
    name: 'Express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js.',
    category: 'Backend',
    url: 'https://expressjs.com',
    icon: 'Globe'
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'A utility-first CSS framework for rapid UI development.',
    category: 'Frontend',
    url: 'https://tailwindcss.com',
    icon: 'Palette'
  },
  {
    id: 'jest',
    name: 'Jest',
    description: 'Delightful JavaScript Testing.',
    category: 'Testing',
    url: 'https://jestjs.io',
    icon: 'CheckCircle'
  },
  {
    id: 'svelte',
    name: 'Svelte',
    description: 'Cybernetically enhanced web apps.',
    category: 'Frontend',
    url: 'https://svelte.dev',
    icon: 'Zap'
  },
  {
    id: 'deno',
    name: 'Deno',
    description: 'A modern runtime for JavaScript and TypeScript.',
    category: 'Runtime',
    url: 'https://deno.com',
    icon: 'ShieldCheck'
  },
  {
    id: 'bun',
    name: 'Bun',
    description: 'Incredibly fast JavaScript runtime, bundler, test runner, and package manager.',
    category: 'Runtime',
    url: 'https://bun.sh',
    icon: 'Zap'
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: 'Reliable end-to-end testing for modern web apps.',
    category: 'Testing',
    url: 'https://playwright.dev',
    icon: 'CheckCircle'
  }
];
