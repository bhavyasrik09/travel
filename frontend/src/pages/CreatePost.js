import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import API_BASE_URL from "../api";
function CreatePost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  // --- Tags ---
  const handleTagKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  const removeTag = (index) => setTags(prev => prev.filter((_, i) => i !== index));

  // --- Images ---
  const handleFiles = (files) => {
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Login required");
    if (!title.trim() || !content.trim()) return setMessage("Title and content are required");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content);
    images.forEach(img => formData.append("images", img));
    if (location) formData.append("location", location.trim());
    if (tags.length > 0) formData.append("tags", JSON.stringify(tags));

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: { "x-auth-token": token },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Post created successfully!");
        setTitle(""); setContent(""); setImages([]); setPreviews([]);
        setTags([]); setTagInput(""); setLocation("");
      } else setMessage(data.msg || "Error creating post");
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  // --- Styles ---
  const dropAreaStyle = {
  border: `2px dashed ${isDragging ? "#0056b3" : "#007BFF"}`,
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: isDragging ? "#e6f0ff" : "#edccfaff",
  transition: "0.3s ease",
  color: isDragging ? "#0056b3" : "#007BFF",
  fontWeight: 500,
  marginBottom: "20px",
  width: "100%",
  boxSizing: "border-box", // ensures padding doesn't overflow
  minHeight: "80px",       // always visible
};


  const inputStyle = {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    fontSize: "16px",
  };

  const previewContainerStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap", // multiple rows
    padding: "10px 0",
  };

  const previewImageStyle = {
    width: "120px",
    height: "120px",
    borderRadius: "8px",
    objectFit: "cover",
    transition: "transform 0.3s",
  };

  return (
    <div className="create-post-container" style={{ maxWidth: "900px", width: "95%", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Create New Post</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">

        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required />
        <input type="text" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />

        {/* Tags */}
        <div style={{ margin: "10px 0" }}>
          <label>Tags:</label>
          <input
            type="text"
            placeholder="Type a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "5px" }}>
            {tags.map((tag, i) => (
              <div key={i} style={{ background: "#007BFF", color: "#fff", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", fontSize: "14px" }}>
                {tag}<span onClick={() => removeTag(i)} style={{ marginLeft: "6px", cursor: "pointer", fontWeight: "bold" }}>×</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rich Text Editor */}
        <div style={{ margin: "20px 0" }}>
          <ReactQuill 
            theme="snow" 
            value={content} 
            onChange={setContent} 
            modules={quillModules} 
            placeholder="Write your content..." 
            style={{ height: "350px", marginBottom: "50px" }}
          />
        </div>

        {/* Drag & Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          style={dropAreaStyle}
          onClick={() => fileInputRef.current.click()}
        >
          {isDragging ? "Release to upload images" : "Drag & drop images here or click to select"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Image Previews */}
        <div style={previewContainerStyle}>
          {previews.map((p, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={p}
                alt="preview"
                style={{ ...previewImageStyle, cursor: "pointer" }}
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  border: "none",
                  width: "22px",
                  height: "22px",
                  cursor: "pointer",
                }}
              >×</button>
            </div>
          ))}
        </div>

        <button type="submit" style={{ padding: "12px 30px", fontSize: "16px", borderRadius: "8px", background: "#9b59b6", color: "#fff", border: "none", cursor: "pointer" }}>Post</button>
      </form>
      {message && <p style={{ marginTop: "15px", color: "green", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}

export default CreatePost;
