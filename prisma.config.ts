// Prisma 7+ config — datasource URL moved out of schema.prisma into a TS config file
// so adapter-based connections (like Neon serverless) can be wired up cleanly.

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
