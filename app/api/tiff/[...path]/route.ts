import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(process.cwd(), "public", ...segments);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `Dosya bulunamadı: ${segments.join("/")}` },
      { status: 404 }
    );
  }

  try {
    const pngBuffer = await sharp(filePath).png({ quality: 85 }).toBuffer();

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Length": pngBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("TIFF dönüşüm hatası:", err);
    return NextResponse.json(
      { error: "Görüntü dönüştürülemedi" },
      { status: 500 }
    );
  }
}
