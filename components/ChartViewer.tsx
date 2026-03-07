"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

interface BoxCoord {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ChartViewerProps {
  src: string;
  boxCoord?: number[] | null;
  boxType?: string | null;
  alt?: string;
}

const BOX_COLORS: Record<string, string> = {
  Dagilma: "#FF6B6B",
  Siliklik: "#FFA94D",
  KagitDefect: "#FFD43B",
  default: "#51CF66",
};

export default function ChartViewer({
  src,
  boxCoord,
  boxType,
  alt = "Kandilli Grafik Kağıdı",
}: ChartViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !loaded) return;

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding box if coordinates provided
    if (boxCoord && boxCoord.length === 4) {
      const [bx, by, bw, bh] = boxCoord;

      // Scale box coordinates to displayed image size
      const scaleX = (containerWidth * zoom) / naturalSize.w;
      const scaleY = (containerHeight * zoom) / naturalSize.h;

      const drawX = bx * scaleX + pan.x;
      const drawY = by * scaleY + pan.y;
      const drawW = bw * scaleX;
      const drawH = bh * scaleY;

      const color = boxType
        ? BOX_COLORS[boxType] || BOX_COLORS.default
        : BOX_COLORS.default;

      // Box outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(drawX, drawY, drawW, drawH);

      // Corner marks
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      const cornerLen = 16;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + cornerLen);
      ctx.lineTo(drawX, drawY);
      ctx.lineTo(drawX + cornerLen, drawY);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(drawX + drawW - cornerLen, drawY);
      ctx.lineTo(drawX + drawW, drawY);
      ctx.lineTo(drawX + drawW, drawY + cornerLen);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + drawH - cornerLen);
      ctx.lineTo(drawX, drawY + drawH);
      ctx.lineTo(drawX + cornerLen, drawY + drawH);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(drawX + drawW - cornerLen, drawY + drawH);
      ctx.lineTo(drawX + drawW, drawY + drawH);
      ctx.lineTo(drawX + drawW, drawY + drawH - cornerLen);
      ctx.stroke();

      // Label
      if (boxType) {
        ctx.font = "600 13px 'Inter', system-ui, sans-serif";
        const textWidth = ctx.measureText(boxType).width;
        const labelPadX = 10;
        const labelPadY = 6;
        const labelH = 24;

        // Label background
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(
          drawX,
          drawY - labelH - 4,
          textWidth + labelPadX * 2,
          labelH,
          [4, 4, 0, 0]
        );
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label text
        ctx.fillStyle = "#fff";
        ctx.fillText(boxType, drawX + labelPadX, drawY - labelPadY - 4);
      }
    }
  }, [boxCoord, boxType, loaded, zoom, pan, naturalSize]);

  useEffect(() => {
    drawOverlay();
    window.addEventListener("resize", drawOverlay);
    return () => window.removeEventListener("resize", drawOverlay);
  }, [drawOverlay]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.2, Math.min(5, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="chart-viewer-wrapper">
      {/* Toolbar */}
      <div className="chart-viewer-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
            className="toolbar-btn"
            title="Yakınlaştır"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.25))}
            className="toolbar-btn"
            title="Uzaklaştır"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button onClick={resetView} className="toolbar-btn" title="Sıfırla">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
        {boxType && (
          <div className="toolbar-badge" style={{ background: BOX_COLORS[boxType] || BOX_COLORS.default }}>
            {boxType}
          </div>
        )}
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="chart-viewer-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {!loaded && !error && (
          <div className="chart-viewer-loading">
            <div className="loading-spinner" />
            <span>Grafik kağıdı yükleniyor...</span>
          </div>
        )}
        {error && (
          <div className="chart-viewer-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>Görüntü yüklenemedi</span>
            <span className="error-hint">TIF dosyasının public/data/charts/ altında olduğundan emin olun</span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            setLoaded(true);
          }}
          onError={() => setError(true)}
          className="chart-viewer-image"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            opacity: loaded ? 1 : 0,
          }}
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="chart-viewer-canvas"
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
