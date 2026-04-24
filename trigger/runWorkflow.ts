import { logger, task } from "@trigger.dev/sdk/v3";

export const runWorkflow = task({
  id: "workflow-run",
  run: async (payload: any) => {
    logger.log("Workflow received:", payload);
    return { success: true };
  },
});
