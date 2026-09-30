import type { SeedProfile } from './profile.schema.js';

// Fictional placeholder data: the work history and companies below do not
// exist; only the name, the GitHub account and the projects are real.
export const profile = {
  name: 'Vadzim L',
  headline: 'Senior Full-Stack Developer · Team Lead',
  description:
    'Full-stack engineer with 15+ years of building web products end to end, ' +
    'from database schema to UI. For the last several years I have led ' +
    'product teams of 5–8 engineers: shaping architecture, running code ' +
    'review and hiring, and keeping delivery predictable. Main stack is ' +
    'TypeScript on Node.js (NestJS, GraphQL, Prisma) and React; I care about ' +
    'clear boundaries, tests that catch real bugs and systems that are easy ' +
    'to run from scratch.',
  location: 'Remote',
  email: 'vadzzim@gmail.com',
  links: [{ label: 'GitHub', url: 'https://github.com/vadzzim' }],
  skills: [
    { name: 'TypeScript' },
    { name: 'JavaScript' },
    { name: 'Node.js' },
    { name: 'NestJS' },
    { name: 'GraphQL' },
    { name: 'Apollo' },
    { name: 'REST API design' },
    { name: 'React' },
    { name: 'Next.js' },
    { name: 'Prisma' },
    { name: 'PostgreSQL' },
    { name: 'CockroachDB' },
    { name: 'Redis' },
    { name: 'Kafka' },
    { name: 'Docker' },
    { name: 'Kubernetes' },
    { name: 'AWS' },
    { name: 'CI/CD' },
    { name: 'Testing (Vitest, Jest, Playwright)' },
    { name: 'System design' },
    { name: 'Git' },
    { name: 'Team leadership' },
    { name: 'Mentoring and code review' },
    { name: 'Hiring' },
  ],
  // Any order: the API returns experience newest first. Months are "YYYY-MM";
  // omit endDate for the current job.
  experience: [
    {
      company: 'Northwind Payments',
      position: 'Team Lead / Senior Full-Stack Developer',
      startDate: '2022-03',
      achievements: [
        'Lead a team of 7 engineers owning the merchant dashboard and its GraphQL API',
        'Split a monolithic Node.js backend into NestJS modules with clear boundaries, cutting average PR review time from 3 days to 1',
        'Introduced DataLoader-based batching and query cost limits, reducing p95 API latency by 45%',
        'Set up a hiring loop and onboarding guide; grew the team from 3 to 7 with no regretted hires',
      ],
    },
    {
      company: 'Brightline Logistics',
      position: 'Tech Lead',
      startDate: '2019-01',
      endDate: '2022-02',
      achievements: [
        'Led 5 engineers building a real-time shipment tracking platform (NestJS, Kafka, React)',
        'Moved deployments from manual scripts to Docker and Kubernetes with CI/CD, going from weekly to daily releases',
        'Designed an event-driven integration layer for 40+ carrier APIs',
        'Raised test coverage of core services from 20% to 80% and halved production incidents',
      ],
    },
    {
      company: 'Cobalt Commerce',
      position: 'Senior Full-Stack Developer',
      startDate: '2015-06',
      endDate: '2018-12',
      achievements: [
        'Rebuilt the storefront from jQuery to React with server-side rendering, improving conversion by 12%',
        'Built a Node.js order and inventory API handling 2M+ orders per year',
        'Optimized PostgreSQL queries and indexes, cutting checkout time by 60%',
        'Mentored 4 junior developers, two of whom grew into senior roles',
      ],
    },
    {
      company: 'Pixel Forge Studio',
      position: 'Full-Stack Developer',
      startDate: '2012-02',
      endDate: '2015-05',
      achievements: [
        'Delivered 20+ client web applications with Node.js, PHP and JavaScript front ends',
        'Created a reusable project template that cut new project setup from a week to a day',
      ],
    },
    {
      company: 'Webcraft Agency',
      position: 'Web Developer',
      startDate: '2010-01',
      endDate: '2012-01',
      achievements: [
        'Built and maintained corporate websites and small e-commerce shops',
        'Automated deployments over SSH, removing manual FTP uploads',
      ],
    },
  ],
  projects: [
    { name: 'cardql', url: 'https://github.com/vadzzim/cardql' },
    {
      name: 'restaurant-pos',
      url: 'https://github.com/vadzzim/restaurant-pos',
    },
    {
      name: 'shopify-production-foundation',
      url: 'https://github.com/vadzzim/shopify-production-foundation',
    },
  ],
} satisfies SeedProfile;
