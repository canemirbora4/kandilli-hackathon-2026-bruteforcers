"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Text, Line } from "react-konva";
import Konva from "konva";

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  boxType?: string;
  isUsable?: boolean;
  isBackground?: boolean;
}

interface TracingPoint {
  x: number;
  y: number;
}

interface BoundingBoxEditorProps {
  imageSrc: string;
  boxes: BoundingBox[];
  onBoxCreate: (box: Omit<BoundingBox, "id">) => void;
  onBoxSelect: (box: BoundingBox | null) => void;
  onBoxUpdate: (id: string, updates: Partial<BoundingBox>) => void;
  selectedBoxId: string | null;
  tracingMode: boolean;
  tracingPoints: TracingPoint[];
  onTracingPoint: (point: TracingPoint) => void;
}

const BOX_COLORS: Record<string, string> = {
  Dagilma: "#FF6B6B",
  Siliklik: "#FFA94D",
  KagitDefect: "#FFD43B",
  NoData: "#868E96",
  default: "#51CF66",
};

export default function BoundingBoxEditor({
  imageSrc,
  boxes,
  onBoxCreate,
  onBoxSelect,
  onBoxUpdate,
  selectedBoxId,
  tracingMode,
  tracingPoints,
  onTracingPoint,
}: BoundingBoxEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setImageLoaded(true);
    };
    img.onerror = () => setImageLoaded(false);
    img.src = imageSrc;
  }, [imageSrc]);

  // Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        setStageSize({ width: w, height: h });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Calculate image scale to fit
  const imgScale = image
    ? Math.min(stageSize.width / image.width, stageSize.height / image.height)
    : 1;
  const imgX = image ? (stageSize.width - image.width * imgScale) / 2 : 0;
  const imgY = image ? (stageSize.height - image.height * imgScale) / 2 : 0;

  // Convert stage coords to image coords
  const stageToImage = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - imgX) / imgScale,
      y: (sy - imgY) / imgScale,
    }),
    [imgX, imgY, imgScale]
  );

  // Convert image coords to stage coords
  const imageToStage = useCallback(
    (ix: number, iy: number) => ({
      x: ix * imgScale + imgX,
      y: iy * imgScale + imgY,
    }),
    [imgX, imgY, imgScale]
  );

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tracingMode) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        const imgPos = stageToImage(pos.x, pos.y);
        onTracingPoint(imgPos);
      }
      return;
    }

    // Only start drawing on empty area
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs?.image;
    if (!clickedOnEmpty) return;

    onBoxSelect(null);
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    const imgPos = stageToImage(pos.x, pos.y);
    setNewBox({ x: imgPos.x, y: imgPos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tracingMode) {
      const stage = e.target.getStage();
      if (stage) {
        const pos = stage.getPointerPosition();
        if (pos && e.evt.buttons === 1) {
          const imgPos = stageToImage(pos.x, pos.y);
          onTracingPoint(imgPos);
        }
      }
      return;
    }

    if (!isDrawing || !newBox) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const imgPos = stageToImage(pos.x, pos.y);
    setNewBox({
      ...newBox,
      width: imgPos.x - newBox.x,
      height: imgPos.y - newBox.y,
    });
  };

  const handleMouseUp = () => {
    if (tracingMode) return;
    if (isDrawing && newBox) {
      const w = Math.abs(newBox.width);
      const h = Math.abs(newBox.height);
      if (w > 5 && h > 5) {
        onBoxCreate({
          x: Math.min(newBox.x, newBox.x + newBox.width),
          y: Math.min(newBox.y, newBox.y + newBox.height),
          width: w,
          height: h,
        });
      }
      setNewBox(null);
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const newScale = e.evt.deltaY > 0 ? scale * 0.9 : scale * 1.1;
    setScale(Math.max(0.2, Math.min(5, newScale)));
  };

  return (
    <div ref={containerRef} className="bb-editor-container">
      {!imageLoaded && (
        <div className="chart-viewer-loading">
          <div className="loading-spinner" />
          <span>Görüntü yükleniyor...</span>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: tracingMode ? "crosshair" : isDrawing ? "crosshair" : "default" }}
      >
        <Layer>
          {/* Image */}
          {image && (
            <KonvaImage
              image={image}
              x={imgX / scale}
              y={imgY / scale}
              width={image.width * imgScale / scale}
              height={image.height * imgScale / scale}
            />
          )}

          {/* Existing boxes */}
          {boxes.map((box) => {
            const pos = imageToStage(box.x, box.y);
            const color = BOX_COLORS[box.boxType || "default"] || BOX_COLORS.default;
            const isSelected = box.id === selectedBoxId;
            return (
              <React.Fragment key={box.id}>
                <Rect
                  x={pos.x / scale}
                  y={pos.y / scale}
                  width={(box.width * imgScale) / scale}
                  height={(box.height * imgScale) / scale}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  dash={isSelected ? [] : [8, 4]}
                  fill={isSelected ? `${color}22` : "transparent"}
                  onClick={() => onBoxSelect(box)}
                  onTap={() => onBoxSelect(box)}
                />
                {box.boxType && (
                  <Text
                    x={pos.x / scale}
                    y={pos.y / scale - 18}
                    text={box.boxType}
                    fontSize={12}
                    fontStyle="bold"
                    fill={color}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Drawing preview */}
          {newBox && (
            <Rect
              x={(Math.min(newBox.x, newBox.x + newBox.width) * imgScale + imgX) / scale}
              y={(Math.min(newBox.y, newBox.y + newBox.height) * imgScale + imgY) / scale}
              width={(Math.abs(newBox.width) * imgScale) / scale}
              height={(Math.abs(newBox.height) * imgScale) / scale}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[6, 3]}
              fill="rgba(59, 130, 246, 0.1)"
            />
          )}

          {/* Tracing line */}
          {tracingPoints.length > 1 && (
            <Line
              points={tracingPoints.flatMap((p) => {
                const sp = imageToStage(p.x, p.y);
                return [sp.x / scale, sp.y / scale];
              })}
              stroke="#10b981"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
