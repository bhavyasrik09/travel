import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from "recharts";
import "./AnalyticsTab.css";

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch analytics
        const res = await fetch(`${API_BASE_URL}/api/profile/analytics/data`, {
          headers: { "x-auth-token": token },
        });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);

        // Fetch user's posts for timeline
        const resPosts = await fetch(`${API_BASE_URL}/api/posts/mine`, {
          headers: { "x-auth-token": token },
        });
        const postsData = await resPosts.json();
        if (resPosts.ok) {
          const sortedPosts = (postsData.posts || []).sort(
            (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
          );
          setPosts(sortedPosts);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching analytics/posts:", err);
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <p className="loading-text">Loading analytics...</p>;
  if (!data) return <p className="loading-text">No analytics available.</p>;

  // Pie chart data for followers/following ratio
  const followerData = [
    { name: "Followers", value: data.followersCount },
    { name: "Following", value: data.followingCount },
  ];
  const COLORS = ["#4e73df", "#ff7f50"];

  // Top 3 posts
  const topPosts = [...data.posts]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  // Average likes per post
  const avgLikes =
    data.totalPosts > 0
      ? Math.round(data.posts.reduce((sum, p) => sum + p.likes, 0) / data.totalPosts)
      : 0;

  // Posts vs Likes data for Line Chart
  const postsLikesData = data.posts.map((post) => ({
    title: post.title.length > 10 ? post.title.slice(0, 10) + "..." : post.title,
    likes: post.likes,
  }));

  return (
    <div className="analytics-container">
      {/* ====== Summary Cards ====== */}
      <div className="summary-cards">
        <div className="card hover-glow">
          <h3>Total Posts</h3>
          <p>{data.totalPosts}</p>
        </div>
        <div className="card hover-glow">
          <h3>Total Likes</h3>
          <p>{data.totalLikes}</p>
        </div>
        <div className="card hover-glow">
          <h3>Average Likes/Post</h3>
          <p>{avgLikes}</p>
        </div>
        <div className="card hover-glow">
          <h3>Followers</h3>
          <p>{data.followersCount}</p>
        </div>
        <div className="card hover-glow">
          <h3>Following</h3>
          <p>{data.followingCount}</p>
        </div>
      </div>

      {/* ====== Charts Row ====== */}
      <div className="charts-row">
        <div className="chart-container three-charts hover-glow">
          <h3>📈 Likes per Post</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.posts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="likes" fill="#4e73df" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container three-charts hover-glow">
          <h3>👥 Followers vs Following</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={followerData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {followerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container three-charts hover-glow">
          <h3>📊 Posts vs Likes</h3>
          {postsLikesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={postsLikesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="likes" stroke="#ff7f50" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No posts available for chart.</p>
          )}
        </div>
      </div>

      {/* ====== Top Posts ====== */}
      <div className="top-posts-container hover-glow">
        <h3>🏆 Top Posts</h3>
        {topPosts.length > 0 ? (
          <ul>
            {topPosts.map((post, idx) => (
              <li key={idx}>
                <strong>{post.title}</strong> - {post.likes} ❤️
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts yet.</p>
        )}
      </div>

      {/* ====== Timeline Section ====== */}
      <div className="timeline-container hover-glow">
        <h2 className="timeline-title">🕒 Your Travel Timeline</h2>
        <div className="timeline-items-wrapper">
          <div className="timeline-line"></div>
          <div className="timeline-items">
            {posts.length > 0 ? (
              posts.map((post, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div key={post._id} className={`timeline-item ${isLeft ? "left" : "right"}`}>
                    <div className="timeline-connector"></div>
                    <div className="timeline-dot"></div>
                    <div
                      className="timeline-content hover-glow"
                      onClick={() => navigate(`/post/${post._id}`)}
                    >
                      <img
                        src={post.images?.[0] || "https://via.placeholder.com/120"}
                        alt={post.title}
                      />
                      <div className="timeline-text">
                        <h4>{post.title}</h4>
                        <p className="timeline-date">
                          {new Date(post.date || post.createdAt).toLocaleDateString()}
                        </p>
                        <p>{post.location || "Unknown location"}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No posts to display in timeline.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
