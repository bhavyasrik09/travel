import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import API_BASE_URL from "../api";
import "./NotificationTab.css";
const socket = io(API_BASE_URL); // Backend URL

function NotificationTab() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch existing notifications from backend
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { "x-auth-token": token },
        });
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();

    // Get userId from localStorage or backend
    const userId = localStorage.getItem("userId"); 
    if (userId) {
      socket.emit("joinUserRoom", userId);
    }

    // Listen for real-time notifications
    socket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.off("newNotification");
    };
  }, []);

  // Helper to display notification message
  const renderMessage = (n) => {
    if (!n.sender) return "Someone did something";

    switch (n.type) {
      case "comment":
        return `commented on your post${n.post?.title ? ` "${n.post.title}"` : ""}`;
      case "follow":
        return `followed you`;
      case "unfollow":
        return `unfollowed you`;
      default:
        return "did something";
    }
  };

  return (
  <div className="notification-container">
    <h2>Notifications</h2>
    {notifications.length === 0 ? (
      <p>No notifications yet.</p>
    ) : (
      <ul className="notification-list">
        {notifications.map((n) => (
          <li key={n._id} className="notification-card">
            <strong>{n.sender?.name || "Someone"}</strong> {renderMessage(n)}
            <br />
            <small>{new Date(n.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    )}
  </div>
);

}

export default NotificationTab;
