"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Circle, Line, Text, Group } from "react-konva";
import Konva from "konva";

// ── Types ──
export type CanvasMode = "startPoint" | "endPoint" | "tracing" | "boundingBox" | "select";

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface BoundingBoxData {
  id: string;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  box_enter: AnnotationPoint | null;
  box_exit: AnnotationPoint | null;
  boxType?: string;
}

export type BoxPointMode = "enter" | "exit" | null;

export interface AnnotationData {
  startPoint: AnnotationPoint | null;
  endPoint: AnnotationPoint | null;
  trajectory: AnnotationPoint[];
  boundingBoxes: BoundingBoxData[];
  imageSize: { width: number; height: number };
}

interface AnnotationCanvasProps {
  imageSrc: string;
  mode: CanvasMode;
  annotationData: AnnotationData;
  onAnnotationChange: (data: Partial<AnnotationData>) => void;
  selectedBoxId: string | null;
  onBoxSelect: (id: string | null) => void;
  boxPointMode: BoxPointMode;
  onBoxPointSet: () => void;
}

const BOX_COLORS: Record<string, string> = {
  Dagilma: "#FF6B6B",
  Siliklik: "#FFA94D",
  KagitDefect: "#FFD43B",
  NoData: "#868E96",
  default: "#3b82f6",
};

// Minimum fraction of the image that must stay visible
const BOUNDARY_KEEP_VISIBLE = 0.2;

