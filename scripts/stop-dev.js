/**
 * Stop Next.js dev servers on ports 3000/3001 (Windows).
 * Ctrl+C often leaves the child node process running; this cleans it up.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ports = [3000, 3001];

for (const port of ports) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.includes("LISTENING")) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      console.log(`Stopping PID ${pid} on port ${port}`);
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        /* already gone */
      }
    }
    if (pids.size === 0) {
      console.log(`Port ${port} is already free`);
    }
  } catch {
    console.log(`Port ${port} is already free`);
  }
}

const lock = path.join(__dirname, "..", ".next", "dev", "lock");
if (fs.existsSync(lock)) {
  fs.unlinkSync(lock);
  console.log("Removed .next/dev/lock");
}

console.log("Done.");
