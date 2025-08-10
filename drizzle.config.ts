import { type Config } from "drizzle-kit";

// import { env } from "@/env";

export default {
  schema: "./worker/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ["propertis_*"],
} satisfies Config;
