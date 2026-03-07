"use client";

import { BoundingBox } from "./BoundingBoxEditor";

const BOX_TYPES = ["Dagilma", "Siliklik", "KagitDefect", "NoData"] as const;
const BOX_COLORS: Record<string, string> = {
  Dagilma: "#FF6B6B",
  Siliklik: "#FFA94D",
  KagitDefect: "#FFD43B",
  NoData: "#868E96",
};

interface LabelingSidebarProps {
  selectedBox: BoundingBox | null;
  onUpdate: (updates: Partial<BoundingBox>) => void;
  onSave: () => void;
  onDelete: () => void;
  onCorrect: () => void;
  tracingMode: boolean;
  onToggleTracing: () => void;
  onClearTracing: () => void;
  tracingPointCount: number;
  saving: boolean;
}

export default function LabelingSidebar({
  selectedBox,
  onUpdate,
  onSave,
  onDelete,
  onCorrect,
  tracingMode,
  onToggleTracing,
  onClearTracing,
  tracingPointCount,
  saving,
}: LabelingSidebarProps) {
  if (!selectedBox) {
    return (
      <div className="labeling-sidebar">
        <div className="labeling-sidebar-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" /><path d="M9 21V9" />
          </svg>
          <p>Resim üzerinde bir dikdörtgen çizerek alan seçin</p>
          <p className="labeling-hint">Mouse ile sürükleyerek kutucuk çizin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="labeling-sidebar">
      <div className="labeling-sidebar-header">
        <h3>Alan Etiketleme</h3>
        <span className="labeling-box-id">#{selectedBox.id}</span>
      </div>

      {/* Koordinatlar */}
      <div className="labeling-section">
        <label className="labeling-label">Koordinatlar</label>
        <div className="labeling-coords">
          <span>x: {Math.round(selectedBox.x)}</span>
          <span>y: {Math.round(selectedBox.y)}</span>
          <span>w: {Math.round(selectedBox.width)}</span>
          <span>h: {Math.round(selectedBox.height)}</span>
        </div>
      </div>

      {/* boxType */}
      <div className="labeling-section">
        <label className="labeling-label">Kutu Tipi</label>
        <div className="labeling-box-types">
          {BOX_TYPES.map((type) => (
            <button
              key={type}
              className={`labeling-type-btn ${selectedBox.boxType === type ? "active" : ""}`}
              style={{
                borderColor: selectedBox.boxType === type ? BOX_COLORS[type] : undefined,
                background: selectedBox.boxType === type ? `${BOX_COLORS[type]}22` : undefined,
              }}
              onClick={() => onUpdate({ boxType: type })}
            >
              <span className="type-dot" style={{ background: BOX_COLORS[type] }} />
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="labeling-section">
        <div className="labeling-toggle-row">
          <span>Kullanılabilir</span>
          <button
            className={`toggle-switch ${selectedBox.isUsable ? "on" : ""}`}
            onClick={() => onUpdate({ isUsable: !selectedBox.isUsable })}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
        <div className="labeling-toggle-row">
          <span>Arka Plan</span>
          <button
            className={`toggle-switch ${selectedBox.isBackground ? "on" : ""}`}
            onClick={() => onUpdate({ isBackground: !selectedBox.isBackground })}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Tracing Mode */}
      <div className="labeling-section">
        <label className="labeling-label">Çizgi Düzeltme</label>
        <button
          className={`labeling-action-btn tracing-btn ${tracingMode ? "active" : ""}`}
          onClick={onToggleTracing}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
          </svg>
          {tracingMode ? "Tracing Aktif" : "Tracing Modu"}
        </button>
        {tracingMode && (
          <div className="tracing-info">
            <span>{tracingPointCount} nokta çizildi</span>
            <button className="labeling-text-btn" onClick={onClearTracing}>Temizle</button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="labeling-actions">
        <button className="labeling-action-btn correct-btn" onClick={onCorrect} disabled={tracingPointCount < 2}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Düzelt & Kaydet
        </button>
        <button className="labeling-action-btn save-btn" onClick={onSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button className="labeling-action-btn delete-btn" onClick={onDelete}>
          Sil
        </button>
      </div>
    </div>
  );
}
