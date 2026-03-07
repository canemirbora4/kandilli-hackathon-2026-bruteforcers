import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Tek kayıt
  if (id) {
    const record = await prisma.kandilliRecord.findUnique({
      where: { id: parseInt(id) },
    });
    if (!record) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({
      ...record,
      boxCoord: record.boxCoord ? JSON.parse(record.boxCoord) : null,
      result: record.result ? JSON.parse(record.result) : null,
    });
  }

  // Liste — filtreli
  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (search) where.timestamp = { contains: search };

  const [records, total] = await Promise.all([
    prisma.kandilliRecord.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: "desc" },
    }),
    prisma.kandilliRecord.count({ where }),
  ]);

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      boxCoord: r.boxCoord ? JSON.parse(r.boxCoord) : null,
      result: r.result ? JSON.parse(r.result) : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
