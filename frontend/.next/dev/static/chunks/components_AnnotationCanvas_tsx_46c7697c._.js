(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/AnnotationCanvas.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AnnotationCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonva$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-konva/es/ReactKonva.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-konva/es/ReactKonvaCore.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const BOX_COLORS = {
    Dagilma: "#FF6B6B",
    Siliklik: "#FFA94D",
    KagitDefect: "#FFD43B",
    NoData: "#868E96",
    default: "#3b82f6"
};
// Minimum fraction of the image that must stay visible
const BOUNDARY_KEEP_VISIBLE = 0.2;
function AnnotationCanvas({ imageSrc, overlayImageSrc, mode, annotationData, onAnnotationChange, selectedBoxId, onBoxSelect, boxPointMode, onBoxPointSet }) {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const stageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [image, setImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [stageSize, setStageSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        width: 900,
        height: 650
    });
    const [zoom, setZoom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [pan, setPan] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [isDrawing, setIsDrawing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [drawStart, setDrawStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [drawCurrent, setDrawCurrent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [imageLoaded, setImageLoaded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mousePos, setMousePos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [overlayImage, setOverlayImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Space-to-Pan: temporary override
    const [spaceHeld, setSpaceHeld] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isPanning, setIsPanning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [panStart, setPanStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Effective mode: space overrides to "select" (pan)
    const effectiveMode = spaceHeld ? "select" : mode;
    const isPanMode = effectiveMode === "select";
    // ── Load image ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotationCanvas.useEffect": ()=>{
            if (!imageSrc) return;
            setImageLoaded(false);
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = ({
                "AnnotationCanvas.useEffect": ()=>{
                    setImage(img);
                    setImageLoaded(true);
                    onAnnotationChange({
                        imageSize: {
                            width: img.width,
                            height: img.height
                        }
                    });
                    if (containerRef.current) {
                        const cw = containerRef.current.clientWidth;
                        const ch = containerRef.current.clientHeight;
                        const fitZoom = Math.min(cw / img.width, ch / img.height) * 0.95;
                        setZoom(fitZoom);
                        setPan({
                            x: (cw - img.width * fitZoom) / 2,
                            y: (ch - img.height * fitZoom) / 2
                        });
                    }
                }
            })["AnnotationCanvas.useEffect"];
            img.onerror = ({
                "AnnotationCanvas.useEffect": ()=>setImageLoaded(false)
            })["AnnotationCanvas.useEffect"];
            img.src = imageSrc;
        }
    }["AnnotationCanvas.useEffect"], [
        imageSrc
    ]);
    // ── Load overlay image ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotationCanvas.useEffect": ()=>{
            if (!overlayImageSrc) {
                setOverlayImage(null);
                return;
            }
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = ({
                "AnnotationCanvas.useEffect": ()=>setOverlayImage(img)
            })["AnnotationCanvas.useEffect"];
            img.onerror = ({
                "AnnotationCanvas.useEffect": ()=>setOverlayImage(null)
            })["AnnotationCanvas.useEffect"];
            img.src = overlayImageSrc;
        }
    }["AnnotationCanvas.useEffect"], [
        overlayImageSrc
    ]);
    // ── Resize ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotationCanvas.useEffect": ()=>{
            const updateSize = {
                "AnnotationCanvas.useEffect.updateSize": ()=>{
                    if (containerRef.current) {
                        setStageSize({
                            width: containerRef.current.clientWidth,
                            height: containerRef.current.clientHeight
                        });
                    }
                }
            }["AnnotationCanvas.useEffect.updateSize"];
            updateSize();
            window.addEventListener("resize", updateSize);
            return ({
                "AnnotationCanvas.useEffect": ()=>window.removeEventListener("resize", updateSize)
            })["AnnotationCanvas.useEffect"];
        }
    }["AnnotationCanvas.useEffect"], []);
    // ── [FIX] Block native wheel/gesture on container ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotationCanvas.useEffect": ()=>{
            const el = containerRef.current;
            if (!el) return;
            const blockWheel = {
                "AnnotationCanvas.useEffect.blockWheel": (e)=>{
                    e.preventDefault();
                    e.stopPropagation();
                }
            }["AnnotationCanvas.useEffect.blockWheel"];
            const blockGesture = {
                "AnnotationCanvas.useEffect.blockGesture": (e)=>{
                    e.preventDefault();
                }
            }["AnnotationCanvas.useEffect.blockGesture"];
            el.addEventListener("wheel", blockWheel, {
                passive: false
            });
            el.addEventListener("gesturestart", blockGesture);
            el.addEventListener("gesturechange", blockGesture);
            el.addEventListener("gestureend", blockGesture);
            return ({
                "AnnotationCanvas.useEffect": ()=>{
                    el.removeEventListener("wheel", blockWheel);
                    el.removeEventListener("gesturestart", blockGesture);
                    el.removeEventListener("gesturechange", blockGesture);
                    el.removeEventListener("gestureend", blockGesture);
                }
            })["AnnotationCanvas.useEffect"];
        }
    }["AnnotationCanvas.useEffect"], []);
    // ── Lock body scroll during draw ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotationCanvas.useEffect": ()=>{
            if (isDrawing) {
                document.body.style.overflow = "hidden";
                document.body.style.touchAction = "none";
            } else {
                document.body.style.overflow = "";
                document.body.style.touchAction = "";
            }
            return ({
                "AnnotationCanvas.useEffect": ()=>{
                    document.body.style.overflow = "";
                    document.body.style.touchAction = "";
                }
            })["AnnotationCanvas.useEffect"];
        }
    }["AnnotationCanvas.useEffect"], [
        isDrawing
    ]);
    // ── [FEATURE 4] Space-to-Pan keyboard ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotationCanvas.useEffect": ()=>{
            const down = {
                "AnnotationCanvas.useEffect.down": (e)=>{
                    if (e.code === "Space" && !e.repeat) {
                        e.preventDefault();
                        setSpaceHeld(true);
                    }
                }
            }["AnnotationCanvas.useEffect.down"];
            const up = {
                "AnnotationCanvas.useEffect.up": (e)=>{
                    if (e.code === "Space") {
                        e.preventDefault();
                        setSpaceHeld(false);
                        setIsPanning(false);
                        setPanStart(null);
                    }
                }
            }["AnnotationCanvas.useEffect.up"];
            window.addEventListener("keydown", down);
            window.addEventListener("keyup", up);
            return ({
                "AnnotationCanvas.useEffect": ()=>{
                    window.removeEventListener("keydown", down);
                    window.removeEventListener("keyup", up);
                }
            })["AnnotationCanvas.useEffect"];
        }
    }["AnnotationCanvas.useEffect"], []);
    // ── [FEATURE 2] Clamp pan so ≥20% of image stays visible ──
    const clampPan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[clampPan]": (px, py)=>{
            if (!image) return {
                x: px,
                y: py
            };
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
                y: Math.max(minY, Math.min(maxY, py))
            };
        }
    }["AnnotationCanvas.useCallback[clampPan]"], [
        image,
        zoom,
        stageSize
    ]);
    // ── s2i / i2s ──
    const s2i = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[s2i]": (screenX, screenY)=>({
                x: (screenX - pan.x) / zoom,
                y: (screenY - pan.y) / zoom
            })
    }["AnnotationCanvas.useCallback[s2i]"], [
        pan,
        zoom
    ]);
    const i2s = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[i2s]": (imgX, imgY)=>({
                x: imgX * zoom + pan.x,
                y: imgY * zoom + pan.y
            })
    }["AnnotationCanvas.useCallback[i2s]"], [
        pan,
        zoom
    ]);
    const getImagePos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[getImagePos]": (e)=>{
            const stage = e.target.getStage();
            if (!stage) return null;
            const pos = stage.getPointerPosition();
            if (!pos) return null;
            return s2i(pos.x, pos.y);
        }
    }["AnnotationCanvas.useCallback[getImagePos]"], [
        s2i
    ]);
    // ── Mouse handlers ──
    const handleMouseDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[handleMouseDown]": (e)=>{
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();
            // Box enter/exit point setting takes priority
            if (boxPointMode && selectedBoxId) {
                const imgPos = getImagePos(e);
                if (!imgPos) return;
                e.evt.preventDefault();
                const pt = {
                    x: Math.round(imgPos.x),
                    y: Math.round(imgPos.y)
                };
                const field = boxPointMode === "enter" ? "box_enter" : "box_exit";
                onAnnotationChange({
                    boundingBoxes: annotationData.boundingBoxes.map({
                        "AnnotationCanvas.useCallback[handleMouseDown]": (b)=>b.id === selectedBoxId ? {
                                ...b,
                                [field]: pt
                            } : b
                    }["AnnotationCanvas.useCallback[handleMouseDown]"])
                });
                onBoxPointSet();
                return;
            }
            // [FEATURE 1 & 4] Pan mode (select or space-held)
            if (isPanMode) {
                if (pos) {
                    setIsPanning(true);
                    setPanStart({
                        mx: pos.x,
                        my: pos.y,
                        px: pan.x,
                        py: pan.y
                    });
                }
                return;
            }
            const imgPos = getImagePos(e);
            if (!imgPos) return;
            e.evt.preventDefault();
            e.evt.stopPropagation();
            switch(effectiveMode){
                case "startPoint":
                    onAnnotationChange({
                        startPoint: {
                            x: Math.round(imgPos.x),
                            y: Math.round(imgPos.y)
                        }
                    });
                    break;
                case "endPoint":
                    onAnnotationChange({
                        endPoint: {
                            x: Math.round(imgPos.x),
                            y: Math.round(imgPos.y)
                        }
                    });
                    break;
                case "tracing":
                    setIsDrawing(true);
                    onAnnotationChange({
                        trajectory: [
                            ...annotationData.trajectory,
                            {
                                x: Math.round(imgPos.x),
                                y: Math.round(imgPos.y)
                            }
                        ]
                    });
                    break;
                case "boundingBox":
                    {
                        const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs?.image;
                        if (clickedOnEmpty) {
                            onBoxSelect(null);
                            setIsDrawing(true);
                            setDrawStart({
                                x: imgPos.x,
                                y: imgPos.y
                            });
                            setDrawCurrent({
                                x: imgPos.x,
                                y: imgPos.y
                            });
                        }
                        break;
                    }
            }
        }
    }["AnnotationCanvas.useCallback[handleMouseDown]"], [
        boxPointMode,
        selectedBoxId,
        annotationData.boundingBoxes,
        onBoxPointSet,
        isPanMode,
        effectiveMode,
        getImagePos,
        onAnnotationChange,
        annotationData.trajectory,
        onBoxSelect,
        pan
    ]);
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[handleMouseMove]": (e)=>{
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();
            // Update mouse position display
            const imgPos = getImagePos(e);
            if (imgPos) setMousePos({
                x: Math.round(imgPos.x),
                y: Math.round(imgPos.y)
            });
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
                    trajectory: [
                        ...annotationData.trajectory,
                        {
                            x: Math.round(imgPos.x),
                            y: Math.round(imgPos.y)
                        }
                    ]
                });
            }
            if (effectiveMode === "boundingBox" && drawStart) {
                setDrawCurrent({
                    x: imgPos.x,
                    y: imgPos.y
                });
            }
        }
    }["AnnotationCanvas.useCallback[handleMouseMove]"], [
        isPanning,
        panStart,
        isDrawing,
        effectiveMode,
        getImagePos,
        onAnnotationChange,
        annotationData.trajectory,
        drawStart,
        clampPan
    ]);
    const handleMouseUp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[handleMouseUp]": ()=>{
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
                    const newBox = {
                        id: `box-${Date.now()}`,
                        xmin: Math.round(Math.min(drawStart.x, drawCurrent.x)),
                        xmax: Math.round(Math.max(drawStart.x, drawCurrent.x)),
                        ymin: Math.round(Math.min(drawStart.y, drawCurrent.y)),
                        ymax: Math.round(Math.max(drawStart.y, drawCurrent.y)),
                        box_enter: null,
                        box_exit: null
                    };
                    onAnnotationChange({
                        boundingBoxes: [
                            ...annotationData.boundingBoxes,
                            newBox
                        ]
                    });
                    onBoxSelect(newBox.id);
                }
            }
            setIsDrawing(false);
            setDrawStart(null);
            setDrawCurrent(null);
        }
    }["AnnotationCanvas.useCallback[handleMouseUp]"], [
        isPanning,
        effectiveMode,
        isDrawing,
        drawStart,
        drawCurrent,
        onAnnotationChange,
        annotationData.boundingBoxes,
        onBoxSelect
    ]);
    // ── Zoom with damped scroll ──
    const handleWheel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotationCanvas.useCallback[handleWheel]": (e)=>{
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
            const newPanX = mouseX - (mouseX - pan.x) / oldZoom * newZoom;
            const newPanY = mouseY - (mouseY - pan.y) / oldZoom * newZoom;
            setZoom(newZoom);
            setPan(clampPan(newPanX, newPanY));
        }
    }["AnnotationCanvas.useCallback[handleWheel]"], [
        zoom,
        pan,
        clampPan
    ]);
    // ── Cursor ──
    const getCursor = ()=>{
        if (boxPointMode) return "crosshair";
        if (isPanning) return "grabbing";
        if (isPanMode) return "grab";
        if (isDrawing) return "crosshair";
        if (effectiveMode === "tracing") return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23f59e0b\" stroke-width=\"2\"><path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/></svg>') 2 18, crosshair";
        return "crosshair";
    };
    // ── Mini-map data ──
    const minimap = (()=>{
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
        const vpX = rectX + -pan.x / imgW * rectW;
        const vpY = rectY + -pan.y / imgH * rectH;
        const vpW = stageSize.width / imgW * rectW;
        const vpH = stageSize.height / imgH * rectH;
        return {
            mmW,
            mmH,
            rectX,
            rectY,
            rectW,
            rectH,
            vpX,
            vpY,
            vpW,
            vpH
        };
    })();
    // ── Render point helper ──
    const renderPoint = (point, color, label, radius = 7)=>{
        if (!point) return null;
        const sp = i2s(point.x, point.y);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                    x: sp.x,
                    y: sp.y,
                    radius: radius + 3,
                    stroke: color,
                    strokeWidth: 2,
                    fill: "transparent"
                }, void 0, false, {
                    fileName: "[project]/components/AnnotationCanvas.tsx",
                    lineNumber: 441,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                    x: sp.x,
                    y: sp.y,
                    radius: radius,
                    fill: color,
                    opacity: 0.85
                }, void 0, false, {
                    fileName: "[project]/components/AnnotationCanvas.tsx",
                    lineNumber: 442,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    x: sp.x + radius + 6,
                    y: sp.y - 8,
                    text: label,
                    fontSize: 12,
                    fontStyle: "bold",
                    fill: color
                }, void 0, false, {
                    fileName: "[project]/components/AnnotationCanvas.tsx",
                    lineNumber: 443,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                    x: sp.x + radius + 6,
                    y: sp.y + 6,
                    text: `${point.x}, ${point.y}`,
                    fontSize: 10,
                    fill: "rgba(255,255,255,0.7)",
                    fontFamily: "JetBrains Mono, monospace"
                }, void 0, false, {
                    fileName: "[project]/components/AnnotationCanvas.tsx",
                    lineNumber: 444,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/AnnotationCanvas.tsx",
            lineNumber: 440,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: `annotation-canvas-container ${isDrawing ? "is-drawing" : ""} ${isPanning ? "is-panning" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "canvas-coords-bar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "canvas-coords-mode",
                        children: [
                            effectiveMode === "startPoint" && "🟢 Başlangıç Noktası",
                            effectiveMode === "endPoint" && "🔴 Bitiş Noktası",
                            effectiveMode === "tracing" && "✏️ Veri Takibi",
                            effectiveMode === "boundingBox" && "📦 Bounding Box",
                            effectiveMode === "select" && (spaceHeld ? "✋ Pan (Space)" : "🔍 Seçim / Pan")
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 456,
                        columnNumber: 9
                    }, this),
                    mousePos && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "canvas-coords-pos",
                        children: [
                            "x: ",
                            mousePos.x,
                            "   y: ",
                            mousePos.y
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 464,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "canvas-coords-zoom",
                        children: [
                            Math.round(zoom * 100),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 466,
                        columnNumber: 9
                    }, this),
                    image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "canvas-coords-size",
                        children: [
                            image.width,
                            "×",
                            image.height,
                            "px"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 467,
                        columnNumber: 19
                    }, this),
                    isDrawing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "canvas-coords-drawing",
                        children: "● REC"
                    }, void 0, false, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 468,
                        columnNumber: 23
                    }, this),
                    spaceHeld && !isDrawing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "canvas-coords-space",
                        children: "SPACE"
                    }, void 0, false, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 469,
                        columnNumber: 37
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnnotationCanvas.tsx",
                lineNumber: 455,
                columnNumber: 7
            }, this),
            !imageLoaded && imageSrc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "chart-viewer-loading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "loading-spinner"
                    }, void 0, false, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 475,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Görüntü yükleniyor..."
                    }, void 0, false, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 476,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnnotationCanvas.tsx",
                lineNumber: 474,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
                ref: stageRef,
                width: stageSize.width,
                height: stageSize.height,
                onMouseDown: handleMouseDown,
                onMouseMove: handleMouseMove,
                onMouseUp: handleMouseUp,
                onWheel: handleWheel,
                style: {
                    cursor: getCursor()
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
                    children: [
                        image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
                            image: overlayImage || image,
                            x: pan.x,
                            y: pan.y,
                            width: image.width * zoom,
                            height: image.height * zoom
                        }, void 0, false, {
                            fileName: "[project]/components/AnnotationCanvas.tsx",
                            lineNumber: 493,
                            columnNumber: 13
                        }, this),
                        annotationData.boundingBoxes.map((box)=>{
                            const tl = i2s(box.xmin, box.ymin);
                            const boxW = (box.xmax - box.xmin) * zoom;
                            const boxH = (box.ymax - box.ymin) * zoom;
                            const color = BOX_COLORS[box.boxType || "default"] || BOX_COLORS.default;
                            const isSel = box.id === selectedBoxId;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Fragment, {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rect"], {
                                        x: tl.x,
                                        y: tl.y,
                                        width: boxW,
                                        height: boxH,
                                        stroke: color,
                                        strokeWidth: isSel ? 3 : 2,
                                        dash: isSel ? [] : [
                                            8,
                                            4
                                        ],
                                        fill: isSel ? `${color}22` : "transparent",
                                        onClick: ()=>onBoxSelect(box.id),
                                        onTap: ()=>onBoxSelect(box.id)
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnnotationCanvas.tsx",
                                        lineNumber: 511,
                                        columnNumber: 17
                                    }, this),
                                    box.boxType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                        x: tl.x,
                                        y: tl.y - 18,
                                        text: box.boxType,
                                        fontSize: 12,
                                        fontStyle: "bold",
                                        fill: color
                                    }, void 0, false, {
                                        fileName: "[project]/components/AnnotationCanvas.tsx",
                                        lineNumber: 516,
                                        columnNumber: 19
                                    }, this),
                                    box.box_enter && (()=>{
                                        const ep = i2s(box.box_enter.x, box.box_enter.y);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                                    x: ep.x,
                                                    y: ep.y,
                                                    radius: 6,
                                                    fill: "#eab308",
                                                    opacity: 0.9
                                                }, void 0, false, {
                                                    fileName: "[project]/components/AnnotationCanvas.tsx",
                                                    lineNumber: 523,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                                    x: ep.x,
                                                    y: ep.y,
                                                    radius: 8,
                                                    stroke: "#eab308",
                                                    strokeWidth: 1.5,
                                                    fill: "transparent"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/AnnotationCanvas.tsx",
                                                    lineNumber: 524,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                    x: ep.x + 10,
                                                    y: ep.y - 6,
                                                    text: "IN",
                                                    fontSize: 10,
                                                    fontStyle: "bold",
                                                    fill: "#eab308"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/AnnotationCanvas.tsx",
                                                    lineNumber: 525,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/AnnotationCanvas.tsx",
                                            lineNumber: 522,
                                            columnNumber: 21
                                        }, this);
                                    })(),
                                    box.box_exit && (()=>{
                                        const xp = i2s(box.box_exit.x, box.box_exit.y);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                                    x: xp.x,
                                                    y: xp.y,
                                                    radius: 6,
                                                    fill: "#a855f7",
                                                    opacity: 0.9
                                                }, void 0, false, {
                                                    fileName: "[project]/components/AnnotationCanvas.tsx",
                                                    lineNumber: 534,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                                    x: xp.x,
                                                    y: xp.y,
                                                    radius: 8,
                                                    stroke: "#a855f7",
                                                    strokeWidth: 1.5,
                                                    fill: "transparent"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/AnnotationCanvas.tsx",
                                                    lineNumber: 535,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                                    x: xp.x + 10,
                                                    y: xp.y - 6,
                                                    text: "OUT",
                                                    fontSize: 10,
                                                    fontStyle: "bold",
                                                    fill: "#a855f7"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/AnnotationCanvas.tsx",
                                                    lineNumber: 536,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/AnnotationCanvas.tsx",
                                            lineNumber: 533,
                                            columnNumber: 21
                                        }, this);
                                    })()
                                ]
                            }, box.id, true, {
                                fileName: "[project]/components/AnnotationCanvas.tsx",
                                lineNumber: 510,
                                columnNumber: 15
                            }, this);
                        }),
                        isDrawing && drawStart && drawCurrent && effectiveMode === "boundingBox" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rect"], {
                            x: i2s(Math.min(drawStart.x, drawCurrent.x), Math.min(drawStart.y, drawCurrent.y)).x,
                            y: i2s(Math.min(drawStart.x, drawCurrent.x), Math.min(drawStart.y, drawCurrent.y)).y,
                            width: Math.abs(drawCurrent.x - drawStart.x) * zoom,
                            height: Math.abs(drawCurrent.y - drawStart.y) * zoom,
                            stroke: "#3b82f6",
                            strokeWidth: 2,
                            dash: [
                                6,
                                3
                            ],
                            fill: "rgba(59,130,246,0.08)"
                        }, void 0, false, {
                            fileName: "[project]/components/AnnotationCanvas.tsx",
                            lineNumber: 546,
                            columnNumber: 13
                        }, this),
                        renderPoint(annotationData.startPoint, "#10b981", "START"),
                        renderPoint(annotationData.endPoint, "#ef4444", "END"),
                        annotationData.trajectory.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Line"], {
                            points: annotationData.trajectory.flatMap((p)=>{
                                const sp = i2s(p.x, p.y);
                                return [
                                    sp.x,
                                    sp.y
                                ];
                            }),
                            stroke: "#f59e0b",
                            strokeWidth: 2.5,
                            lineCap: "round",
                            lineJoin: "round",
                            opacity: 0.9
                        }, void 0, false, {
                            fileName: "[project]/components/AnnotationCanvas.tsx",
                            lineNumber: 558,
                            columnNumber: 13
                        }, this),
                        annotationData.trajectory.filter((_, i)=>i % 10 === 0).map((p, i)=>{
                            const sp = i2s(p.x, p.y);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Circle"], {
                                x: sp.x,
                                y: sp.y,
                                radius: 3,
                                fill: "#f59e0b",
                                opacity: 0.6
                            }, i, false, {
                                fileName: "[project]/components/AnnotationCanvas.tsx",
                                lineNumber: 564,
                                columnNumber: 20
                            }, this);
                        })
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/AnnotationCanvas.tsx",
                    lineNumber: 491,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/AnnotationCanvas.tsx",
                lineNumber: 481,
                columnNumber: 7
            }, this),
            minimap && image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "canvas-minimap",
                style: {
                    width: minimap.mmW,
                    height: minimap.mmH
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "minimap-image",
                        style: {
                            left: minimap.rectX,
                            top: minimap.rectY,
                            width: minimap.rectW,
                            height: minimap.rectH
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 573,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "minimap-viewport",
                        style: {
                            left: Math.max(0, minimap.vpX),
                            top: Math.max(0, minimap.vpY),
                            width: Math.min(minimap.vpW, minimap.mmW),
                            height: Math.min(minimap.vpH, minimap.mmH)
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/AnnotationCanvas.tsx",
                        lineNumber: 581,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/AnnotationCanvas.tsx",
                lineNumber: 571,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/AnnotationCanvas.tsx",
        lineNumber: 450,
        columnNumber: 5
    }, this);
}
_s(AnnotationCanvas, "vuYOSPURJqPB1XPPdyevy0gu66k=");
_c = AnnotationCanvas;
var _c;
__turbopack_context__.k.register(_c, "AnnotationCanvas");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/AnnotationCanvas.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/AnnotationCanvas.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=components_AnnotationCanvas_tsx_46c7697c._.js.map