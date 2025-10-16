import React, { useEffect, useState } from "react";
import API_BASE_URL from "../api";
const API_KEY = "5ae2e3f221c38a28845f05b6ad120fcb68f844c42867dc8333fd00d3";

function MustVisit() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const unwantedKinds = [
    "nightclubs",
    "adult",
    "bars",
    "pubs",
    "theatres_and_entertainments",
    "unclassified_objects",
  ];

  const fetchPlaces = async (keyword = "", start = 0) => {
    setLoading(true);
    try {
      // Step 1: Get coordinates for keyword/city if provided, else default to Paris
      let lat = 48.8566,
        lon = 2.3522;

      if (keyword) {
        const geoRes = await fetch(
          `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(
            keyword
          )}&apikey=${API_KEY}`
        );
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lon) {
          lat = geoData.lat;
          lon = geoData.lon;
        }
      }

      // Step 2: Fetch places within radius
      const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=${LIMIT}&offset=${start}&format=json&apikey=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data || data.length === 0) {
        if (start === 0) setPlaces([]);
        setLoading(false);
        return;
      }

      // Step 3: Fetch details for each place and filter unwanted kinds
      const results = [];
      for (const p of data) {
        try {
          const detailRes = await fetch(
            `https://api.opentripmap.com/0.1/en/places/xid/${p.xid}?apikey=${API_KEY}`
          );
          const detailData = await detailRes.json();
          const kindsArray = (detailData.kinds || "").split(",");
          const hasUnwanted = kindsArray.some((k) => unwantedKinds.includes(k));
          if (hasUnwanted) continue;

          results.push({
            id: p.xid,
            title: p.name || "Unnamed place",
            extract:
              detailData.wikipedia_extracts?.text ||
              detailData.info?.descr ||
              "No description available",
            lat: detailData.point?.lat || p.point?.lat || lat,
            lon: detailData.point?.lon || p.point?.lon || lon,
            thumbnail: detailData.preview?.source || "https://via.placeholder.com/250x150?text=No+Image",
          });
        } catch (err) {
          console.error("Error fetching place details:", err);
        }
      }

      if (start === 0) setPlaces(results);
      else setPlaces((prev) => [...prev, ...results]);
    } catch (err) {
      console.error("Error fetching places:", err);
      alert("Could not fetch places. Try another keyword or city.");
    } finally {
      setLoading(false);
    }
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (index) => setTags((prev) => prev.filter((_, i) => i !== index));

  const handleFind = () => {
    if (tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      fetchPlaces(lastTag, 0);
      setOffset(0);
    }
  };

  const handleLoadMore = () => {
    const lastTag = tags.length > 0 ? tags[tags.length - 1] : "";
    fetchPlaces(lastTag, offset + LIMIT);
    setOffset(offset + LIMIT);
  };

  return (
    <div style={{ padding: "20px", color: "#fff", maxWidth: "1100px", margin: "0 auto" }}>
      <h2 style={{ color: "#9b59b6", marginBottom: "15px" }}>Must Visit Places</h2>

      {/* Tags input */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Type keyword and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
        <button
          onClick={handleFind}
          style={{
            backgroundColor: "#9b59b6",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            border: "none",
          }}
        >
          Find
        </button>
      </div>

      {/* Tags display */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {tags.map((tag, index) => (
          <div
            key={index}
            style={{
              background: "#2a1f3f",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              color: "#ffeb3b",
              display: "flex",
              alignItems: "center",
            }}
          >
            {tag}
            <span
              onClick={() => removeTag(index)}
              style={{ marginLeft: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              ×
            </span>
          </div>
        ))}
      </div>

      {/* Places grid */}
      {loading ? (
        <p>Loading...</p>
      ) : places.length === 0 ? (
        <p style={{ color: "#ffeb3b" }}>No places found for the selected keyword.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "15px",
            alignItems: "start",
          }}
        >
          {places.map((place) => (
            <div
              key={place.id}
              style={{
                background: "#1e1e1e",
                borderRadius: "12px",
                padding: "15px",
                boxShadow: "0 0 12px rgba(155,89,182,0.4)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                height: "350px",
              }}
            >
              <h3 style={{ color: "#9b59b6", fontSize: "1rem", margin: 0 }}>{place.title}</h3>
              <img
                src={place.thumbnail}
                alt={place.title}
                style={{ width: "100%", height: "150px", borderRadius: "8px", objectFit: "cover" }}
              />
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#ddd",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {place.extract}
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "auto", flexWrap: "wrap" }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#ff8c00",
                    color: "#fff",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                  }}
                >
                  📍 Map
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {places.length >= LIMIT && !loading && (
        <button
          onClick={handleLoadMore}
          style={{
            marginTop: "20px",
            backgroundColor: "#9b59b6",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            border: "none",
          }}
        >
          Load More
        </button>
      )}
    </div>
  );
}

export default MustVisit;
