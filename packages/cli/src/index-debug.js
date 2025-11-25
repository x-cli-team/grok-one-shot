#!/usr/bin/env node

console.log("🚀 grok-one-shotDebug - Starting...");
console.log("📂 Directory:", process.cwd());
console.log("🖥️  Node:", process.version);
console.log("📦 Version:", require("../package.json").version);
console.log("🔑 API Key:", process.env.GROK_API_KEY ? "✅ Found" : "❌ Missing");

if (!process.env.GROK_API_KEY) {
  console.error("❌ Set GROK_API_KEY environment variable");
  process.exit(1);
}

console.log("✅ CLI working!");
