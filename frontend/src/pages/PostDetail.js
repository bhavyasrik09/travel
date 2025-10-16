import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PostDetail.css";
import API_BASE_URL from "../api";
export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const commentsEndRef = useRef(null);
  const imagesRef = useRef(null);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const getImageUrl = (img) => {
    if (!img) return null;
    return img.startsWith("http") ? img : `${API_BASE_URL}/uploads/${img}`;

  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
          headers: { "x-auth-token": token },
        });

        const text = await res.text();
        if (text.startsWith("<!DOCTYPE")) {
          setError("Route not found. Check your backend API path.");
          setLoading(false);
          return;
        }

        const data = JSON.parse(text);
        if (!res.ok) {
          setError(data.msg || "Failed to fetch post");
        } else {
          data.post.likes = Array.isArray(data.post.likes)
            ? data.post.likes.map((id) => id.toString())
            : [];
          data.post.savedBy = Array.isArray(data.post.savedBy)
            ? data.post.savedBy.map((id) => id.toString())
            : [];
          setPost(data.post);
        }
      } catch (err) {
        console.error(err);
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, token]);

  // 🔁 Auto-scrolling carousel
  useEffect(() => {
    if (!post || !post.images?.length) return;

    const container = imagesRef.current;
    let scrollAmount = 0;
    const speed = 1; // pixels per interval
    const scroll = () => {
      if (!container) return;
      container.scrollLeft += speed;
      scrollAmount += speed;
      // Reset halfway for infinite loop
      if (scrollAmount >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
        scrollAmount = 0;
      }
    };

    const interval = setInterval(scroll, 20);
    return () => clearInterval(interval);
  }, [post]);

  const handleLike = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/posts/${post._id}/like`,

        {
          method: "POST",
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        const updatedLikes = Array.isArray(data.likes)
          ? data.likes.map((id) => id.toString())
          : [];
        setPost((prev) => ({ ...prev, likes: updatedLikes }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Updated handleSave with local toggle and yellow color
  const handleSave = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/posts/${post._id}/save`,

        {
          method: "POST",
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error("Failed to save post");

      setPost((prev) => {
        const savedSet = new Set(prev.savedBy || []);
        if (savedSet.has(userId)) {
          savedSet.delete(userId); // unsave
        } else {
          savedSet.add(userId); // save
        }
        return { ...prev, savedBy: Array.from(savedSet) };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/posts/${post._id}/comment`,

        {
          method: "POST",
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: newComment }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPost((prev) => ({ ...prev, comments: data.comments }));
        setNewComment("");
        setCommentsExpanded(true);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="loading-text">Loading...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!post) return <p className="error-text">Post not found.</p>;

  const userLiked = post.likes?.includes(userId);
  const userSaved = post.savedBy?.includes(userId);

  const authorName = post.user?.name;
  const authorId = post.user?._id;

  return (
    <div className="post-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="post-header">
        <h2>{post.title}</h2>
        <p className="post-author">
          By{" "}
          {authorName ? (
            <span
              onClick={() => navigate(`/profile/${authorId}`)}
              style={{ color: "#9b59b6", cursor: "pointer" }}
            >
              {authorName}
            </span>
          ) : (
            <span style={{ color: "#9b59b6", cursor: "default" }}>
              Unknown
            </span>
          )}
        </p>
        <p className="post-date">
          {new Date(post.date || post.createdAt).toLocaleString()}
        </p>
      </div>

      {/* 🔁 Auto-scroll Carousel (2 images side by side) */}
      {post.images?.length > 0 && (
        <div className="post-images-container">
          <div className="post-images" ref={imagesRef}>
            {post.images.concat(post.images).map((img, idx) => (
              <img
                key={idx}
                src={getImageUrl(img)}
                alt={`post-img-${idx}`}
                className="post-detail-img"
              />
            ))}
          </div>
        </div>
      )}

      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.location && <p className="location">📍 {post.location}</p>}
      {post.tags?.length > 0 && (
        <div className="tags">
          {post.tags.map((tag, idx) => (
            <span key={idx} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button onClick={handleLike} className="like-btn">
          {userLiked ? "❤️ Liked" : "🤍 Like"} ({post.likes?.length || 0})
        </button>
        <button
          onClick={handleSave}
          className="save-btn"
          style={{
            backgroundColor: userSaved ? "#f1c40f" : "#fff",
            color: userSaved ? "#000" : "#333",
            border: "1px solid #ccc",
          }}
        >
          {userSaved ? "🔖 Saved" : "📑 Save"}
        </button>
      </div>

      <div
        className={`comments-section ${commentsExpanded ? "expanded" : ""}`}
      >
        <h3
          style={{ cursor: "pointer" }}
          onClick={() => setCommentsExpanded((prev) => !prev)}
        >
          Comments ({post.comments?.length || 0}){" "}
          <span style={{ fontSize: "0.9rem" }}>
            {commentsExpanded ? "▲" : "▼"}
          </span>
        </h3>

        {commentsExpanded && (
          <>
            {post.comments?.length > 0 ? (
              post.comments.map((c, idx) => (
                <div key={idx} className="comment">
                  <strong>{c.user?.name || "Unknown"}:</strong> {c.text}
                </div>
              ))
            ) : (
              <p>No comments yet.</p>
            )}

            <div className="add-comment">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={handleAddComment}>Post</button>
            </div>

            <div ref={commentsEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