export default function AnnotationCanvas({
  imageSrc,
  mode,
  annotationData,
  onAnnotationChange,
  selectedBoxId,
  onBoxSelect,
  boxPointMode,
  onBoxPointSet,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 900, height: 650 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<AnnotationPoint | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<AnnotationPoint | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mousePos, setMousePos] = useState<AnnotationPoint | null>(null);

  // Space-to-Pan: temporary override
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ mx: number; my: number; px: number; py: number } | null>(null);

  // Effective mode: space overrides to "select" (pan)
  const effectiveMode = spaceHeld ? "select" : mode;
  const isPanMode = effectiveMode === "select";

  // ── Load image ──
  useEffect(() => {
    if (!imageSrc) return;
    setImageLoaded(false);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setImageLoaded(true);
      onAnnotationChange({ imageSize: { width: img.width, height: img.height } });
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        const fitZoom = Math.min(cw / img.width, ch / img.height) * 0.95;
        setZoom(fitZoom);
        setPan({
          x: (cw - img.width * fitZoom) / 2,
          y: (ch - img.height * fitZoom) / 2,
        });
      }
    };
    img.onerror = () => setImageLoaded(false);
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Resize ──
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ── [FIX] Block native wheel/gesture on container ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const blockWheel = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation(); };
    const blockGesture = (e: Event) => { e.preventDefault(); };
    el.addEventListener("wheel", blockWheel, { passive: false });
    el.addEventListener("gesturestart", blockGesture);
    el.addEventListener("gesturechange", blockGesture);
    el.addEventListener("gestureend", blockGesture);
    return () => {
      el.removeEventListener("wheel", blockWheel);
      el.removeEventListener("gesturestart", blockGesture);
      el.removeEventListener("gesturechange", blockGesture);
      el.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  // ── Lock body scroll during draw ──
  useEffect(() => {
    if (isDrawing) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => { document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, [isDrawing]);

  // ── [FEATURE 4] Space-to-Pan keyboard ──
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(false);
        setIsPanning(false);
        setPanStart(null);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ── [FEATURE 2] Clamp pan so ≥20% of image stays visible ──
  const clampPan = useCallback(
    (px: number, py: number): { x: number; y: number } => {
      if (!image) return { x: px, y: py };
      const imgW = image.width * zoom;
      const imgH = image.height * zoom;
      const keepW = imgW * BOUNDARY_KEEP_VISIBLE;
      const keepH = imgH * BOUNDARY_KEEP_VISIBLE;

      const minX = -(imgW - keepW);
      const maxX = stageSize.width - keepW;
      const minY = -(imgH - keepH);
      const maxY = stageSize.height - keepH;

      return {
        x: Math.max(minX, Math.min(maxX, px)),
        y: Math.max(minY, Math.min(maxY, py)),
      };
    },
    [image, zoom, stageSize]
  );

  // ── s2i / i2s ──
  const s2i = useCallback(
    (screenX: number, screenY: number): AnnotationPoint => ({
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    }),
    [pan, zoom]
  );
  const i2s = useCallback(
    (imgX: number, imgY: number): AnnotationPoint => ({
      x: imgX * zoom + pan.x,
      y: imgY * zoom + pan.y,
    }),
    [pan, zoom]
  );

  const getImagePos = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): AnnotationPoint | null => {
      const stage = e.target.getStage();
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      return s2i(pos.x, pos.y);
    },
    [s2i]
  );

  // ── Mouse handlers ──
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();

      // Box enter/exit point setting takes priority
      if (boxPointMode && selectedBoxId) {
        const imgPos = getImagePos(e);
        if (!imgPos) return;
        e.evt.preventDefault();
        const pt = { x: Math.round(imgPos.x), y: Math.round(imgPos.y) };
        const field = boxPointMode === "enter" ? "box_enter" : "box_exit";
        onAnnotationChange({
          boundingBoxes: annotationData.boundingBoxes.map((b) =>
            b.id === selectedBoxId ? { ...b, [field]: pt } : b
          ),
        });
        onBoxPointSet();
        return;
      }

      // [FEATURE 1 & 4] Pan mode (select or space-held)
      if (isPanMode) {
        if (pos) {
          setIsPanning(true);
          setPanStart({ mx: pos.x, my: pos.y, px: pan.x, py: pan.y });
        }
        return;
      }

      const imgPos = getImagePos(e);
      if (!imgPos) return;
      e.evt.preventDefault();
      e.evt.stopPropagation();

      switch (effectiveMode) {
        case "startPoint":
          onAnnotationChange({ startPoint: { x: Math.round(imgPos.x), y: Math.round(imgPos.y) } });
          break;
        case "endPoint":
          onAnnotationChange({ endPoint: { x: Math.round(imgPos.x), y: Math.round(imgPos.y) } });
          break;
        case "tracing":
          setIsDrawing(true);
          onAnnotationChange({
            trajectory: [...annotationData.trajectory, { x: Math.round(imgPos.x), y: Math.round(imgPos.y) }],
          });
          break;
        case "boundingBox": {
          const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs?.image;
          if (clickedOnEmpty) {
            onBoxSelect(null);
            setIsDrawing(true);
            setDrawStart({ x: imgPos.x, y: imgPos.y });
            setDrawCurrent({ x: imgPos.x, y: imgPos.y });
          }
          break;
        }
      }
    },
    [boxPointMode, selectedBoxId, annotationData.boundingBoxes, onBoxPointSet, isPanMode, effectiveMode, getImagePos, onAnnotationChange, annotationData.trajectory, onBoxSelect, pan]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();

      // Update mouse position display
      const imgPos = getImagePos(e);
      if (imgPos) setMousePos({ x: Math.round(imgPos.x), y: Math.round(imgPos.y) });

      // Pan drag
      if (isPanning && panStart && pos) {
        const dx = pos.x - panStart.mx;
        const dy = pos.y - panStart.my;
        setPan(clampPan(panStart.px + dx, panStart.py + dy));
        return;
      }

      if (!isDrawing || !imgPos) return;
      e.evt.preventDefault();
      e.evt.stopPropagation();
      e.evt.stopImmediatePropagation();

      if (effectiveMode === "tracing" && e.evt.buttons === 1) {
        onAnnotationChange({
          trajectory: [...annotationData.trajectory, { x: Math.round(imgPos.x), y: Math.round(imgPos.y) }],
        });
      }
      if (effectiveMode === "boundingBox" && drawStart) {
        setDrawCurrent({ x: imgPos.x, y: imgPos.y });
      }
    },
    [isPanning, panStart, isDrawing, effectiveMode, getImagePos, onAnnotationChange, annotationData.trajectory, drawStart, clampPan]
  );

  const handleMouseUp = useCallback(() => {
    // End panning
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (effectiveMode === "boundingBox" && isDrawing && drawStart && drawCurrent) {
      const w = Math.abs(drawCurrent.x - drawStart.x);
      const h = Math.abs(drawCurrent.y - drawStart.y);
      if (w > 10 && h > 10) {
        const newBox: BoundingBoxData = {
          id: `box-${Date.now()}`,
          xmin: Math.round(Math.min(drawStart.x, drawCurrent.x)),
          xmax: Math.round(Math.max(drawStart.x, drawCurrent.x)),
          ymin: Math.round(Math.min(drawStart.y, drawCurrent.y)),
          ymax: Math.round(Math.max(drawStart.y, drawCurrent.y)),
          box_enter: null,
          box_exit: null,
        };
        onAnnotationChange({ boundingBoxes: [...annotationData.boundingBoxes, newBox] });
        onBoxSelect(newBox.id);
      }
    }
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isPanning, effectiveMode, isDrawing, drawStart, drawCurrent, onAnnotationChange, annotationData.boundingBoxes, onBoxSelect]);

  // ── Zoom with damped scroll ──
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;

      const oldZoom = zoom;
      const DAMPING = 0.001;
      const delta = -e.evt.deltaY * DAMPING;
      const newZoom = Math.max(0.05, Math.min(15, oldZoom * (1 + delta)));

      const mouseX = pos.x;
      const mouseY = pos.y;
      const newPanX = mouseX - ((mouseX - pan.x) / oldZoom) * newZoom;
      const newPanY = mouseY - ((mouseY - pan.y) / oldZoom) * newZoom;

      setZoom(newZoom);
      setPan(clampPan(newPanX, newPanY));
    },
    [zoom, pan, clampPan]
  );

  // ── Cursor ──
  const getCursor = () => {
    if (boxPointMode) return "crosshair";
    if (isPanning) return "grabbing";
    if (isPanMode) return "grab";
    if (isDrawing) return "crosshair";
    if (effectiveMode === "tracing")
      return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23f59e0b\" stroke-width=\"2\"><path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/></svg>') 2 18, crosshair";
    return "crosshair";
  };

  // ── Mini-map data ──
  const minimap = (() => {
    if (!image) return null;
    const imgW = image.width * zoom;
    const imgH = image.height * zoom;

    // Mini-map container size
    const mmW = 140;
    const mmH = 90;

    // Scale image to fit mini-map
    const scale = Math.min(mmW / imgW, mmH / imgH) * 0.8;
    const rectW = imgW * scale;
    const rectH = imgH * scale;
    const rectX = (mmW - rectW) / 2;
    const rectY = (mmH - rectH) / 2;

    // Viewport rect in mini-map coords
    const vpX = rectX + (-pan.x / imgW) * rectW;
    const vpY = rectY + (-pan.y / imgH) * rectH;
    const vpW = (stageSize.width / imgW) * rectW;
    const vpH = (stageSize.height / imgH) * rectH;

    return { mmW, mmH, rectX, rectY, rectW, rectH, vpX, vpY, vpW, vpH };
  })();

  // ── Render point helper ──
  const renderPoint = (point: AnnotationPoint | null, color: string, label: string, radius = 7) => {
    if (!point) return null;
    const sp = i2s(point.x, point.y);
    return (
      <Group>
        <Circle x={sp.x} y={sp.y} radius={radius + 3} stroke={color} strokeWidth={2} fill="transparent" />
        <Circle x={sp.x} y={sp.y} radius={radius} fill={color} opacity={0.85} />
        <Text x={sp.x + radius + 6} y={sp.y - 8} text={label} fontSize={12} fontStyle="bold" fill={color} />
        <Text x={sp.x + radius + 6} y={sp.y + 6} text={`${point.x}, ${point.y}`} fontSize={10} fill="rgba(255,255,255,0.7)" fontFamily="JetBrains Mono, monospace" />
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`annotation-canvas-container ${isDrawing ? "is-drawing" : ""} ${isPanning ? "is-panning" : ""}`}
    >
      {/* Coordinate bar */}
      <div className="canvas-coords-bar">
        <span className="canvas-coords-mode">
          {effectiveMode === "startPoint" && "🟢 Başlangıç Noktası"}
          {effectiveMode === "endPoint" && "🔴 Bitiş Noktası"}
          {effectiveMode === "tracing" && "✏️ Veri Takibi"}
          {effectiveMode === "boundingBox" && "📦 Bounding Box"}
          {effectiveMode === "select" && (spaceHeld ? "✋ Pan (Space)" : "🔍 Seçim / Pan")}
        </span>
        {mousePos && (
          <span className="canvas-coords-pos">x: {mousePos.x} &nbsp; y: {mousePos.y}</span>
        )}
        <span className="canvas-coords-zoom">{Math.round(zoom * 100)}%</span>
        {image && <span className="canvas-coords-size">{image.width}×{image.height}px</span>}
        {isDrawing && <span className="canvas-coords-drawing">● REC</span>}
        {spaceHeld && !isDrawing && <span className="canvas-coords-space">SPACE</span>}
      </div>

      {/* Loading */}
      {!imageLoaded && imageSrc && (
        <div className="chart-viewer-loading">
          <div className="loading-spinner" />
          <span>Görüntü yükleniyor...</span>
        </div>
      )}

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: getCursor() }}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={pan.x}
              y={pan.y}
              width={image.width * zoom}
              height={image.height * zoom}
            />
          )}

          {/* Bounding boxes */}
          {annotationData.boundingBoxes.map((box) => {
            const tl = i2s(box.xmin, box.ymin);
            const boxW = (box.xmax - box.xmin) * zoom;
            const boxH = (box.ymax - box.ymin) * zoom;
            const color = BOX_COLORS[box.boxType || "default"] || BOX_COLORS.default;
            const isSel = box.id === selectedBoxId;
            return (
              <React.Fragment key={box.id}>
                <Rect x={tl.x} y={tl.y} width={boxW} height={boxH}
                  stroke={color} strokeWidth={isSel ? 3 : 2} dash={isSel ? [] : [8, 4]}
                  fill={isSel ? `${color}22` : "transparent"}
                  onClick={() => onBoxSelect(box.id)} onTap={() => onBoxSelect(box.id)} />
                {box.boxType && (
                  <Text x={tl.x} y={tl.y - 18} text={box.boxType} fontSize={12} fontStyle="bold" fill={color} />
                )}
                {/* Box enter point — yellow */}
                {box.box_enter && (() => {
                  const ep = i2s(box.box_enter.x, box.box_enter.y);
                  return (
                    <Group>
                      <Circle x={ep.x} y={ep.y} radius={6} fill="#eab308" opacity={0.9} />
                      <Circle x={ep.x} y={ep.y} radius={8} stroke="#eab308" strokeWidth={1.5} fill="transparent" />
                      <Text x={ep.x + 10} y={ep.y - 6} text="IN" fontSize={10} fontStyle="bold" fill="#eab308" />
                    </Group>
                  );
                })()}
                {/* Box exit point — purple */}
                {box.box_exit && (() => {
                  const xp = i2s(box.box_exit.x, box.box_exit.y);
                  return (
                    <Group>
                      <Circle x={xp.x} y={xp.y} radius={6} fill="#a855f7" opacity={0.9} />
                      <Circle x={xp.x} y={xp.y} radius={8} stroke="#a855f7" strokeWidth={1.5} fill="transparent" />
                      <Text x={xp.x + 10} y={xp.y - 6} text="OUT" fontSize={10} fontStyle="bold" fill="#a855f7" />
                    </Group>
                  );
                })()}
              </React.Fragment>
            );
          })}

          {/* Drawing preview */}
          {isDrawing && drawStart && drawCurrent && effectiveMode === "boundingBox" && (
            <Rect
              x={i2s(Math.min(drawStart.x, drawCurrent.x), Math.min(drawStart.y, drawCurrent.y)).x}
              y={i2s(Math.min(drawStart.x, drawCurrent.x), Math.min(drawStart.y, drawCurrent.y)).y}
              width={Math.abs(drawCurrent.x - drawStart.x) * zoom}
              height={Math.abs(drawCurrent.y - drawStart.y) * zoom}
              stroke="#3b82f6" strokeWidth={2} dash={[6,3]} fill="rgba(59,130,246,0.08)" />
          )}

          {renderPoint(annotationData.startPoint, "#10b981", "START")}
          {renderPoint(annotationData.endPoint, "#ef4444", "END")}

          {annotationData.trajectory.length > 1 && (
            <Line
              points={annotationData.trajectory.flatMap((p) => { const sp = i2s(p.x, p.y); return [sp.x, sp.y]; })}
              stroke="#f59e0b" strokeWidth={2.5} lineCap="round" lineJoin="round" opacity={0.9} />
          )}
          {annotationData.trajectory.filter((_, i) => i % 10 === 0).map((p, i) => {
            const sp = i2s(p.x, p.y);
            return <Circle key={i} x={sp.x} y={sp.y} radius={3} fill="#f59e0b" opacity={0.6} />;
          })}
        </Layer>
      </Stage>

      {/* Mini-map */}
      {minimap && image && (
        <div className="canvas-minimap" style={{ width: minimap.mmW, height: minimap.mmH }}>
          {/* Image outline */}
          <div
            className="minimap-image"
            style={{
              left: minimap.rectX, top: minimap.rectY,
              width: minimap.rectW, height: minimap.rectH,
            }}
          />
          {/* Viewport rect */}
          <div
            className="minimap-viewport"
            style={{
              left: Math.max(0, minimap.vpX),
              top: Math.max(0, minimap.vpY),
              width: Math.min(minimap.vpW, minimap.mmW),
              height: Math.min(minimap.vpH, minimap.mmH),
            }}
          />
        </div>
      )}
    </div>
  );
}
