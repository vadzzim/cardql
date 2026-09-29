import 'dotenv/config';

const TEST_DATABASE = 'cardql_test';

function testDatabaseUrl(): string {
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) {
    throw new Error('DATABASE_URL must be set to derive the e2e database URL');
  }

  const url = new URL(devUrl);
  url.pathname = `/${TEST_DATABASE}`;
  return url.toString();
}

export const testEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: testDatabaseUrl(),
};
