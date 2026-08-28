import { readFile } from "node:fs/promises";

export async function loadLocalEnv() {
  for (const filename of [".env.development.local", ".env.vercel.local", ".env.local"]) {
    try {
      const source = await readFile(filename, "utf8");
      for (const line of source.split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!match || process.env[match[1]]) continue;
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[match[1]] = value.replace(/\\n/g, "\n");
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}
