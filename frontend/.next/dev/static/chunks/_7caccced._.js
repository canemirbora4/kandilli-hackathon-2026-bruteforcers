(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/ExpertSidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildExportJSON",
    ()=>buildExportJSON,
    "default",
    ()=>ExpertSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const BOX_TYPES = [
    "Dagilma",
    "Siliklik",
    "KagitDefect",
    "NoData"
];
const BOX_COLORS = {
    Dagilma: "#FF6B6B",
    Siliklik: "#FFA94D",
    KagitDefect: "#FFD43B",
    NoData: "#868E96"
};
const MODES = [
    {
        key: "select",
        icon: "🔍",
        label: "Seçim / Pan",
        desc: "Kağıdı kaydır veya işaret seç"
    },
    {
        key: "startPoint",
        icon: "🟢",
        label: "Başlangıç",
        desc: "Grafiğin başlangıç noktasını işaretle"
    },
    {
        key: "endPoint",
        icon: "🔴",
        label: "Bitiş",
        desc: "Grafiğin bitiş noktasını işaretle"
    },
    {
        key: "tracing",
        icon: "✏️",
        label: "Veri Takibi",
        desc: "Eğriyi takip ederek çiz"
    },
    {
        key: "boundingBox",
        icon: "📦",
        label: "Sorunlu Alan",
        desc: "Bozukluk alanı dikdörtgenle seç"
    }
];
function buildExportJSON(annotationData, isUsable) {
    const { startPoint, endPoint, trajectory, boundingBoxes, imageSize } = annotationData;
    return {
        start_point: startPoint ? [
            startPoint.x,
            startPoint.y
        ] : null,
        end_point: endPoint ? [
            endPoint.x,
            endPoint.y
        ] : null,
        trajectory: trajectory.map((p)=>[
                p.x,
                p.y
            ]),
        bounding_boxes: boundingBoxes.map((b)=>({
                xmin: b.xmin,
                xmax: b.xmax,
                ymin: b.ymin,
                ymax: b.ymax,
                box_enter: b.box_enter ? [
                    b.box_enter.x,
                    b.box_enter.y
                ] : null,
                box_exit: b.box_exit ? [
                    b.box_exit.x,
                    b.box_exit.y
                ] : null,
                box_type: b.boxType || null
            })),
        is_usable: isUsable,
        image_size: [
            imageSize.width,
            imageSize.height
        ]
    };
}
function ExpertSidebar({ mode, onModeChange, annotationData, onAnnotationChange, onClearCurrent, selectedBoxId, onBoxSelect, boxPointMode, onBoxPointModeChange, onSave, onExportJSON, onDigitize, saving, digitizing, digitizeResult, digitizeError, isUsable, onUsableChange, fileName, chartType }) {
    _s();
    const { startPoint, endPoint, trajectory, boundingBoxes } = annotationData;
    const selectedBox = boundingBoxes.find((b)=>b.id === selectedBoxId);
    const boxEditorRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Auto scroll to box editor when a box is selected
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExpertSidebar.useEffect": ()=>{
            if (selectedBox && boxEditorRef.current) {
                boxEditorRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });
            }
        }
    }["ExpertSidebar.useEffect"], [
        selectedBoxId
    ]);
    const handleBoxTypeChange = (boxType)=>{
        if (!selectedBoxId) return;
        onAnnotationChange({
            boundingBoxes: boundingBoxes.map((b)=>b.id === selectedBoxId ? {
                    ...b,
                    boxType
                } : b)
        });
    };
    const handleDeleteBox = ()=>{
        if (!selectedBoxId) return;
        onAnnotationChange({
            boundingBoxes: boundingBoxes.filter((b)=>b.id !== selectedBoxId)
        });
        onBoxSelect(null);
    };
    // What will the cancel button clear?
    const getCancelLabel = ()=>{
        switch(mode){
            case "startPoint":
                return startPoint ? "🟢 Başlangıç Noktasını Sil" : null;
            case "endPoint":
                return endPoint ? "🔴 Bitiş Noktasını Sil" : null;
            case "tracing":
                return trajectory.length > 0 ? "✏️ Çizgiyi Sil" : null;
            case "boundingBox":
                return boundingBoxes.length > 0 ? "📦 Tüm Kutuları Sil" : null;
            default:
                return null;
        }
    };
    const cancelLabel = getCancelLabel();
    const exportData = buildExportJSON(annotationData, isUsable);
    const hasData = startPoint || endPoint || trajectory.length > 0 || boundingBoxes.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "expert-sidebar",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "expert-sidebar-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Uzman Doğrulama"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 145,
                        columnNumber: 9
                    }, this),
                    fileName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "labeling-box-id",
                        children: fileName
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 146,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 144,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "labeling-label",
                        children: "Çizim Modu"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mode-buttons",
                        children: MODES.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `mode-btn ${mode === m.key ? "active" : ""}`,
                                onClick: ()=>{
                                    onModeChange(m.key);
                                    onBoxPointModeChange(null);
                                },
                                title: m.desc,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mode-btn-icon",
                                        children: m.icon
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 160,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mode-btn-label",
                                        children: m.label
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 161,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, m.key, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 154,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 152,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            selectedBox && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: boxEditorRef,
                className: "labeling-section selected-box-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "labeling-label",
                        style: {
                            color: "#3b82f6"
                        },
                        children: [
                            "📦 Seçili Kutu #",
                            boundingBoxes.indexOf(selectedBox) + 1
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 171,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "labeling-coords",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "xmin: ",
                                    selectedBox.xmin
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 177,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "xmax: ",
                                    selectedBox.xmax
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 178,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "ymin: ",
                                    selectedBox.ymin
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 179,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "ymax: ",
                                    selectedBox.ymax
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 180,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 176,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "labeling-label",
                        style: {
                            marginTop: 10,
                            fontSize: 11
                        },
                        children: "Giriş / Çıkış Noktaları"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 184,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "box-point-controls",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `box-point-btn enter ${boxPointMode === "enter" ? "active" : ""}`,
                                onClick: ()=>onBoxPointModeChange(boxPointMode === "enter" ? null : "enter"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "type-dot",
                                        style: {
                                            background: "#eab308"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 190,
                                        columnNumber: 15
                                    }, this),
                                    selectedBox.box_enter ? `IN (${selectedBox.box_enter.x}, ${selectedBox.box_enter.y})` : boxPointMode === "enter" ? "⏳ Canvas'a tıklayın" : "🟡 Giriş Seç"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 186,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `box-point-btn exit ${boxPointMode === "exit" ? "active" : ""}`,
                                onClick: ()=>onBoxPointModeChange(boxPointMode === "exit" ? null : "exit"),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "type-dot",
                                        style: {
                                            background: "#a855f7"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 199,
                                        columnNumber: 15
                                    }, this),
                                    selectedBox.box_exit ? `OUT (${selectedBox.box_exit.x}, ${selectedBox.box_exit.y})` : boxPointMode === "exit" ? "⏳ Canvas'a tıklayın" : "🟣 Çıkış Seç"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 195,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 185,
                        columnNumber: 11
                    }, this),
                    boxPointMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "box-point-banner",
                        children: boxPointMode === "enter" ? "🟡 Canvas üzerinde GİRİŞ noktasına tıklayın" : "🟣 Canvas üzerinde ÇIKIŞ noktasına tıklayın"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 208,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "labeling-box-types",
                        style: {
                            marginTop: 8
                        },
                        children: BOX_TYPES.map((type)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `labeling-type-btn ${selectedBox.boxType === type ? "active" : ""}`,
                                style: {
                                    borderColor: selectedBox.boxType === type ? BOX_COLORS[type] : undefined,
                                    background: selectedBox.boxType === type ? `${BOX_COLORS[type]}22` : undefined
                                },
                                onClick: ()=>handleBoxTypeChange(type),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "type-dot",
                                        style: {
                                            background: BOX_COLORS[type]
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 227,
                                        columnNumber: 17
                                    }, this),
                                    type
                                ]
                            }, type, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 218,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "annotation-delete-box-btn",
                        onClick: handleDeleteBox,
                        children: "Kutucuğu Sil"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 232,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 170,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "labeling-label",
                        children: "İşaretlemeler"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 240,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "annotation-status-list",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `annotation-status-item ${startPoint ? "set" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-indicator",
                                        style: {
                                            background: startPoint ? "#10b981" : "var(--border)"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 243,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Başlangıç"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 244,
                                        columnNumber: 13
                                    }, this),
                                    startPoint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-coord",
                                        children: [
                                            startPoint.x,
                                            ", ",
                                            startPoint.y
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 246,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-empty",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 248,
                                        columnNumber: 15
                                    }, this),
                                    startPoint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "annotation-clear-btn",
                                        onClick: ()=>onAnnotationChange({
                                                startPoint: null
                                            }),
                                        children: "×"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 251,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `annotation-status-item ${endPoint ? "set" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-indicator",
                                        style: {
                                            background: endPoint ? "#ef4444" : "var(--border)"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 255,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Bitiş"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 256,
                                        columnNumber: 13
                                    }, this),
                                    endPoint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-coord",
                                        children: [
                                            endPoint.x,
                                            ", ",
                                            endPoint.y
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 258,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-empty",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 260,
                                        columnNumber: 15
                                    }, this),
                                    endPoint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "annotation-clear-btn",
                                        onClick: ()=>onAnnotationChange({
                                                endPoint: null
                                            }),
                                        children: "×"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 263,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 254,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `annotation-status-item ${trajectory.length > 0 ? "set" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-indicator",
                                        style: {
                                            background: trajectory.length > 0 ? "#f59e0b" : "var(--border)"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 267,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Çizgi"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 268,
                                        columnNumber: 13
                                    }, this),
                                    trajectory.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-coord",
                                        children: [
                                            trajectory.length,
                                            " nokta"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 270,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-empty",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 272,
                                        columnNumber: 15
                                    }, this),
                                    trajectory.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "annotation-clear-btn",
                                        onClick: ()=>onAnnotationChange({
                                                trajectory: []
                                            }),
                                        children: "×"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 275,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 266,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `annotation-status-item ${boundingBoxes.length > 0 ? "set" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-indicator",
                                        style: {
                                            background: boundingBoxes.length > 0 ? "#3b82f6" : "var(--border)"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 279,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Kutucuk"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 280,
                                        columnNumber: 13
                                    }, this),
                                    boundingBoxes.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-coord",
                                        children: [
                                            boundingBoxes.length,
                                            " alan"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 282,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "annotation-empty",
                                        children: "—"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 284,
                                        columnNumber: 15
                                    }, this),
                                    boundingBoxes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "annotation-clear-btn",
                                        onClick: ()=>{
                                            onAnnotationChange({
                                                boundingBoxes: []
                                            });
                                            onBoxSelect(null);
                                        },
                                        children: "×"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 287,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 278,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 241,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 239,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-section",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "labeling-toggle-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Kullanılabilir Veri"
                        }, void 0, false, {
                            fileName: "[project]/components/ExpertSidebar.tsx",
                            lineNumber: 301,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: `toggle-switch ${isUsable ? "on" : ""}`,
                            onClick: ()=>onUsableChange(!isUsable),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "toggle-thumb"
                            }, void 0, false, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 306,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/ExpertSidebar.tsx",
                            lineNumber: 302,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ExpertSidebar.tsx",
                    lineNumber: 300,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 299,
                columnNumber: 7
            }, this),
            hasData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "labeling-label",
                        children: "JSON Çıktı"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 314,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                        className: "json-preview",
                        children: JSON.stringify(exportData, null, 2)
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 315,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 313,
                columnNumber: 9
            }, this),
            digitizeResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "labeling-label",
                        style: {
                            color: "var(--success)"
                        },
                        children: "Dijitalizasyon Sonucu"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 322,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "digitize-stats",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Nokta"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 324,
                                        columnNumber: 39
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: digitizeResult.points
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 324,
                                        columnNumber: 57
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 324,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Min"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 325,
                                        columnNumber: 39
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: digitizeResult.stats.min
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 325,
                                        columnNumber: 55
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 325,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Max"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 326,
                                        columnNumber: 39
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: digitizeResult.stats.max
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 326,
                                        columnNumber: 55
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 326,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Ort"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 327,
                                        columnNumber: 39
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: digitizeResult.stats.mean
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 327,
                                        columnNumber: 55
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 327,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "stat-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Std"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 328,
                                        columnNumber: 39
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: digitizeResult.stats.std
                                    }, void 0, false, {
                                        fileName: "[project]/components/ExpertSidebar.tsx",
                                        lineNumber: 328,
                                        columnNumber: 55
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ExpertSidebar.tsx",
                                lineNumber: 328,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 323,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 321,
                columnNumber: 9
            }, this),
            digitizeError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-section",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        color: "var(--danger)",
                        fontSize: 12,
                        padding: "8px 12px",
                        background: "rgba(239,68,68,0.1)",
                        borderRadius: 8
                    },
                    children: digitizeError
                }, void 0, false, {
                    fileName: "[project]/components/ExpertSidebar.tsx",
                    lineNumber: 334,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 333,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "labeling-actions",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "labeling-action-btn digitize-btn",
                        onClick: onDigitize,
                        disabled: digitizing || !startPoint || !endPoint || trajectory.length === 0,
                        title: !startPoint || !endPoint || trajectory.length === 0 ? "Dijitalize etmek icin baslangic, bitis ve cizgi gerekli" : "",
                        children: digitizing ? "Dijitalize ediliyor..." : "🔬 Dijitalize Et"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 342,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "labeling-action-btn save-btn",
                        onClick: onSave,
                        disabled: saving,
                        children: saving ? "Kaydediliyor..." : "💾 Kaydet"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 350,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "labeling-action-btn correct-btn",
                        onClick: onExportJSON,
                        disabled: !hasData,
                        children: "JSON"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 353,
                        columnNumber: 9
                    }, this),
                    cancelLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "labeling-action-btn cancel-btn",
                        onClick: onClearCurrent,
                        children: cancelLabel
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 357,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "/",
                        className: "labeling-action-btn",
                        style: {
                            textDecoration: "none",
                            textAlign: "center"
                        },
                        children: "Ana Sayfa"
                    }, void 0, false, {
                        fileName: "[project]/components/ExpertSidebar.tsx",
                        lineNumber: 361,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ExpertSidebar.tsx",
                lineNumber: 341,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ExpertSidebar.tsx",
        lineNumber: 142,
        columnNumber: 5
    }, this);
}
_s(ExpertSidebar, "CC68NVh/W9+AO6ZDxAH5eD71q+g=");
_c = ExpertSidebar;
var _c;
__turbopack_context__.k.register(_c, "ExpertSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/admin/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ExpertSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ExpertSidebar.tsx [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
// react-konva → client-side only
const AnnotationCanvas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/components/AnnotationCanvas.tsx [app-client] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/components/AnnotationCanvas.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "annotation-canvas-container",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "chart-viewer-loading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "loading-spinner"
                    }, void 0, false, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 14,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Canvas yükleniyor..."
                    }, void 0, false, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 15,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin/page.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/app/admin/page.tsx",
            lineNumber: 12,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
});
_c = AnnotationCanvas;
const FASTAPI = "http://localhost:8000";
const INITIAL_ANNOTATION = {
    startPoint: null,
    endPoint: null,
    trajectory: [],
    boundingBoxes: [],
    imageSize: {
        width: 0,
        height: 0
    }
};
function AdminPage() {
    _s();
    // ── Navigation (Gallery tarzı: Tür → Yıl → Ay → Gün) ──
    const [dataTypes, setDataTypes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedType, setSelectedType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedYear, setSelectedYear] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [availableFreqs, setAvailableFreqs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedFreq, setSelectedFreq] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [months, setMonths] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedMonth, setSelectedMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [files, setFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedFile, setSelectedFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ── Canvas ──
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("select");
    const [annotation, setAnnotation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        ...INITIAL_ANNOTATION
    });
    const [selectedBoxId, setSelectedBoxId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [boxPointMode, setBoxPointMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isUsable, setIsUsable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [digitizing, setDigitizing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [digitizeResult, setDigitizeResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [digitizeError, setDigitizeError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recordId, setRecordId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [saveMsg, setSaveMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ── Data fetching (aynı gallery yapısı) ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            fetch(`${FASTAPI}/api/data-types`).then({
                "AdminPage.useEffect": (r)=>r.json()
            }["AdminPage.useEffect"]).then(setDataTypes).catch({
                "AdminPage.useEffect": ()=>{}
            }["AdminPage.useEffect"]);
        }
    }["AdminPage.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            if (selectedType?.years.length) {
                setSelectedYear(selectedType.years[selectedType.years.length - 1]);
            }
        }
    }["AdminPage.useEffect"], [
        selectedType
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            if (!selectedType || !selectedYear) return;
            const typeEnc = encodeURIComponent(selectedType.key);
            fetch(`${FASTAPI}/api/frequencies/${typeEnc}/${selectedYear}`).then({
                "AdminPage.useEffect": (r)=>r.json()
            }["AdminPage.useEffect"]).then({
                "AdminPage.useEffect": (data)=>{
                    setAvailableFreqs(data.frequencies || []);
                    if (data.frequencies?.length > 0) setSelectedFreq(data.frequencies[0]);
                }
            }["AdminPage.useEffect"]).catch({
                "AdminPage.useEffect": ()=>{}
            }["AdminPage.useEffect"]);
        }
    }["AdminPage.useEffect"], [
        selectedType,
        selectedYear
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            if (!selectedType || !selectedYear) return;
            const typeEnc = encodeURIComponent(selectedType.key);
            const url = `${FASTAPI}/api/months/${typeEnc}/${selectedYear}${selectedFreq ? `?frequency=${selectedFreq}` : ""}`;
            fetch(url).then({
                "AdminPage.useEffect": (r)=>r.json()
            }["AdminPage.useEffect"]).then({
                "AdminPage.useEffect": (data)=>{
                    const ml = data.months || [];
                    setMonths(ml);
                    if (ml.length > 0) setSelectedMonth(ml[0].name);
                    else setSelectedMonth(null);
                }
            }["AdminPage.useEffect"]).catch({
                "AdminPage.useEffect": ()=>{}
            }["AdminPage.useEffect"]);
        }
    }["AdminPage.useEffect"], [
        selectedType,
        selectedYear,
        selectedFreq
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            if (!selectedType || !selectedYear || !selectedMonth) {
                setFiles([]);
                return;
            }
            const typeEnc = encodeURIComponent(selectedType.key);
            const monthEnc = encodeURIComponent(selectedMonth);
            let url = `${FASTAPI}/api/files/${typeEnc}?year=${selectedYear}&month=${monthEnc}`;
            if (selectedFreq) url += `&frequency=${selectedFreq}`;
            fetch(url).then({
                "AdminPage.useEffect": (r)=>r.json()
            }["AdminPage.useEffect"]).then({
                "AdminPage.useEffect": (data)=>setFiles(data.files || [])
            }["AdminPage.useEffect"]).catch({
                "AdminPage.useEffect": ()=>{}
            }["AdminPage.useEffect"]);
        }
    }["AdminPage.useEffect"], [
        selectedType,
        selectedYear,
        selectedMonth,
        selectedFreq
    ]);
    // When file changes, reset annotation & check DB
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            if (!selectedFile) return;
            setAnnotation({
                ...INITIAL_ANNOTATION
            });
            setSelectedBoxId(null);
            setMode("select");
            setIsUsable(true);
            setSaveMsg(null);
            setDigitizeResult(null);
            setDigitizeError(null);
            // Check for existing record
            const pathEnc = encodeURIComponent(selectedFile.path);
            fetch(`${FASTAPI}/api/records?path=${pathEnc}&limit=1`).then({
                "AdminPage.useEffect": (r)=>r.json()
            }["AdminPage.useEffect"]).then({
                "AdminPage.useEffect": (data)=>{
                    const match = data.records?.find({
                        "AdminPage.useEffect": (r)=>r.path === selectedFile.path || selectedFile.path.includes(r.path)
                    }["AdminPage.useEffect"]);
                    if (match) {
                        setRecordId(match.id);
                        setIsUsable(match.isUsable);
                        // Load existing annotation from result
                        if (match.result) {
                            const res = match.result;
                            setAnnotation({
                                "AdminPage.useEffect": (prev)=>({
                                        ...prev,
                                        startPoint: res.start_point ? {
                                            x: res.start_point[0],
                                            y: res.start_point[1]
                                        } : null,
                                        endPoint: res.end_point ? {
                                            x: res.end_point[0],
                                            y: res.end_point[1]
                                        } : null,
                                        trajectory: (res.trajectory || []).map({
                                            "AdminPage.useEffect": (p)=>({
                                                    x: p[0],
                                                    y: p[1]
                                                })
                                        }["AdminPage.useEffect"]),
                                        boundingBoxes: (res.bounding_boxes || []).map({
                                            "AdminPage.useEffect": (b, i)=>({
                                                    id: `db-${i}`,
                                                    xmin: b.xmin,
                                                    xmax: b.xmax,
                                                    ymin: b.ymin,
                                                    ymax: b.ymax,
                                                    box_enter: b.box_enter ? {
                                                        x: b.box_enter[0],
                                                        y: b.box_enter[1]
                                                    } : {
                                                        x: b.xmin,
                                                        y: b.ymin
                                                    },
                                                    box_exit: b.box_exit ? {
                                                        x: b.box_exit[0],
                                                        y: b.box_exit[1]
                                                    } : {
                                                        x: b.xmax,
                                                        y: b.ymax
                                                    },
                                                    boxType: b.box_type || undefined
                                                })
                                        }["AdminPage.useEffect"])
                                    })
                            }["AdminPage.useEffect"]);
                        }
                    } else {
                        setRecordId(null);
                    }
                }
            }["AdminPage.useEffect"]).catch({
                "AdminPage.useEffect": ()=>setRecordId(null)
            }["AdminPage.useEffect"]);
        }
    }["AdminPage.useEffect"], [
        selectedFile
    ]);
    // ── Navigation helpers ──
    const currentIndex = selectedFile ? files.findIndex((f)=>f.path === selectedFile.path) : -1;
    const goPrev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[goPrev]": ()=>{
            if (currentIndex > 0) setSelectedFile(files[currentIndex - 1]);
        }
    }["AdminPage.useCallback[goPrev]"], [
        currentIndex,
        files
    ]);
    const goNext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[goNext]": ()=>{
            if (currentIndex < files.length - 1) setSelectedFile(files[currentIndex + 1]);
        }
    }["AdminPage.useCallback[goNext]"], [
        currentIndex,
        files
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminPage.useEffect": ()=>{
            const handler = {
                "AdminPage.useEffect.handler": (e)=>{
                    if (e.key === "ArrowLeft") goPrev();
                    else if (e.key === "ArrowRight") goNext();
                }
            }["AdminPage.useEffect.handler"];
            window.addEventListener("keydown", handler);
            return ({
                "AdminPage.useEffect": ()=>window.removeEventListener("keydown", handler)
            })["AdminPage.useEffect"];
        }
    }["AdminPage.useEffect"], [
        goPrev,
        goNext
    ]);
    // ── Annotation update ──
    const handleAnnotationChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[handleAnnotationChange]": (updates)=>{
            setAnnotation({
                "AdminPage.useCallback[handleAnnotationChange]": (prev)=>({
                        ...prev,
                        ...updates
                    })
            }["AdminPage.useCallback[handleAnnotationChange]"]);
        }
    }["AdminPage.useCallback[handleAnnotationChange]"], []);
    // ── Build export JSON ──
    const getExportJSON = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[getExportJSON]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ExpertSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildExportJSON"])(annotation, isUsable)
    }["AdminPage.useCallback[getExportJSON]"], [
        annotation,
        isUsable
    ]);
    // ── Smart clear: only clears the current mode's data ──
    const handleClearCurrent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[handleClearCurrent]": ()=>{
            switch(mode){
                case "startPoint":
                    setAnnotation({
                        "AdminPage.useCallback[handleClearCurrent]": (prev)=>({
                                ...prev,
                                startPoint: null
                            })
                    }["AdminPage.useCallback[handleClearCurrent]"]);
                    break;
                case "endPoint":
                    setAnnotation({
                        "AdminPage.useCallback[handleClearCurrent]": (prev)=>({
                                ...prev,
                                endPoint: null
                            })
                    }["AdminPage.useCallback[handleClearCurrent]"]);
                    break;
                case "tracing":
                    setAnnotation({
                        "AdminPage.useCallback[handleClearCurrent]": (prev)=>({
                                ...prev,
                                trajectory: []
                            })
                    }["AdminPage.useCallback[handleClearCurrent]"]);
                    break;
                case "boundingBox":
                    setAnnotation({
                        "AdminPage.useCallback[handleClearCurrent]": (prev)=>({
                                ...prev,
                                boundingBoxes: []
                            })
                    }["AdminPage.useCallback[handleClearCurrent]"]);
                    setSelectedBoxId(null);
                    setBoxPointMode(null);
                    break;
            }
        }
    }["AdminPage.useCallback[handleClearCurrent]"], [
        mode
    ]);
    // ── Save to FastAPI ──
    const handleSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[handleSave]": async ()=>{
            if (!selectedFile) return;
            setSaving(true);
            setSaveMsg(null);
            const exportJSON = getExportJSON();
            const payload = {
                path: selectedFile.path,
                type: selectedType?.type || "Nem",
                timestamp: selectedFile.date || selectedFile.name,
                interval: selectedFreq === "Weekly" ? "Weekly" : "Daily",
                isLabeled: true,
                isBackground: false,
                boxCoord: annotation.boundingBoxes.length > 0 ? [
                    annotation.boundingBoxes[0].xmin,
                    annotation.boundingBoxes[0].xmax,
                    annotation.boundingBoxes[0].ymin,
                    annotation.boundingBoxes[0].ymax
                ] : null,
                boxType: annotation.boundingBoxes.length > 0 ? annotation.boundingBoxes[0].boxType || null : null,
                isUsable,
                result: exportJSON
            };
            try {
                if (recordId) {
                    await fetch(`${FASTAPI}/api/records/${recordId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    const res = await fetch(`${FASTAPI}/api/records`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    setRecordId(data.id);
                }
                setSaveMsg("✅ Kayıt başarılı!");
                setTimeout({
                    "AdminPage.useCallback[handleSave]": ()=>setSaveMsg(null)
                }["AdminPage.useCallback[handleSave]"], 3000);
            } catch (e) {
                console.error("Save error:", e);
                setSaveMsg("❌ Kayıt hatası");
            }
            setSaving(false);
        }
    }["AdminPage.useCallback[handleSave]"], [
        selectedFile,
        annotation,
        selectedType,
        selectedFreq,
        recordId,
        isUsable,
        getExportJSON
    ]);
    // ── Export JSON to clipboard ──
    const handleExportJSON = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[handleExportJSON]": ()=>{
            const json = JSON.stringify(getExportJSON(), null, 2);
            navigator.clipboard.writeText(json).then({
                "AdminPage.useCallback[handleExportJSON]": ()=>{
                    setSaveMsg("JSON panoya kopyalandi!");
                    setTimeout({
                        "AdminPage.useCallback[handleExportJSON]": ()=>setSaveMsg(null)
                    }["AdminPage.useCallback[handleExportJSON]"], 3000);
                }
            }["AdminPage.useCallback[handleExportJSON]"]);
        }
    }["AdminPage.useCallback[handleExportJSON]"], [
        getExportJSON
    ]);
    // ── Digitize via pipeline ──
    const handleDigitize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AdminPage.useCallback[handleDigitize]": async ()=>{
            if (!selectedFile || !annotation.startPoint || !annotation.endPoint) return;
            setDigitizing(true);
            setDigitizeResult(null);
            setDigitizeError(null);
            const chartType = selectedType?.type === "Nem" ? "nem" : "sicaklik";
            const boxes = annotation.boundingBoxes.map({
                "AdminPage.useCallback[handleDigitize].boxes": (b)=>({
                        BoxCoord: [
                            b.xmin,
                            b.ymin,
                            b.xmax,
                            b.ymax
                        ],
                        BoxType: b.boxType || "Siliklik",
                        Boxenter: b.box_enter ? [
                            b.box_enter.x,
                            b.box_enter.y
                        ] : null,
                        Boxexit: b.box_exit ? [
                            b.box_exit.x,
                            b.box_exit.y
                        ] : null
                    })
            }["AdminPage.useCallback[handleDigitize].boxes"]);
            const payload = {
                image_path: selectedFile.path,
                chart_type: chartType,
                timestamp: selectedFile.date ? `${selectedFile.year}-${String(months.find({
                    "AdminPage.useCallback[handleDigitize]": (m)=>m.name === selectedMonth
                }["AdminPage.useCallback[handleDigitize]"])?.num || 1).padStart(2, "0")}-${selectedFile.date}` : undefined,
                start_point: [
                    annotation.startPoint.x,
                    annotation.startPoint.y
                ],
                end_point: [
                    annotation.endPoint.x,
                    annotation.endPoint.y
                ],
                trajectory: annotation.trajectory.map({
                    "AdminPage.useCallback[handleDigitize]": (p)=>[
                            p.x,
                            p.y
                        ]
                }["AdminPage.useCallback[handleDigitize]"]),
                boxes: boxes.length > 0 ? boxes : []
            };
            try {
                const res = await fetch(`${FASTAPI}/digitize`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const err = await res.json().catch({
                        "AdminPage.useCallback[handleDigitize]": ()=>({
                                detail: res.statusText
                            })
                    }["AdminPage.useCallback[handleDigitize]"]);
                    throw new Error(err.detail || `HTTP ${res.status}`);
                }
                const data = await res.json();
                setDigitizeResult({
                    line_x: data.line_x || [],
                    line_y: data.line_y || [],
                    points: data.points || 0,
                    stats: data.stats || {
                        min: 0,
                        max: 0,
                        mean: 0,
                        std: 0
                    },
                    isLabeled: data.isLabeled || false,
                    overlay_base64: data.overlay_base64 || undefined,
                    pixel_points: data.pixel_points || undefined
                });
                setSaveMsg("Dijitalizasyon tamamlandi!");
                setTimeout({
                    "AdminPage.useCallback[handleDigitize]": ()=>setSaveMsg(null)
                }["AdminPage.useCallback[handleDigitize]"], 3000);
            } catch (e) {
                setDigitizeError(e instanceof Error ? e.message : "Dijitalizasyon hatasi");
            }
            setDigitizing(false);
        }
    }["AdminPage.useCallback[handleDigitize]"], [
        selectedFile,
        annotation,
        selectedType,
        months,
        selectedMonth
    ]);
    const imageSrc = selectedFile ? `${FASTAPI}/api/tiff/${selectedFile.path}` : "";
    const overlayImageSrc = digitizeResult?.overlay_base64 ? `data:image/jpeg;base64,${digitizeResult.overlay_base64}` : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "admin-layout",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "admin-sidebar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sidebar-header",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "sidebar-logo",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "sidebar-logo-icon",
                                    style: {
                                        background: "linear-gradient(135deg, #ef4444, #f59e0b)"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "22",
                                        height: "22",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "white",
                                        strokeWidth: "2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin/page.tsx",
                                            lineNumber: 356,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 355,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/admin/page.tsx",
                                    lineNumber: 354,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            children: "Uzman Doğrulama"
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin/page.tsx",
                                            lineNumber: 360,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Analog Grafik İşaretleme"
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin/page.tsx",
                                            lineNumber: 361,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin/page.tsx",
                                    lineNumber: 359,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/admin/page.tsx",
                            lineNumber: 353,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 352,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "admin-filters",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "labeling-label",
                                children: "Veri Türü"
                            }, void 0, false, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 368,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "filter-chips",
                                children: dataTypes.map((dt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: `filter-chip ${selectedType?.key === dt.key ? "active" : ""}`,
                                        onClick: ()=>{
                                            setSelectedType(dt);
                                            setSelectedMonth(null);
                                            setSelectedFile(null);
                                        },
                                        children: dt.label
                                    }, dt.key, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 371,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 369,
                                columnNumber: 11
                            }, this),
                            selectedType && selectedType.years.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "labeling-label",
                                        children: "Yıl"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 388,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "admin-select",
                                        value: selectedYear || "",
                                        onChange: (e)=>{
                                            setSelectedYear(parseInt(e.target.value));
                                            setSelectedMonth(null);
                                            setSelectedFile(null);
                                        },
                                        children: selectedType.years.map((y)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: y,
                                                children: y
                                            }, y, false, {
                                                fileName: "[project]/app/admin/page.tsx",
                                                lineNumber: 399,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 389,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true),
                            availableFreqs.length > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "labeling-label",
                                        children: "Frekans"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 408,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "filter-chips",
                                        children: availableFreqs.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: `filter-chip ${selectedFreq === f ? "active" : ""}`,
                                                onClick: ()=>setSelectedFreq(f),
                                                children: f === "Daily" ? "Günlük" : "Haftalık"
                                            }, f, false, {
                                                fileName: "[project]/app/admin/page.tsx",
                                                lineNumber: 411,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 409,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true),
                            months.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "labeling-label",
                                        children: "Ay"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 426,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "filter-chips",
                                        children: months.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: `filter-chip ${selectedMonth === m.name ? "active" : ""}`,
                                                onClick: ()=>{
                                                    setSelectedMonth(m.name);
                                                    setSelectedFile(null);
                                                },
                                                children: [
                                                    m.name,
                                                    " ",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            opacity: 0.5,
                                                            fontSize: 10,
                                                            marginLeft: 2
                                                        },
                                                        children: m.count
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin/page.tsx",
                                                        lineNumber: 434,
                                                        columnNumber: 30
                                                    }, this)
                                                ]
                                            }, m.name, true, {
                                                fileName: "[project]/app/admin/page.tsx",
                                                lineNumber: 429,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 427,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 366,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "sidebar-content",
                        children: [
                            files.length === 0 && selectedMonth && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "file-count-badge",
                                children: "Bu ayda dosya bulunamadı"
                            }, void 0, false, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 445,
                                columnNumber: 13
                            }, this),
                            files.length === 0 && !selectedMonth && selectedType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "file-count-badge",
                                children: "Ay seçin"
                            }, void 0, false, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 448,
                                columnNumber: 13
                            }, this),
                            !selectedType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "file-count-badge",
                                children: "Yukarıdan veri türü seçin"
                            }, void 0, false, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 451,
                                columnNumber: 13
                            }, this),
                            files.map((file)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `file-card ${selectedFile?.path === file.path ? "active" : ""}`,
                                    onClick: ()=>setSelectedFile(file),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "file-card-name",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "file-icon",
                                                    width: "16",
                                                    height: "16",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                            x: "3",
                                                            y: "3",
                                                            width: "18",
                                                            height: "18",
                                                            rx: "2",
                                                            ry: "2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin/page.tsx",
                                                            lineNumber: 461,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                            cx: "8.5",
                                                            cy: "8.5",
                                                            r: "1.5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin/page.tsx",
                                                            lineNumber: 462,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "m21 15-5-5L5 21"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin/page.tsx",
                                                            lineNumber: 463,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin/page.tsx",
                                                    lineNumber: 460,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: file.date || file.name
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin/page.tsx",
                                                    lineNumber: 465,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin/page.tsx",
                                            lineNumber: 459,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "file-card-meta",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    file.sizeMB,
                                                    " MB"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin/page.tsx",
                                                lineNumber: 468,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin/page.tsx",
                                            lineNumber: 467,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, file.path, true, {
                                    fileName: "[project]/app/admin/page.tsx",
                                    lineNumber: 454,
                                    columnNumber: 13
                                }, this)),
                            files.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "file-count-badge",
                                children: [
                                    files.length,
                                    " dosya"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 473,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 443,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin/page.tsx",
                lineNumber: 351,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "admin-main",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "viewer-header",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "viewer-header-title",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "dot",
                                        style: {
                                            background: mode === "startPoint" ? "#10b981" : mode === "endPoint" ? "#ef4444" : mode === "tracing" ? "#f59e0b" : mode === "boundingBox" ? "#3b82f6" : "var(--success)"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 13
                                    }, this),
                                    selectedFile ? `${selectedMonth || ""} ${selectedYear || ""} — ${selectedFile.date || selectedFile.name}` : "Dosya Seçin"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 482,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "viewer-header-info",
                                children: [
                                    selectedType && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "info-badge",
                                        children: selectedType.label
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 495,
                                        columnNumber: 30
                                    }, this),
                                    selectedFile && files.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "info-badge",
                                        children: [
                                            currentIndex + 1,
                                            " / ",
                                            files.length
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 497,
                                        columnNumber: 15
                                    }, this),
                                    selectedFile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "nav-btn-header",
                                                onClick: goPrev,
                                                disabled: currentIndex <= 0,
                                                children: "← Önceki"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin/page.tsx",
                                                lineNumber: 502,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "nav-btn-header",
                                                onClick: goNext,
                                                disabled: currentIndex >= files.length - 1,
                                                children: "Sonraki →"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin/page.tsx",
                                                lineNumber: 505,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true),
                                    saveMsg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "info-badge",
                                        style: {
                                            background: "var(--success)",
                                            color: "#fff",
                                            borderColor: "var(--success)"
                                        },
                                        children: saveMsg
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 510,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin/page.tsx",
                                lineNumber: 494,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 481,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "admin-editor-area",
                        children: selectedFile ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnnotationCanvas, {
                            imageSrc: imageSrc,
                            overlayImageSrc: overlayImageSrc,
                            mode: mode,
                            annotationData: annotation,
                            onAnnotationChange: handleAnnotationChange,
                            selectedBoxId: selectedBoxId,
                            onBoxSelect: setSelectedBoxId,
                            boxPointMode: boxPointMode,
                            onBoxPointSet: ()=>setBoxPointMode(null)
                        }, void 0, false, {
                            fileName: "[project]/app/admin/page.tsx",
                            lineNumber: 516,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "empty-state",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "empty-state-icon",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "40",
                                        height: "40",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "1.5",
                                        style: {
                                            color: "var(--accent-warm)"
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin/page.tsx",
                                            lineNumber: 532,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin/page.tsx",
                                        lineNumber: 530,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/admin/page.tsx",
                                    lineNumber: 529,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Grafik Kağıdı Seçin"
                                }, void 0, false, {
                                    fileName: "[project]/app/admin/page.tsx",
                                    lineNumber: 535,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Sol panelden Veri Türü → Yıl → Ay → Gün seçerek analog grafik işaretlemeye başlayın."
                                }, void 0, false, {
                                    fileName: "[project]/app/admin/page.tsx",
                                    lineNumber: 536,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/admin/page.tsx",
                            lineNumber: 528,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/admin/page.tsx",
                        lineNumber: 514,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin/page.tsx",
                lineNumber: 479,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ExpertSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                mode: mode,
                onModeChange: setMode,
                annotationData: annotation,
                onAnnotationChange: handleAnnotationChange,
                onClearCurrent: handleClearCurrent,
                selectedBoxId: selectedBoxId,
                onBoxSelect: setSelectedBoxId,
                boxPointMode: boxPointMode,
                onBoxPointModeChange: setBoxPointMode,
                onSave: handleSave,
                onExportJSON: handleExportJSON,
                onDigitize: handleDigitize,
                saving: saving,
                digitizing: digitizing,
                digitizeResult: digitizeResult,
                digitizeError: digitizeError,
                isUsable: isUsable,
                onUsableChange: setIsUsable,
                fileName: selectedFile?.name || null,
                chartType: selectedType?.type || null
            }, void 0, false, {
                fileName: "[project]/app/admin/page.tsx",
                lineNumber: 546,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/admin/page.tsx",
        lineNumber: 349,
        columnNumber: 5
    }, this);
}
_s(AdminPage, "Ul0EHWEGis6b3/kA3V9MPFfcMdw=");
_c1 = AdminPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "AnnotationCanvas");
__turbopack_context__.k.register(_c1, "AdminPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_7caccced._.js.map