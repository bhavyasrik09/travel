import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import "./PostCard.css";
import API_BASE_URL from "../api";
function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // Fetch user posts
  const fetchMyPosts = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/mine`, {
        headers: { "x-auth-token": token },
      });
      const data = await res.json();
      if (res.ok) {
        const sortedPosts = (data.posts || []).sort(
          (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );
        setPosts(sortedPosts);
      }
    } catch (err) {
      console.error("Error fetching user posts:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  // Delete a post
  const handleDelete = async (id) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      });
      if (res.ok) fetchMyPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // Filter posts by search
  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Helper to get image URL
  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${API_BASE_URL}/uploads/${img}`;

  };

  if (loading) return <p>Loading your posts...</p>;

  return (
    <div className="profile-view-container">
      <h2>My Posts</h2>

      <input
        type="text"
        placeholder="Search your posts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {filteredPosts.length === 0 ? (
        <p>You haven’t posted anything yet.</p>
      ) : (
        filteredPosts.map((post) => (
          <div key={post._id} className="post-item">
            {/* Author and Date */}
            <div className="post-author">
              <span className="author-name" style={{ fontWeight: 500 }}>
                You
              </span>
              <span className="post-date">
                {new Date(post.date || post.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Post Main */}
            <div className="post-main" style={{ display: "flex", gap: "15px" }}>
              {post.images?.length > 0 && (
                <div style={{ flexShrink: 0 }}>
                  <img
                    src={getImageUrl(post.images[0])}
                    alt={post.title}
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />
                  {post.images.length > 1 && (
                    <div style={{ display: "flex", gap: "5px", marginTop: "5px", flexWrap: "wrap" }}>
                      {post.images.slice(1, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img)}
                          alt=""
                          style={{ width: "60px", height: "50px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      ))}
                      {post.images.length > 4 && <span style={{ alignSelf: "center" }}>+{post.images.length - 4}</span>}
                    </div>
                  )}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h3>{post.title}</h3>
                <div
                  className="post-content"
                  style={{ color: "#f5f5f5" }}
                  dangerouslySetInnerHTML={{
                    __html:
                      post.content.length > 150
                        ? post.content.slice(0, 150) + '... <a href="#" style="color: yellow;">Read More →</a>'
                        : post.content,
                  }}
                ></div>

                <div className="post-tags-location">
                  {post.location && <span className="post-location">📍 {post.location}</span>}
                  {post.tags?.map((tag, idx) => (
                    <span key={idx} className="tag">#{tag}</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    onClick={() => navigate(`/edit/${post._id}`)}
                    style={{
                      background: "#007BFF",
                      color: "#fff",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    style={{
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🗑 Delete
                  </button>
                  <button
                    onClick={() => navigate(`/post/${post._id}`)}
                    style={{
                      background: "#28a745",
                      color: "#fff",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Read More
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyPosts;
