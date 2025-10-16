import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { HexColorPicker } from "react-colorful";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../components/CropImage/cropUtils";
import "./Canvas.css";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import API_BASE_URL from "../api";
// API Keys (keep or replace with your keys)
const PIXABAY_API_KEY = "52708540-e6b643dbc13d7790b43a0690f";
const UNSPLASH_ACCESS_KEY = "LJRfi6AuYn5Gkd5rJ-FF1YgMR19mWaaY79r-992ABGc";

export default function Canvas({ pageTitle, pageIndex, onSave }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const initialPage = location.state?.page || { title: "", elements: [] };

  const [elements, setElements] = useState(initialPage.elements || []);
  const [selectedElement, setSelectedElement] = useState(null);
  const [searchQuery, setSearchQuery] = useState("travel");
  const [stickers, setStickers] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showCrop, setShowCrop] = useState(false);
  const [cropSettings, setCropSettings] = useState({ src: null, index: null, crop: { x: 0, y: 0 }, zoom: 1 });
  const [editingTextIndex, setEditingTextIndex] = useState(null);

  const canvasRef = useRef();

  // --- Fetch stickers from Pixabay + Unsplash ---
  useEffect(() => {
    async function fetchStickers() {
      try {
        const pixRes = await fetch(
          `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
            searchQuery
          )}&image_type=illustration&per_page=20&safesearch=true&order=popular`
        );
        const pixData = await pixRes.json();

        const unsRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            searchQuery
          )}&per_page=20&client_id=${UNSPLASH_ACCESS_KEY}`
        );
        const unsData = await unsRes.json();

        const combined = [
          ...(pixData.hits || []).map((s) => ({ id: `pix-${s.id}`, src: s.previewURL })),
          ...(unsData.results || []).map((s) => ({ id: `uns-${s.id}`, src: s.urls.small })),
        ];
        setStickers(combined);
      } catch (err) {
        console.error("Failed to load stickers:", err);
      }
    }
    fetchStickers();
  }, [searchQuery]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedElement !== null) deleteElement(selectedElement);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElement, elements, undoStack, redoStack]);

  // --- Undo / Redo helpers ---
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(elements))]);
    setRedoStack([]); // clear redo stack on new action
  }, [elements]);

  const undo = () => {
    setUndoStack((prevUndo) => {
      if (!prevUndo.length) return prevUndo;
      const newRedo = [JSON.parse(JSON.stringify(elements)), ...redoStack];
      setRedoStack(newRedo);
      const prev = prevUndo[prevUndo.length - 1];
      setElements(prev);
      return prevUndo.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((prevRedo) => {
      if (!prevRedo.length) return prevRedo;
      const next = prevRedo[0];
      setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(elements))]);
      setElements(next);
      return prevRedo.slice(1);
    });
  };

  // --- Add elements ---
  const addText = () => {
    pushUndo();
    setElements((prev) => [
      ...prev,
      {
        type: "text",
        content: "New Text",
        x: 50,
        y: 50,
        fontSize: 24,
        color: "#000000",
        rotation: 0,
        fontFamily: "Arial",
        bold: false,
        italic: false,
        align: "center",
        zIndex: prev.length + 1,
      },
    ]);
  };

  const addShape = (shape) => {
    pushUndo();
    setElements((prev) => [
      ...prev,
      {
        type: "shape",
        shape,
        x: 50,
        y: 50,
        width: shape === "arrow" ? 160 : 120,
        height: shape === "arrow" ? 40 : 80,
        color: "#000",
        backgroundColor: "#cccccc",
        opacity: 1,
        border: { color: "#000", width: 2, style: "solid" },
        borderRadius: 0,
        rotation: 0,
        curved: false,
        curveOffset: -40,
        zIndex: prev.length + 1,
      },
    ]);
  };

  const addImage = (src) => {
    pushUndo();
    setElements((prev) => [
      ...prev,
      {
        type: "image",
        src,
        x: 100,
        y: 100,
        width: 150,
        height: 150,
        rotation: 0,
        borderRadius: 0,
        border: { color: "#000", width: 0, style: "solid" },
        zIndex: prev.length + 1,
      },
    ]);
  };

  const addLocalImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addImage(url);
  };

  // --- Update / Delete / Z-index ---
  const updateElement = (index, newProps) => {
    setElements((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...newProps };
      return updated;
    });
  };

  const deleteElement = (index) => {
    pushUndo();
    setElements((prev) => prev.filter((_, i) => i !== index));
    setSelectedElement(null);
    if (editingTextIndex === index) setEditingTextIndex(null);
  };

  const bringForward = (index) => {
    pushUndo();
    setElements((prev) => {
      const updated = [...prev];
      updated[index].zIndex = (updated[index].zIndex || 1) + 1;
      return updated;
    });
  };

  const sendBackward = (index) => {
    pushUndo();
    setElements((prev) => {
      const updated = [...prev];
      updated[index].zIndex = Math.max(1, (updated[index].zIndex || 1) - 1);
      return updated;
    });
  };

  // --- Cropping for images ---
  const startCrop = (index) => {
    setCropSettings({ src: elements[index].src, index, crop: { x: 0, y: 0 }, zoom: 1 });
    setShowCrop(true);
  };

  const applyCrop = async () => {
    const cropped = await getCroppedImg(cropSettings.src, cropSettings.crop, cropSettings.zoom);
    updateElement(cropSettings.index, { src: cropped });
    setShowCrop(false);
  };

 // --- Save canvas as image (html2canvas -> FormData -> server save) ---
const saveCanvas = async () => {
  const canvasElement = canvasRef.current;
  if (!canvasElement) return;

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(canvasElement, { useCORS: true, scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();

    const formData = new FormData();
    formData.append("title", pageTitle || "Untitled Page"); // ✅ now defined
    formData.append("pageIndex", pageIndex); // ✅ now defined
    formData.append("image", blob, "canvas.png");

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Login required");

    const diaryRes = await fetch(`${API_BASE_URL}/api/diary`, {
      method: "POST",
      headers: { "x-auth-token": token },
      body: formData,
    });

    if (!diaryRes.ok) throw new Error(`Failed to save canvas: ${diaryRes.status}`);

    const updatedPage = await diaryRes.json();

    // Call parent handler
    if (onSave) onSave(updatedPage.image, pageIndex, updatedPage.title);
  } catch (err) {
    console.error("Error saving canvas:", err);
  }
};



  // --- Background click to deselect ---
  const handleCanvasMouseDown = (e) => {
    if (canvasRef.current && e.target === canvasRef.current) {
      setSelectedElement(null);
      setEditingTextIndex(null);
    }
  };

  // --- Inline formatting (bold / italic / link) ---
  const execFormat = (command, value = null) => {
    if (editingTextIndex === selectedElement && selectedElement != null) {
      // focus the editable element
      const editables = canvasRef.current.querySelectorAll("[contenteditable='true']");
      const editable = editables && editables[0];
      if (editable) editable.focus();
      try {
        document.execCommand(command, false, value);
        const updatedHTML = editable ? editable.innerHTML : null;
        if (updatedHTML != null) updateElement(selectedElement, { content: updatedHTML });
      } catch (err) {
        console.warn("Formatting failed:", err);
      }
    } else {
      try {
        document.execCommand(command, false, value);
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let node = sel.anchorNode;
          while (node && node !== document && node !== canvasRef.current) {
            if (node.nodeType === 1 && node.getAttribute && node.getAttribute("contenteditable") === "true") {
              const parentEditable = node;
              const allEditables = Array.from(canvasRef.current.querySelectorAll("[contenteditable='true']"));
              const idx = allEditables.indexOf(parentEditable);
              if (idx !== -1) {
                updateElement(idx, { content: parentEditable.innerHTML });
              }
              break;
            }
            node = node.parentNode;
          }
        }
      } catch (err) {
        console.warn("Formatting attempt failed:", err);
      }
    }
  };

  const applyLink = () => {
    const url = prompt("Enter URL (including http/https):", "https://");
    if (!url) return;
    execFormat("createLink", url);
  };

  // --- Arrow rendering with unique marker id and CSS rotation support ---
  const renderArrowSVG = (el, i) => {
    const w = Math.max(10, el.width || 100);
    const h = Math.max(10, el.height || 30);
    const strokeWidth = el.border?.width || 3;
    const color = el.color || "#000";
    const markerId = `arrowhead-${i}-${el.zIndex || 0}`; // unique per element

    if (el.curved) {
      const ctrlY = h / 2 - Math.min(200, Math.max(-200, (el.curveOffset || -40)));
      const startX = 10;
      const endX = Math.max(20, w - 15);
      const startY = h / 2;
      const endY = h / 2;
      const d = `M ${startX} ${startY} Q ${w / 2} ${ctrlY} ${endX} ${endY}`;
      return (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 10 5, 0 10" fill={color} />
            </marker>
          </defs>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#${markerId})`}
          />
        </svg>
      );
    } else {
      const startX = 10;
      const endX = Math.max(20, w - 15);
      const y = h / 2;
      return (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 10 5, 0 10" fill={color} />
            </marker>
          </defs>
          <line
            x1={startX}
            y1={y}
            x2={endX}
            y2={y}
            stroke={color}
            strokeWidth={strokeWidth}
            markerEnd={`url(#${markerId})`}
            strokeLinecap="round"
          />
        </svg>
      );
    }
  };

  // --- Utility: ensure element has border object ---
  const ensureBorder = (idx) => {
    const el = elements[idx];
    if (!el) return;
    if (!el.border) {
      updateElement(idx, { border: { color: "#000", width: 1, style: "solid" } });
    }
  };

  // --- Render ---
  return (
    <div className="canvas-main-container" style={{ display: "flex", gap: 12 }}>
      {/* Canvas area */}
      <div
        className="canvas-left"
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{
          width: "70%",
          minHeight: "80vh",
          border: "1px solid #ddd",
          position: "relative",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {elements.map((el, i) => (
          <Rnd
            key={el.id || i}
            bounds="parent"
            size={{ width: el.width || 100, height: el.height || 50 }}
            position={{ x: el.x, y: el.y }}
            style={{
              zIndex: el.zIndex || 1,
              border: selectedElement === i ? "2px solid purple" : "none",
              borderRadius: el.type === "shape" || el.type === "image" ? el.borderRadius || 0 : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
              background: "transparent",
              boxSizing: "border-box",
            }}
            onDragStop={(e, d) => updateElement(i, { x: d.x, y: d.y })}
            onResizeStop={(e, dir, ref, delta, pos) =>
              updateElement(i, { width: ref.offsetWidth, height: ref.offsetHeight, ...pos })
            }
            onClick={(ev) => {
              ev.stopPropagation();
              setSelectedElement(i);
            }}
            onDoubleClick={() => {
              if (el.type === "text") {
                setEditingTextIndex(i);
              }
            }}
          >
            {/* TEXT */}
            {el.type === "text" && (
              <div
                contentEditable={editingTextIndex === i}
                suppressContentEditableWarning={true}
                onFocus={() => {
                  setEditingTextIndex(i);
                  setSelectedElement(i);
                }}
                onBlur={(e) => {
                  updateElement(i, { content: e.target.innerHTML });
                  setEditingTextIndex(null);
                }}
                onMouseUp={() => {
                  const sel = window.getSelection();
                  if (sel && !sel.isCollapsed) {
                    setSelectedElement(i);
                  }
                }}
                style={{
                  fontSize: el.fontSize,
                  fontFamily: el.fontFamily,
                  fontWeight: el.bold ? "bold" : "normal",
                  fontStyle: el.italic ? "italic" : "normal",
                  color: el.color,
                  textAlign: el.align || "center",
                  transform: `rotate(${el.rotation || 0}deg)`,
                  transformOrigin: "center",
                  width: "100%",
                  height: "100%",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  cursor: editingTextIndex === i ? "text" : "pointer",
                  padding: 6,
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: el.content }} />
              </div>
            )}

            {/* IMAGE / STICKER */}
            {(el.type === "image" || el.type === "sticker") && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `rotate(${el.rotation || 0}deg)`,
                  transformOrigin: "center",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                <img
                  src={el.src}
                  alt=""
                  draggable="false"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: el.borderRadius || 0,
                    display: "block",
                    objectFit: "cover",
                    boxSizing: "border-box",
                    border:
                      el.border && el.border.width
                        ? `${el.border.width}px ${el.border.style || "solid"} ${el.border.color || "#000"}`
                        : "none",
                  }}
                />
              </div>
            )}

            {/* SHAPES */}
            {el.type === "shape" && (
              <>
                {el.shape === "rectangle" && (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: el.backgroundColor,
                      opacity: el.opacity,
                      border: `${el.border?.width || 1}px ${el.border?.style || "solid"} ${el.border?.color || "#000"}`,
                      borderRadius: el.borderRadius || 0,
                      transform: `rotate(${el.rotation || 0}deg)`,
                      transformOrigin: "center",
                      boxSizing: "border-box",
                    }}
                  />
                )}

                {el.shape === "arrow" && (
                  // container rotates via CSS so arrow follows rotation
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `rotate(${el.rotation || 0}deg)`,
                      transformOrigin: "center",
                      boxSizing: "border-box",
                      overflow: "visible",
                    }}
                  >
                    {renderArrowSVG(el, i)}
                  </div>
                )}
              </>
            )}
          </Rnd>
        ))}
      </div>

      {/* SIDEBAR */}
      <div className="canvas-right" style={{ width: "30%", padding: 12 }}>
        <h3>Search Stickers</h3>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: 6, marginBottom: 8 }}
        />
        <div
          className="canvas-stickers-list"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 200, overflowY: "auto" }}
        >
          {stickers.map((s) => (
            <img
              key={s.id}
              src={s.src}
              alt="sticker"
              className="canvas-sticker-item"
              onClick={() => addImage(s.src)}
              style={{ width: 60, height: 60, objectFit: "cover", cursor: "pointer", borderRadius: 6 }}
            />
          ))}
        </div>

        <h3>Components</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}} onClick={addText}>Text</button>
          <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}} onClick={() => addShape("rectangle")}>Rectangle</button>
          <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}} onClick={() => addShape("arrow")}>Arrow</button>
          <label
            className="canvas-upload-btn"
            style={{ cursor: "pointer", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 4 }}
          >
            Upload Image
            <input type="file" accept="image/*" onChange={addLocalImage} hidden />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={saveCanvas} className="canvas-save-btn">
            Save Page
          </button>
        </div>
      </div>

      {/* SELECTED ELEMENT CONTROLS */}
      {selectedElement !== null && elements[selectedElement] && (
        <div
          className="canvas-element-controls"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            background: "#000000ff",
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 8,
            zIndex: 9999,
            width: 360,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <h4 style={{ marginTop: 0 }}>Element Controls</h4>

          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}}
 onClick={() => bringForward(selectedElement)}>Bring Forward</button>
            <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}} onClick={() => sendBackward(selectedElement)}>Send Backward</button>
            <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}}
              onClick={() => {
                deleteElement(selectedElement);
              }}
            >
              Delete
            </button>
          </div>

          {/* COMMON: rotation & border radius */}
          {(elements[selectedElement]?.type === "image" ||
            elements[selectedElement]?.type === "sticker" ||
            elements[selectedElement]?.type === "shape") && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
                Rotate (deg):
                <input
                  type="number"
                  value={elements[selectedElement].rotation || 0}
                  onChange={(e) => updateElement(selectedElement, { rotation: parseInt(e.target.value || 0) })}
                  style={{ width: 90 }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
                Border Radius:
                <input
                  type="number"
                  value={elements[selectedElement].borderRadius || 0}
                  onChange={(e) => updateElement(selectedElement, { borderRadius: parseInt(e.target.value || 0) })}
                  style={{ width: 90 }}
                />
              </label>
            </div>
          )}

          {/* TEXT CONTROLS */}
          {elements[selectedElement]?.type === "text" && (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
                  Font Size:
                  <input
                    type="number"
                    value={elements[selectedElement].fontSize}
                    onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value || 1) })}
                    style={{ width: 90 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
                  Font:
                  <select
                    value={elements[selectedElement].fontFamily}
                    onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                    style={{
    backgroundColor: "#2c1a4d",   // dark background
    color: "#fff",                // white text
    border: "2px solid #9b59b6", // violet outline
    borderRadius: "8px",          // rounded corners
    padding: "6px 12px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",           // remove default arrow in some browsers
    WebkitAppearance: "none",
    MozAppearance: "none"
  }}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Cursive">Cursive</option>
                    <option value="Brush Script MT">Brush Script MT</option>
                  </select>
                </label>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>Color:</div>
                <HexColorPicker
                  color={elements[selectedElement].color}
                  onChange={(color) => updateElement(selectedElement, { color })}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={elements[selectedElement].bold}
                    onChange={(e) => updateElement(selectedElement, { bold: e.target.checked })}
                  />{" "}
                  Bold (block)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={elements[selectedElement].italic}
                    onChange={(e) => updateElement(selectedElement, { italic: e.target.checked })}
                  />{" "}
                  Italic (block)
                </label>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 6 }}>Inline formatting (select text in the box, then click):</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}}
                    onClick={() => {
                      execFormat("bold");
                    }}
                  >
                    Bold
                  </button>
                  <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}}
                    onClick={() => {
                      execFormat("italic");
                    }}
                  >
                    Italic
                  </button>
                  <button style={{
  background: "linear-gradient(90deg, #d365ffff, #a30effff)", // gradient
  color: "#fff", // text color
  border: "none",
  borderRadius: "8px", // rounded corners
  padding: "6px 12px", // spacing inside button
  cursor: "pointer",
}} onClick={applyLink}>Add Link</button>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label>
                  Align:
                  <select
                    value={elements[selectedElement].align || "center"}
                    onChange={(e) => updateElement(selectedElement, { align: e.target.value })}
                    style={{
    backgroundColor: "#2c1a4d",   // dark background
    color: "#fff",                // white text
    border: "2px solid #9b59b6", // violet outline
    borderRadius: "8px",          // rounded corners
    padding: "6px 12px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",           // remove default arrow in some browsers
    WebkitAppearance: "none",
    MozAppearance: "none"
  }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </label>
              </div>
            </>
          )}

          {/* SHAPE: RECTANGLE CONTROLS */}
          {elements[selectedElement]?.type === "shape" && elements[selectedElement].shape === "rectangle" && (
            <>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "flex", flexDirection: "column" }}>
                  Background Color:
                  <HexColorPicker
                    color={elements[selectedElement].backgroundColor || "#cccccc"}
                    onChange={(color) => updateElement(selectedElement, { backgroundColor: color })}
                  />
                </label>
              </div>

              <div style={{ marginTop: 8 }}>
                <label>
                  Opacity:
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={elements[selectedElement].opacity || 1}
                    onChange={(e) => updateElement(selectedElement, { opacity: parseFloat(e.target.value || 1) })}
                    style={{ width: 90, marginLeft: 8 }}
                  />
                </label>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <label>
                  Border Width:
                  <input
                    type="number"
                    value={elements[selectedElement].border?.width || 1}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        border: { ...elements[selectedElement].border, width: parseInt(e.target.value || 1) },
                      })
                    }
                    style={{ width: 90, marginLeft: 8 }}
                  />
                </label>

                <label>
                  Border Style:
                  <select
                    value={elements[selectedElement].border?.style || "solid"}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        border: { ...elements[selectedElement].border, style: e.target.value },
                      })
                    }
                    style={{
    backgroundColor: "#2c1a4d",   // dark background
    color: "#fff",                // white text
    border: "2px solid #9b59b6", // violet outline
    borderRadius: "8px",          // rounded corners
    padding: "6px 12px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",           // remove default arrow in some browsers
    WebkitAppearance: "none",
    MozAppearance: "none"
  }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>Border Color:</div>
                <HexColorPicker
                  color={elements[selectedElement].border?.color || "#000"}
                  onChange={(color) =>
                    updateElement(selectedElement, { border: { ...elements[selectedElement].border, color } })
                  }
                />
              </div>
            </>
          )}

          {/* ARROW CONTROLS */}
          {elements[selectedElement]?.type === "shape" && elements[selectedElement].shape === "arrow" && (
            <>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={!!elements[selectedElement].curved}
                    onChange={(e) => updateElement(selectedElement, { curved: e.target.checked })}
                  />
                  Curved Arrow
                </label>
              </div>

              {elements[selectedElement].curved && (
                <div style={{ marginTop: 8 }}>
                  <label>
                    Curve Offset:
                    <input
                      type="number"
                      value={elements[selectedElement].curveOffset || -40}
                      onChange={(e) => updateElement(selectedElement, { curveOffset: parseInt(e.target.value || -40) })}
                      style={{ width: 120, marginLeft: 8 }}
                    />
                  </label>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>Color:</div>
                <HexColorPicker
                  color={elements[selectedElement].color || "#000"}
                  onChange={(color) => updateElement(selectedElement, { color })}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <label>
                  Stroke Width:
                  <input
                    type="number"
                    value={elements[selectedElement].border?.width || 3}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        border: { ...elements[selectedElement].border, width: parseInt(e.target.value || 3) },
                      })
                    }
                    style={{ width: 100, marginLeft: 8 }}
                  />
                </label>
              </div>
            </>
          )}

          {/* IMAGE / STICKER CONTROLS (added border controls here) */}
          {(elements[selectedElement]?.type === "image" || elements[selectedElement]?.type === "sticker") && (
            <>
              <div style={{ marginTop: 8 }}>
                
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <label>
                  Border Width:
                  <input
                    type="number"
                    value={elements[selectedElement].border?.width || 0}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        border: { ...elements[selectedElement].border, width: parseInt(e.target.value || 0) },
                      })
                    }
                    style={{ width: 90, marginLeft: 8 }}
                  />
                </label>

                <label>
                  Border Style:
                  <select
                    value={elements[selectedElement].border?.style || "solid"}
                    onChange={(e) =>
                      updateElement(selectedElement, {
                        border: { ...elements[selectedElement].border, style: e.target.value },
                      })
                    }
                    style={{
    backgroundColor: "#2c1a4d",   // dark background
    color: "#fff",                // white text
    border: "2px solid #9b59b6", // violet outline
    borderRadius: "8px",          // rounded corners
    padding: "6px 12px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
    appearance: "none",           // remove default arrow in some browsers
    WebkitAppearance: "none",
    MozAppearance: "none"
  }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>Border Color:</div>
                <HexColorPicker
                  color={elements[selectedElement].border?.color || "#000"}
                  onChange={(color) =>
                    updateElement(selectedElement, { border: { ...elements[selectedElement].border, color } })
                  }
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* CROP MODAL */}
      {showCrop && (
        <div
          className="canvas-crop-modal"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div style={{ width: "80%", height: "70%", background: "#fff", padding: 12, borderRadius: 8 }}>
            <Cropper
              image={cropSettings.src}
              crop={cropSettings.crop}
              zoom={cropSettings.zoom}
              aspect={1}
              onCropChange={(crop) => setCropSettings({ ...cropSettings, crop })}
              onZoomChange={(zoom) => setCropSettings({ ...cropSettings, zoom })}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={applyCrop}>Apply Crop</button>
              <button onClick={() => setShowCrop(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
