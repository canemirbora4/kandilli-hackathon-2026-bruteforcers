-- CreateTable
CREATE TABLE "KandilliRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "isLabeled" BOOLEAN NOT NULL DEFAULT false,
    "boxCoord" TEXT,
    "boxType" TEXT,
    "result" TEXT,
    "isUsable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
