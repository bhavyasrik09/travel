import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import ProfileView from "./pages/ProfileView";
import PrivateRoute from "./components/PrivateRoute";
import Feed from "./pages/Feed";
import PostDetail from "./pages/PostDetail";
import EditPost from "./pages/EditPost";
import MyPosts from "./pages/MyPosts"; // ✅ added MyPosts
import "./App.css";
import Timeline from "./pages/Timeline";
import { GoogleOAuthProvider } from "@react-oauth/google";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "1088131171249-puuen51gk1hn28e54aht6ngm0gig1fdb.apps.googleusercontent.com";
function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> {/* ✅ Wrap app */}
    <Router>
      <Routes>

        {/* ---------------- HOME PAGE ---------------- */}
        <Route
          path="/"
          element={
            <div className="homepage">
              <div className="homepage-nav">
                <Link to="/signup">
                  <button className="signup-btn">Sign Up</button>
                </Link>
                <Link to="/login">
                  <button className="login-btn">Login</button>
                </Link>
              </div>

              <div className="hero">
                <blockquote>
                  "Travel is the only thing you buy that makes you richer."
                </blockquote>
                <h1>🌍 Travel Diary App</h1>
                <p>
                  Capture your adventures, share stories, and explore new journeys with fellow travelers.
                </p>
                <Link to="/signup">
                  <button className="get-started-btn">Get Started</button>
                </Link>
              </div>
            </div>
          }
        />

        {/* ---------------- AUTH ROUTES ---------------- */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* ---------------- PROTECTED ROUTES ---------------- */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <PrivateRoute>
              <ProfileView />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ---------------- MY POSTS ---------------- */}
        <Route
          path="/my-posts"
          element={
            <PrivateRoute>
              <MyPosts />
            </PrivateRoute>
          }
        />

        {/* ---------------- TIMELINE ---------------- */}
<Route
  path="/timeline"
  element={
    <PrivateRoute>
      <Timeline />
    </PrivateRoute>
  }
/>


        {/* ---------------- FEED + POST DETAILS ---------------- */}
        <Route
          path="/feed"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />
        <Route
          path="/post/:id"
          element={
            <PrivateRoute>
              <PostDetail />
            </PrivateRoute>
          }
        />
        

        {/* ---------------- EDIT POST ---------------- */}
        <Route
          path="/edit/:id"
          element={
            <PrivateRoute>
              <EditPost />
            </PrivateRoute>
          }
        />

      </Routes>
    </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
