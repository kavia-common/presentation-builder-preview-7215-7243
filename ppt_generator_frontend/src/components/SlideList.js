import React from "react";

// PUBLIC_INTERFACE
export default function SlideList({
  slides,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onMoveUp,
  onMoveDown
}) {
  /** Left rail list of slides with reorder/delete controls. */
  return (
    <section className="card" aria-label="Slide list">
      <div className="cardHeader">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 className="cardTitle">Slides</h2>
          <button className="btn btnSmall btnSecondary" onClick={onAdd} type="button">
            + Add
          </button>
        </div>
        <p className="cardHint">Select a slide to edit and preview. Reorder with ↑/↓.</p>
      </div>

      <div className="cardBody">
        {slides.length === 0 ? (
          <div
            style={{
              border: "1px dashed rgba(17,24,39,0.20)",
              borderRadius: 14,
              padding: 14,
              background: "rgba(37,99,235,0.04)"
            }}
          >
            <div className="badge">Empty state</div>
            <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "#111827" }}>
              No slides yet. Click <strong>+ Add</strong> to create your first slide.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {slides.map((slide, idx) => {
              const selected = slide.id === selectedId;
              return (
                <li
                  key={slide.id}
                  style={{
                    border: `1px solid ${selected ? "rgba(37,99,235,0.45)" : "rgba(17,24,39,0.12)"}`,
                    borderRadius: 14,
                    padding: 10,
                    background: selected ? "rgba(37,99,235,0.06)" : "#fff",
                    boxShadow: selected ? "0 8px 18px rgba(37,99,235,0.10)" : "none",
                    transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(slide.id)}
                    className="btn btnGhost"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12
                    }}
                    aria-current={selected ? "true" : "false"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {slide.title?.trim() ? slide.title : `Untitled slide ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {slide.subtitle?.trim() ? slide.subtitle : "No subtitle"}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>#{idx + 1}</span>
                    </div>
                  </button>

                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between", paddingTop: 8 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => onMoveUp(idx)}
                        disabled={idx === 0}
                        aria-label={`Move slide ${idx + 1} up`}
                        title={idx === 0 ? "Already at top" : "Move up"}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => onMoveDown(idx)}
                        disabled={idx === slides.length - 1}
                        aria-label={`Move slide ${idx + 1} down`}
                        title={idx === slides.length - 1 ? "Already at bottom" : "Move down"}
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btnSmall btnDanger"
                      onClick={() => onDelete(slide.id)}
                      aria-label={`Delete slide ${idx + 1}`}
                      title="Delete slide"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
