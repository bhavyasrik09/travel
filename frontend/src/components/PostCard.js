import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PostCard.css";

function PostCard({ post, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedLocation, setEditedLocation] = useState(post.location || "");
  const [editedTags, setEditedTags] = useState(post.tags ? post.tags.join(", ") : "");
  const [editedImage, setEditedImage] = useState(null);

  const navigate = useNavigate();

  const handleSave = () => {
    const updatedPost = {
      ...post,
      title: editedTitle,
      content: editedContent,
      location: editedLocation,
      tags: editedTags.split(",").map((t) => t.trim()).filter(Boolean),
      newImage: editedImage || null,
    };
    onEdit(updatedPost);
    setIsEditing(false);
    setEditedImage(null);
  };

  const handleCancel = () => {
    setEditedTitle(post.title);
    setEditedContent(post.content);
    setEditedLocation(post.location || "");
    setEditedTags(post.tags ? post.tags.join(", ") : "");
    setEditedImage(null);
    setIsEditing(false);
  };

  return (
    <div className="post-card">
      {/* Author info */}
      {post.user && (
        <div className="post-author">
          <span className="post-date">
            {new Date(post.date || post.createdAt).toLocaleString()}
          </span>
          <span
            className="author-name"
            style={{ cursor: "pointer", color: "#0077b5", fontWeight: "500" }}
            onClick={() => navigate(`/profile/${post.user._id}`)}
          >
            {post.user.name}
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="post-main">
        {/* Image */}
        <div className="post-images">
          {isEditing ? (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditedImage(e.target.files[0])}
                className="edit-image-input"
              />
              {(editedImage
                ? URL.createObjectURL(editedImage)
                : post.images && post.images.length > 0
                ? post.images[0] // Cloudinary URL
                : null) && (
                <img
                  src={
                    editedImage
                      ? URL.createObjectURL(editedImage)
                      : post.images[0] // Cloudinary URL
                  }
                  alt="Preview"
                  className="post-image"
                />
              )}
            </>
          ) : (
            post.images && post.images.length > 0 && (
              <img
                src={post.images[0]} // Cloudinary URL
                alt={post.title}
                className="post-image"
              />
            )
          )}
        </div>

        {/* Text content */}
        <div className="post-content">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="edit-input title-input"
              />
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="edit-input content-input"
                rows={4}
              />
              <input
                type="text"
                value={editedLocation}
                onChange={(e) => setEditedLocation(e.target.value)}
                className="edit-input location-input"
                placeholder="Location"
              />
              <input
                type="text"
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                className="edit-input tags-input"
                placeholder="Tags (comma separated)"
              />
            </>
          ) : (
            <>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {post.location && <div className="post-location">{post.location}</div>}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {onEdit && onDelete && (
        <div className="post-actions">
          {isEditing ? (
            <>
              <button className="edit-btn" onClick={handleSave}>
                Save
              </button>
              <button className="delete-btn" onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => onDelete(post._id)}>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PostCard;
