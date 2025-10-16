import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Feed from "./Feed";
import CreatePost from "./CreatePost";
import MyPosts from "./MyPosts";
import SavedPosts from "./SavedPosts";
import EditProfile from "./EditProfile";
import TravelBucketList from "./TravelBucketList";
import Diary from "./Diary";
import NotificationTab from "./NotificationTab";
import AnalyticsTab from "../components/AnalyticsTab";
import Gallery from "./Gallery";
import MustVisit from "./MustVisit"; // new MustVisit tab
import API_BASE_URL from "../api";
import "./Dashboard.css";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
          headers: { "x-auth-token": token },
        });
        const data = await res.json();
        if (res.ok) setProfile(data.user);
        else navigate("/login");
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const closeSidebar = () => setSidebarVisible(false);

  if (!profile) {
    return <p style={{ textAlign: "center", color: "white" }}>Loading...</p>;
  }

  const getProfilePic = (pic) => {
    if (!pic) return "/default-avatar.png";
    return pic.startsWith("http") ? pic : `${API_BASE_URL}/uploads/${pic}`;

  };

  const tabs = [
    "feed",
    "create",
    "myposts",
    "saved",
    "bucket",
    "diary",
    "notifications",
    "analytics",
    "gallery",
    "mustvisit", // added Must Visit tab
  ];

  return (
    <div className="dashboard-layout">
      {/* Hamburger button for mobile */}
      <button className="hamburger-btn" onClick={toggleSidebar}>
        <div></div>
        <div></div>
        <div></div>
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarVisible ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarVisible ? "show" : ""}`}
        style={{
          width: "220px",
          background: "#1c1a2b",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "15px 10px",
          boxSizing: "border-box",
          boxShadow: "2px 0 12px rgba(0,0,0,0.6)",
          overflowY: "auto",
          height: "100vh",
        }}
      >
        <div
          className="sidebar-profile"
          onClick={() => {
            setActiveTab("profile");
            closeSidebar();
          }}
          style={{ textAlign: "center", marginBottom: "20px", cursor: "pointer" }}
        >
          <img
            src={getProfilePic(profile.profilePic)}
            alt="Profile"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              marginBottom: "8px",
              border: "2px solid #ff8c00",
            }}
          />
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#ff8c00" }}>{profile.name}</h3>
        </div>

        <nav
          className="sidebar-nav"
          style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                closeSidebar();
              }}
              style={{
                background: "transparent",
                border: "none",
                color: activeTab === tab ? "#9b59b6" : "#e0e0e0",
                padding: "6px 10px",
                fontSize: "0.85rem",
                textAlign: "left",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeTab === tab ? "rgba(155,89,182,0.1)" : "transparent",
              }}
            >
              {tab === "mustvisit" ? "Must Visit" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}

          <button
            onClick={handleLogout}
            style={{
              marginTop: "auto",
              background: "linear-gradient(90deg,#9b59b6,#8e44ad)",
              color: "#fff",
              padding: "8px",
              borderRadius: "6px",
              fontWeight: "bold",
              textAlign: "center",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {activeTab === "feed" && <Feed />}
        {activeTab === "create" && <CreatePost />}
        {activeTab === "myposts" && <MyPosts />}
        {activeTab === "saved" && <SavedPosts />}
        {activeTab === "bucket" && <TravelBucketList />}
        {activeTab === "diary" && <Diary />}
        {activeTab === "notifications" && <NotificationTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "gallery" && <Gallery />}
        {activeTab === "mustvisit" && <MustVisit />} {/* Must Visit rendering */}
        {activeTab === "profile" && <EditProfile profile={profile} setProfile={setProfile} />}
      </main>
    </div>
  );
}

export default Dashboard;
