import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import "./TravelBucketList.css";
import API_BASE_URL from "../api";
function TravelBucketList() {
  const [bucketItems, setBucketItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [imageFiles, setImageFiles] = useState({});
  const [hoveredPlace, setHoveredPlace] = useState(null);
  const [view, setView] = useState("bucket"); // "bucket" | "gallery"
  const token = localStorage.getItem("token");
  const globeRef = useRef();

  // Fetch travel items
  const fetchItems = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/travel`, {
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBucketItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Get coordinates for a place
  const getCoordinates = async (place) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          place
        )}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0)
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      return { latitude: null, longitude: null };
    } catch (err) {
      console.error(err);
      return { latitude: null, longitude: null };
    }
  };

  // Add new destination
  const handleAdd = async () => {
    if (!newItem.trim()) return;
    const coords = await getCoordinates(newItem);
    try {
      const res = await fetch(`${API_BASE_URL}/api/travel`, {
        method: "POST",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newItem,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      const data = await res.json();
      setBucketItems((prev) => [...prev, data]);
      setNewItem("");
    } catch (err) {
      console.error(err);
    }
  };

  // Handle drag & drop or file select
  const handleImageDrop = (e, itemId) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setImageFiles((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), ...files],
      }));
    }
  };

  const handleImageChange = (e, itemId) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), ...files],
      }));
    }
  };

  // Mark destination as completed with uploaded images
  const markCompleted = async (item) => {
    try {
      let imageUrls = item.images || [];
      const files = imageFiles[item._id];

      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("images", file));

        const res = await fetch(
         `${API_BASE_URL}/api/travel/upload/${item._id}`,

          {
            method: "POST",
            headers: { "x-auth-token": token },
            body: formData,
          }
        );
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        imageUrls = [...imageUrls, ...(data.uploadedImages || [])];
      }

      
const res2 = await fetch(`${API_BASE_URL}/api/travel/${item._id}`, {
        method: "PUT",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, images: imageUrls }),
      });
      if (!res2.ok) throw new Error("Failed to mark completed");
      const updated = await res2.json();

      setBucketItems((prev) =>
        prev.map((i) => (i._id === item._id ? updated : i))
      );
      setImageFiles((prev) => {
        const copy = { ...prev };
        delete copy[item._id];
        return copy;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete destination
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/travel/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setBucketItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const completed = bucketItems
    .filter((i) => i.latitude && i.longitude && i.completed)
    .sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

  const globeMarkers = bucketItems
    .filter((i) => i.latitude && i.longitude)
    .map((i) => ({
      lat: i.latitude,
      lng: i.longitude,
      size: 1.5,
      color: i.completed ? "#ff3333" : "#3b82f6",
      title: i.title,
      completed: i.completed,
      image: i.images?.[0],
    }));

  const threadPositions = completed.map((i) => [i.latitude, i.longitude]);

  if (view === "gallery") {
    return (
      <div className="gallery-page">
  <button className="back-btn" onClick={() => setView("bucket")}>
    ⬅ Back to Bucket List
  </button>
  <h2>🌍 Travel Gallery</h2>

  <div className="gallery-container">
    {bucketItems
      .filter((i) => i.images && i.images.length > 0)
      .map((item) => (
        <div key={item._id} className="gallery-item">
          <h3>{item.title}</h3>
          <div className="gallery-images">
            {item.images.map((img, idx) => (
              <img key={idx} src={img} alt={item.title} />
            ))}
          </div>
        </div>
      ))}
  </div>
</div>

    );
  }

  return (
    <div className="bucket-page">
      <div className="top-bar">
        <h2>My Travel Bucket List ✈️</h2>
        <button className="gallery-btn" onClick={() => setView("gallery")}>
          📸 Gallery
        </button>
      </div>

      <div className="bucket-layout">
        {/* Left scrollable list */}
        <div className="bucket-list-container">
          <div className="bucket-add">
            <input
              type="text"
              placeholder="Add a new destination..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <button onClick={handleAdd}>Add</button>
          </div>

          <div className="bucket-items scrollable">
            {bucketItems.length === 0 ? (
              <p>No destinations yet.</p>
            ) : (
              bucketItems.map((item) => (
                <div
                  key={item._id}
                  className={`bucket-card ${item.completed ? "completed" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleImageDrop(e, item._id)}
                >
                  <span className="destination">{item.title}</span>
                  <div className="actions">
                    {!item.completed && (
                      <>
                        <label className="upload-box">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleImageChange(e, item._id)}
                          />
                          Drag or select images
                        </label>
                        <button
                          className="mark-btn"
                          onClick={() => markCompleted(item)}
                        >
                          Mark Completed
                        </button>
                      </>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item._id)}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Image previews */}
                  {imageFiles[item._id]?.length > 0 && (
                    <div className="preview-grid">
                      {imageFiles[item._id].map((file, idx) => (
                        <img
                          key={idx}
                          src={URL.createObjectURL(file)}
                          alt="preview"
                        />
                      ))}
                    </div>
                  )}

                  {item.completed && item.images?.length > 0 && (
                    <div className="uploaded-info">
                      <small>{item.images.length} images uploaded ✔️</small>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side Globe */}
        <div className="globe-container">
          <Globe
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            pointsData={globeMarkers}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.02}
            pointRadius={0.6}
            backgroundColor="rgba(0,0,0,0)"
            pointLabel={(p) => `${p.title}`}
            onPointHover={setHoveredPlace}
            arcsData={threadPositions.map((pos, idx) => ({
              startLat: idx === 0 ? pos[0] : threadPositions[idx - 1][0],
              startLng: idx === 0 ? pos[1] : threadPositions[idx - 1][1],
              endLat: pos[0],
              endLng: pos[1],
              color: () => "#ff0000",
              stroke: 2.5,
            }))}
            arcDashLength={0.7}
            arcDashGap={0.15}
            arcDashAnimateTime={3500}
          />

          {hoveredPlace && (
            <div className="tooltip">
              <h4>{hoveredPlace.title}</h4>
              <span
                className={
                  hoveredPlace.completed ? "badge completed" : "badge pending"
                }
              >
                {hoveredPlace.completed ? "Completed" : "Planned"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TravelBucketList;
