import { defineConfig } from "@trigger.dev/sdk/v3";
import { ffmpeg } from "@trigger.dev/build/extensions/core";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  project: "proj_hnyincfsrunoluraiuuk",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [ffmpeg()],
  },
  dirs: ["trigger"],
});
