import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface SeedRecord {
  path: string;
  type: string;
  timestamp: string;
  interval: string;
  isLabeled: boolean;
  boxCoord: number[] | null;
  boxType: string | null;
  result: Record<string, unknown> | null;
  isUsable: boolean;
}

async function main() {
  const seedFile = path.join(__dirname, "seed-data.json");

  if (!fs.existsSync(seedFile)) {
    console.error(`❌ Seed dosyası bulunamadı: ${seedFile}`);
    console.log("   prisma/seed-data.json dosyasını oluşturun.");
    process.exit(1);
  }

  const raw = fs.readFileSync(seedFile, "utf-8");
  const records: SeedRecord[] = JSON.parse(raw);

  console.log(`📦 ${records.length} kayıt yükleniyor...`);

  for (const record of records) {
    await prisma.kandilliRecord.create({
      data: {
        path: record.path,
        type: record.type,
        timestamp: record.timestamp,
        interval: record.interval,
        isLabeled: record.isLabeled,
        boxCoord: record.boxCoord ? JSON.stringify(record.boxCoord) : null,
        boxType: record.boxType ?? null,
        result: record.result ? JSON.stringify(record.result) : null,
        isUsable: record.isUsable,
      },
    });
  }

  console.log(`✅ ${records.length} kayıt başarıyla yüklendi.`);
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
