-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KandilliRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "isLabeled" BOOLEAN NOT NULL DEFAULT false,
    "isBackground" BOOLEAN NOT NULL DEFAULT false,
    "boxCoord" TEXT,
    "boxType" TEXT,
    "result" TEXT,
    "isUsable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_KandilliRecord" ("boxCoord", "boxType", "createdAt", "id", "interval", "isLabeled", "isUsable", "path", "result", "timestamp", "type") SELECT "boxCoord", "boxType", "createdAt", "id", "interval", "isLabeled", "isUsable", "path", "result", "timestamp", "type" FROM "KandilliRecord";
DROP TABLE "KandilliRecord";
ALTER TABLE "new_KandilliRecord" RENAME TO "KandilliRecord";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
