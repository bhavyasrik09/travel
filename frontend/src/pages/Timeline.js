import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Timeline.css";
import API_BASE_URL from "../api";
export default function Timeline() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Make entire page background black
  useEffect(() => {
    document.body.style.backgroundColor = "black";
    document.body.style.color = "white";
    document.documentElement.style.backgroundColor = "black"; // html element

    return () => {
      // cleanup: reset when component unmounts
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/mine`, {
          headers: { "x-auth-token": token },
        });
        const data = await res.json();
        if (res.ok) {
          const sortedPosts = (data.posts || []).sort(
            (a, b) =>
              new Date(b.date || b.createdAt) -
              new Date(a.date || a.createdAt)
          );
          setPosts(sortedPosts);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [token]);

  if (loading)
    return <p style={{ textAlign: "center", marginTop: 50 }}>Loading timeline...</p>;
  if (posts.length === 0)
    return <p style={{ textAlign: "center", marginTop: 50 }}>No posts yet.</p>;

  return (
    <div className="timeline-container" style={{ minHeight: "100vh", padding: "20px" }}>
      <h1 className="timeline-title">Your Travel Timeline</h1>

      <div className="timeline-items-wrapper">
        <div className="timeline-line"></div>

        <div className="timeline-items">
          {posts.map((post, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div key={post._id} className={`timeline-item ${isLeft ? "left" : "right"}`}>
                <div className="timeline-connector"></div>
                <div className="timeline-dot"></div>

                <div
                  className="timeline-content"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  <img
                    src={post.images?.[0] || "https://via.placeholder.com/120"}
                    alt={post.title}
                  />
                  <div className="timeline-text">
                    <h2>{post.title}</h2>
                    <p className="timeline-date">
                      {new Date(post.date || post.createdAt).toLocaleDateString()}
                    </p>
                    <p>{post.location || "Unknown location"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
