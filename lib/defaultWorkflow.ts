import fs from "fs/promises";
import path from "path";

/** The template shown for a user's default workflow until they save their own. */
export async function readDefaultWorkflow() {
  const nodesData = await fs.readFile(path.join(process.cwd(), "data", "nodes.json"), "utf-8");
  const edgesData = await fs.readFile(path.join(process.cwd(), "data", "edges.json"), "utf-8");
  return { nodes: JSON.parse(nodesData), edges: JSON.parse(edgesData) };
}
