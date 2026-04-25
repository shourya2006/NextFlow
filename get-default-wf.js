const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const workflows = await prisma.workflow.findMany();
  for (const wf of workflows) {
    const nodesStr = JSON.stringify(wf.nodes);
    if (nodesStr && nodesStr.includes('upload-image-1777074068580')) {
      console.log('Found workflow ID:', wf.id);
      fs.writeFileSync('default-workflow-nodes.json', JSON.stringify(wf.nodes, null, 2));
      fs.writeFileSync('default-workflow-edges.json', JSON.stringify(wf.edges, null, 2));
      return;
    }
  }
  console.log('Not found in DB.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
