import { z } from "zod";

// ─── Workflow Schemas ───

export const workflowCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long").default("Untitled"),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

export const workflowUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

export const workflowRenameSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(100, "Title too long"),
});

// ─── Workflow Run Schema ───

export const workflowRunSchema = z.object({
  startNodeId: z.string().min(1, "Start node ID is required"),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string().optional(),
      data: z.record(z.string(), z.any()),
      position: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional(),
    })
  ).min(1, "At least one node is required"),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().nullable().optional(),
      targetHandle: z.string().nullable().optional(),
    })
  ).default([]),
});

// ─── Type Exports ───

export type WorkflowCreate = z.infer<typeof workflowCreateSchema>;
export type WorkflowUpdate = z.infer<typeof workflowUpdateSchema>;
export type WorkflowRename = z.infer<typeof workflowRenameSchema>;
export type WorkflowRun = z.infer<typeof workflowRunSchema>;
