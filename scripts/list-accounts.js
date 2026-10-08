const { request } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function main() {
  const envFile = 'storage-state.dev.json';
  const raw = fs.readFileSync(path.resolve(__dirname, '..', envFile), 'utf-8');
  const state = JSON.parse(raw);
  const cookies = state.cookies || [];
  const tokenCookie = cookies.find(c => c.name === 'access-token');
  
  const ctx = await request.newContext({
    baseURL: 'https://dev-app.getcount.com',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenCookie.value}`
    }
  });

  // Get workspaces
  const wsRes = await ctx.get('/api/workspaces');
  const wsData = await wsRes.json();
  const ws = wsData.find(w => w.name === 'Playwright AJ');
  if (!ws) throw new Error("Workspace not found");
  
  const wsId = ws.id;
  
  console.log("Workspace ID:", wsId);

  // List accounts
  const accRes = await ctx.get(`/api/accounts?wsId=${wsId}`);
  const accData = await accRes.json();
  
  console.log("Accounts:");
  console.log(accData.map(a => `${a.number}: ${a.name} (type: ${a.type}, subType: ${a.subType})`).join('\n'));
}

main().catch(console.error);
