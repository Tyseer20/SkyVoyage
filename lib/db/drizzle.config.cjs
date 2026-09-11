/** @type { import('drizzle-kit').Config } */
module.exports = {
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_IBrHeFY6T5Jt@ep-lively-grass-axysjich-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
};