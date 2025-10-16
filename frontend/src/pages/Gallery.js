import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";
export default function PhotoGallery() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${API_BASE_URL}/uploads/${img}`;

  };

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/posts`, {

          headers: { "x-auth-token": token },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.msg || "Failed to fetch posts");
        } else {
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error(err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading)
    return <p style={styles.loading}>Loading gallery...</p>;
  if (error)
    return <p style={styles.error}>{error}</p>;
  if (posts.length === 0)
    return <p style={styles.empty}>No images to display.</p>;

  // Flatten all images with post id
  const images = posts.flatMap(post =>
    post.images?.map(img => ({ img, postId: post._id })) || []
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gallery</h1>
      <div style={styles.grid}>
        {images.map(({ img, postId }, idx) => (
          <div
            key={idx}
            style={styles.item}
            onClick={() => navigate(`/post/${postId}`)}
          >
            <img
              src={getImageUrl(img)}
              alt="Post"
              style={styles.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Inline CSS Styles =====
const styles = {
  container: {
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: "#0d1117",
    color: "#f1f1f1",
    fontFamily: "'Poppins', sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "30px",
    color: "#ff7f50",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "15px",
    justifyItems: "center",
  },
  item: {
    width: "100%",
    cursor: "pointer",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 15px rgba(255,127,80,0.3)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  image: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  loading: {
    textAlign: "center",
    color: "#ff7f50",
    fontSize: "18px",
    marginTop: "100px",
  },
  error: {
    textAlign: "center",
    color: "#ff4f4f",
    fontSize: "18px",
    marginTop: "100px",
  },
  empty: {
    textAlign: "center",
    color: "#aaa",
    fontSize: "18px",
    marginTop: "100px",
  },
};

// ===== Hover Effect using React inline style trick =====
document.addEventListener("mouseover", (e) => {
  if (e.target.tagName === "IMG" && e.target.parentNode.style) {
    e.target.style.transform = "scale(1.05)";
    e.target.parentNode.style.boxShadow = "0 6px 20px rgba(255,127,80,0.5)";
  }
});
document.addEventListener("mouseout", (e) => {
  if (e.target.tagName === "IMG" && e.target.parentNode.style) {
    e.target.style.transform = "scale(1)";
    e.target.parentNode.style.boxShadow = "0 4px 15px rgba(255,127,80,0.3)";
  }
});
