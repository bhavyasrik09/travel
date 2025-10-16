import React, { useState, useEffect, useRef } from "react";
import "./Diary.css";
import Canvas from "./Canvas";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import API_BASE_URL from "../api";
function Diary() {
  const [pages, setPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingPage, setEditingPage] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [showTitleInput, setShowTitleInput] = useState(false);
  const token = localStorage.getItem("token");
  const pageRef = useRef();

  // Fetch pages from backend
  useEffect(() => {
    const fetchPages = async () => {
      if (!token) return console.error("User not logged in");
      try {
        const res = await fetch(`${API_BASE_URL}/api/diary`, {
          headers: { "x-auth-token": token },
        });
        if (!res.ok) return console.error("Failed to fetch pages");
        const data = await res.json();
        setPages(data || []);
        setCurrentIndex(0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPages();
  }, [token]);

  // Open Canvas editor
  const openCanvas = (index) => {
    const page = pages[index];
    if (!page || !page.title) {
      setShowTitleInput(true);
      setNewTitle("");
      setCurrentIndex(index);
    } else {
      setEditingPage({ pageIndex: index, pageTitle: page.title });
    }
  };

  // Submit new title
  const handleTitleSubmit = async () => {
    if (!newTitle.trim()) return alert("Please enter a title.");
    setShowTitleInput(false);

    try {
      const formData = new FormData();
      formData.append("title", newTitle);
      formData.append("pageIndex", currentIndex);

      const res = await fetch(`${API_BASE_URL}/api/diary`, {
        method: "POST",
        headers: { "x-auth-token": token },
        body: formData,
      });
      if (!res.ok) return console.error("Failed to save page title");

      const savedPage = await res.json();
      setPages((prev) => {
        const copy = [...prev];
        copy[currentIndex] = savedPage;
        return copy;
      });

      setEditingPage({ pageIndex: currentIndex, pageTitle: savedPage.title });
    } catch (err) {
      console.error(err);
    }
  };

  // Save Canvas content
  const handleSaveCanvas = async (imageData, pageIndex, title) => {
    const formData = new FormData();
    formData.append("image", imageData);
    formData.append("title", title);
    formData.append("pageIndex", pageIndex);

    try {
      const res = await fetch(`${API_BASE_URL}/api/diary`, {
        method: "POST",
        headers: { "x-auth-token": token },
        body: formData,
      });
      if (!res.ok) return console.error("Failed to save page");

      const updatedPage = await res.json();
      setPages((prev) => {
        const copy = [...prev];
        copy[pageIndex] = updatedPage;
        return copy;
      });

      setEditingPage(null);
      setCurrentIndex(pageIndex);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete page
  const handleDeletePage = async () => {
    const page = pages[currentIndex];
    if (!page || !page._id) return alert("No page selected or invalid page.");
    if (!window.confirm(`Delete "${page.title || "this page"}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/diary/${page._id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      });
      if (!res.ok) return console.error("Failed to delete page");

      setPages((prev) => prev.filter((_, i) => i !== currentIndex));
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error(err);
    }
  };

  // Export current page as PDF
const exportAsPDF = async () => {
  if (!pages || pages.length === 0) return alert("No pages to export!");

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page.image) continue; // skip pages without image

    // Add title
    pdf.setFontSize(16);
    pdf.text(page.title || "Untitled Page", margin, 15);

    // Load image
    const img = new Image();
    img.src = page.image;

    // Using await inside loop to ensure image loads
    await new Promise((resolve) => {
      img.onload = () => {
        const availableWidth = pdfWidth - 2 * margin;
        const aspectRatio = img.height / img.width;
        const imgHeight = availableWidth * aspectRatio;

        pdf.addImage(img, "PNG", margin, 25, availableWidth, imgHeight);

        // Add new page if not last page
        if (i < pages.length - 1) pdf.addPage();

        resolve();
      };
      img.onerror = () => {
        console.error("Failed to load image for page", i);
        resolve();
      };
    });
  }

  pdf.save("My_Diary.pdf");
};


  // Determine if Next button should be enabled
  const canGoNext = () => {
    const page = pages[currentIndex];
    // Enable Next if page exists AND has title or image
    return page && (page.title || page.image);
  };

  return (
    <div className="diary-container">
      <h2>My Personal Diary</h2>

      {/* Top controls: Previous, Export, Next */}
      <div className="top-controls">
        <button
          className="nav-btn"
          onClick={() => setCurrentIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ⬅️ Previous
        </button>

        {pages[currentIndex] && (
          <button className="export-pdf-btn" onClick={exportAsPDF}>
            📄 Export as PDF
          </button>
        )}

        <button
          className="nav-btn"
          onClick={() => setCurrentIndex(currentIndex + 1)}
          disabled={!canGoNext()}
        >
          Next ➡️
        </button>
      </div>

      {/* Title input overlay */}
      {showTitleInput && (
        <div className="title-input-overlay">
          <div className="title-input-box">
            <h3>Enter Page Title</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="My Day at the Beach..."
            />
            <div className="title-input-actions">
              <button onClick={handleTitleSubmit}>Continue</button>
              <button onClick={() => setShowTitleInput(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas editor */}
      {editingPage ? (
        <Canvas
          initialData={pages[editingPage.pageIndex]}
          pageIndex={editingPage.pageIndex}
          pageTitle={editingPage.pageTitle}
          onSave={handleSaveCanvas}
          onCancel={() => setEditingPage(null)}
        />
      ) : (
        <div className="diary-main">
          {/* Page display */}
          <div className="diary-page-display" ref={pageRef}>
            {pages[currentIndex] ? (
              <>
                <h3 className="diary-page-title">
                  {pages[currentIndex].title || "Untitled Page"}
                </h3>
                {pages[currentIndex].image ? (
                  <img
                    src={pages[currentIndex].image}
                    alt={pages[currentIndex].title}
                    className="diary-page-image"
                    onClick={() => openCanvas(currentIndex)}
                  />
                ) : (
                  <div
                    className="diary-page-placeholder"
                    onClick={() => openCanvas(currentIndex)}
                  >
                    Click to edit this page
                  </div>
                )}
              </>
            ) : (
              <div
                className="diary-page-placeholder"
                onClick={() => openCanvas(currentIndex)}
              >
                Click to create this page
              </div>
            )}
          </div>

          {/* Actions */}
          {pages[currentIndex] && (
            <div className="diary-actions">
              <button
                className="delete-btn"
                onClick={handleDeletePage}
                title="Delete this page"
              >
                🗑️ Delete Entry
              </button>
            </div>
          )}

          {/* Sidebar */}
          <div className="diary-sidebar">
            <h3>Pages</h3>
            <div className="diary-sidebar-list">
              {pages.map((p, i) => (
                <div
                  key={p._id || i}
                  className={`diary-sidebar-item ${i === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(i)}
                >
                  {p.title || "Untitled Page"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Diary;
