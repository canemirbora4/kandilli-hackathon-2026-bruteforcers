import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function findTifFiles(dir: string, basePath: string = ""): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTifFiles(fullPath, relativePath));
    } else if (
      entry.name.toLowerCase().endsWith(".tif") ||
      entry.name.toLowerCase().endsWith(".tiff")
    ) {
      results.push(relativePath);
    }
  }
  return results;
}

export async function GET() {
  const chartsDir = path.join(process.cwd(), "public", "data", "charts");
  const files = findTifFiles(chartsDir);

  // Extract metadata from file paths
  const items = files.map((filePath) => {
    const name = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);
    const stats = fs.statSync(path.join(chartsDir, filePath));

    return {
      name,
      path: `data/charts/${filePath}`,
      directory: dir === "." ? "" : dir,
      sizeBytes: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(1),
      modified: stats.mtime.toISOString(),
    };
  });

  return NextResponse.json({
    total: items.length,
    files: items,
  });
}
