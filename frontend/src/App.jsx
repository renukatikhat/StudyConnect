import { useEffect, useState } from "react";
import "./App.css";
const SERVER_URL = "https://studyconnect-backend-psoz.onrender.com";
const API_URL = `${SERVER_URL}/api/auth`;
const POSTS_API_URL = `${SERVER_URL}/api/posts`;
const USERS_API_URL = `${SERVER_URL}/api/users`;
const PROFILE_API_URL = `${USERS_API_URL}/profile`;
const PHOTO_API_URL = `${USERS_API_URL}/profile-photo`;

const communities = [
  { name: "Java", icon: "☕", members: "Programming" },
  { name: "DSA", icon: "🧩", members: "Problem Solving" },
  { name: "Web Development", icon: "🌐", members: "Development" },
  { name: "DBMS", icon: "🗄️", members: "Databases" },
  { name: "AI / ML", icon: "🤖", members: "Artificial Intelligence" },
  { name: "Python", icon: "🐍", members: "Programming" },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("studyconnect-user")) || null;
  } catch {
    return null;
  }
}

function photoUrl(photo) {
  if (!photo) return "";
  return photo.startsWith("http://") || photo.startsWith("https://")
    ? photo
    : `${SERVER_URL}${photo}`;
}

function getId(person) {
  return person?.id || person?._id || "";
}

function formatPost(post) {
  const author = post?.author || {};
  const authorName = author.name || "Student";

  return {
    id: post?._id || post?.id,
    authorId: getId(author),
    name: authorName,
    profilePhoto: author.profilePhoto || "",
    initials: authorName
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    community: post?.community || "General",
    type: ["post", "doubt", "resource"].includes(post?.type)
      ? post.type
      : "post",
    time: post?.createdAt
      ? new Date(post.createdAt).toLocaleString()
      : "Recently",
    text: post?.content || post?.text || "",
    likes: Array.isArray(post?.likes)
      ? post.likes.length
      : Number(post?.likes) || 0,
    comments: Array.isArray(post?.comments)
      ? post.comments.length
      : Number(post?.comments) || 0,
  };
}

function Avatar({ user, className = "avatar" }) {
  const [imageError, setImageError] = useState(false);
  const name = user?.name || "Student";
  const photo = user?.profilePhoto;

  if (photo && !imageError) {
    return (
      <img
        className={className}
        src={photoUrl(photo)}
        alt={`${name}'s profile`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={className}>
      {name.trim().charAt(0).toUpperCase() || "S"}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [activePage, setActivePage] = useState("Home");

  // Authentication
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Posts
  const [selectedCommunity, setSelectedCommunity] = useState("All");
  const [postText, setPostText] = useState("");
  const [postType, setPostType] = useState("post");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);

  // Saved posts
  const [savedPosts, setSavedPosts] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("studyconnect-saved-posts")
      ) || [];
    } catch {
      return [];
    }
  });

  // Profile
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSkills, setProfileSkills] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  // Students and following
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsMessage, setStudentsMessage] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profilePostsLoading, setProfilePostsLoading] = useState(false);
  const [profilePostsMessage, setProfilePostsMessage] = useState("");
  const [followListType, setFollowListType] = useState("");
  const [followListStudent, setFollowListStudent] = useState(null);
  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListMessage, setFollowListMessage] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "studyconnect-saved-posts",
      JSON.stringify(savedPosts)
    );
  }, [savedPosts]);

  useEffect(() => {
    if (!user) return;

    setProfileName(user.name || "");
    setProfileBio(user.bio || "");
    setProfileSkills(
      Array.isArray(user.skills) ? user.skills.join(", ") : ""
    );
  }, [user]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  async function loadPosts() {
    if (!user) return;

    setPostsLoading(true);
    setPostsError("");

    try {
      const response = await fetch(POSTS_API_URL);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load posts.");
      }

      const rawPosts = data.posts || [];
      const formatted = rawPosts.map(formatPost);

      setPosts(formatted);

      const currentId = getId(user);

      setLikedPosts(
        formatted
          .filter((post) => {
            const original = rawPosts.find(
              (item) => (item._id || item.id) === post.id
            );

            return (
              Array.isArray(original?.likes) &&
              original.likes.some(
                (like) =>
                  getId(like) === currentId ||
                  String(like) === String(currentId)
              )
            );
          })
          .map((post) => post.id)
      );
    } catch (error) {
      setPostsError(error.message || "Could not load posts.");
    } finally {
      setPostsLoading(false);
    }
  }

  async function loadNotifications() {
    const token = localStorage.getItem("studyconnect-token");
    if (!token) return;

    setNotificationsLoading(true);

    try {
      const response = await fetch(
        `${SERVER_URL}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notifications.");
      }

      const list = Array.isArray(data)
        ? data
        : data.notifications || [];

      setNotifications(list);
      setUnreadCount(
        data.unreadCount ??
          list.filter((item) => !item.isRead).length
      );
    } catch (error) {
      console.error("Notifications error:", error.message);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function markAllNotificationsRead() {
    const token = localStorage.getItem("studyconnect-token");
    if (!token) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not mark notifications as read."
        );
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function loadStudents() {
    const token = localStorage.getItem("studyconnect-token");

    if (!token) {
      setStudentsMessage("Please login again.");
      return;
    }

    setStudentsLoading(true);
    setStudentsMessage("");

    try {
      const response = await fetch(`${USERS_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load students.");
      }

      setStudents(data.students || []);
    } catch (error) {
      setStudentsMessage(
        error.message === "Failed to fetch"
          ? "Backend चालू आहे का ते तपासा."
          : error.message
      );
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setStudents([]);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadPosts();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (activePage === "Students") loadStudents();
    if (activePage === "Notifications") loadNotifications();
  }, [user, activePage]);

  async function loadProfilePosts(student) {
    const studentId = getId(student);

    if (!studentId) {
      setProfilePosts([]);
      setProfilePostsMessage("Student ID was not returned by the server.");
      return;
    }

    setProfilePosts([]);
    setProfilePostsMessage("");
    setProfilePostsLoading(true);

    try {
      const token = localStorage.getItem("studyconnect-token");

      const response = await fetch(
        `${POSTS_API_URL}/user/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load posts.");
      }

      setProfilePosts((data.posts || []).map(formatPost));
    } catch (error) {
      setProfilePostsMessage(error.message || "Unable to load posts.");
    } finally {
      setProfilePostsLoading(false);
    }
  }

  async function openStudentProfile(student) {
    setSelectedProfile(student);
    setFollowListStudent(null);
    await loadProfilePosts(student);
  }

  async function openFollowList(student, type) {
    setFollowListStudent(student);
    setFollowListType(type);
    setFollowList([]);
    setFollowListMessage("");
    setFollowListLoading(true);

    try {
      const token = localStorage.getItem("studyconnect-token");

      const response = await fetch(
        `${USERS_API_URL}/${getId(student)}/${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load students.");
      }

      setFollowList(data.students || []);
    } catch (error) {
      setFollowListMessage(error.message || "Unable to load the list.");
    } finally {
      setFollowListLoading(false);
    }
  }

  async function toggleFollow(student) {
    const token = localStorage.getItem("studyconnect-token");
    const studentId = getId(student);

    if (!token || !studentId || student.isMe) return;

    const method = student.isFollowing ? "DELETE" : "POST";
    setStudentsMessage("");

    try {
      const response = await fetch(
        `${USERS_API_URL}/${studentId}/follow`,
        {
          method,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update follow status.");
      }

      await loadStudents();

      if (selectedProfile && getId(selectedProfile) === studentId) {
        setSelectedProfile((previous) => ({
          ...previous,
          isFollowing: !student.isFollowing,
        }));
      }
    } catch (error) {
      setStudentsMessage(
        error.message === "Failed to fetch"
          ? "Backend चालू आहे का ते तपासा."
          : error.message
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";
      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (data.token) {
        localStorage.setItem("studyconnect-token", data.token);
      }

      if (!data.user) {
        setMessage("User details were not returned by the server.");
        return;
      }

      const savedUser = {
        ...data.user,
        profilePhoto: data.user.profilePhoto || "",
      };

      localStorage.setItem("studyconnect-user", JSON.stringify(savedUser));
      setUser(savedUser);
      setActivePage("Home");
      setPassword("");
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Backend चालू आहे का ते तपासा."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("studyconnect-token");
    localStorage.removeItem("studyconnect-user");

    setUser(null);
    setPassword("");
    setMessage("");
    setPostMessage("");
    setProfileMessage("");
    setPhotoMessage("");
    setSelectedPhoto(null);
    setPhotoPreview("");
    setStudents([]);
    setStudentsMessage("");
    setSelectedProfile(null);
    setNotifications([]);
    setUnreadCount(0);
    setIsLogin(true);
    setActivePage("Home");
  }

  function toggleSavedPost(post) {
    setSavedPosts((previous) =>
      previous.some((item) => item.id === post.id)
        ? previous.filter((item) => item.id !== post.id)
        : [post, ...previous]
    );
  }

  function openEditProfile() {
    setProfileMessage("");
    setPhotoMessage("");
    setProfileName(user?.name || "");
    setProfileBio(user?.bio || "");
    setProfileSkills(
      Array.isArray(user?.skills) ? user.skills.join(", ") : ""
    );
    setSelectedPhoto(null);
    setPhotoPreview("");
    setActivePage("Edit Profile");
  }

  function handlePhotoSelect(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type
      )
    ) {
      setPhotoMessage("Choose a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage("Photo must be smaller than 5 MB.");
      return;
    }

    setPhotoMessage("");
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadProfilePhoto() {
    if (!selectedPhoto || photoUploading) {
      if (!selectedPhoto) setPhotoMessage("Please choose a photo first.");
      return;
    }

    const token = localStorage.getItem("studyconnect-token");

    if (!token) {
      setPhotoMessage("Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePhoto", selectedPhoto);

    try {
      setPhotoUploading(true);
      setPhotoMessage("");

      const response = await fetch(PHOTO_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Photo upload failed.");
      }

      const updatedUser = {
        ...(getStoredUser() || user),
        profilePhoto: data.profilePhoto,
      };

      localStorage.setItem("studyconnect-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSelectedPhoto(null);
      setPhotoPreview("");
      setPhotoMessage("Profile photo uploaded successfully!");
    } catch (error) {
      setPhotoMessage(error.message || "Photo upload failed.");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (profileSaving) return;

    const token = localStorage.getItem("studyconnect-token");

    if (!token) {
      setProfileMessage("Please login again.");
      return;
    }

    if (profileName.trim().length < 2) {
      setProfileMessage("Name must contain at least 2 characters.");
      return;
    }

    if (profileName.trim().length > 60) {
      setProfileMessage("Name cannot exceed 60 characters.");
      return;
    }

    if (profileBio.trim().length > 300) {
      setProfileMessage("About Me cannot exceed 300 characters.");
      return;
    }

    const skills = profileSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    setProfileSaving(true);
    setProfileMessage("");

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName.trim(),
          bio: profileBio.trim(),
          skills,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.user) {
        throw new Error(data.message || "Profile update failed.");
      }

      const updatedUser = {
        ...user,
        ...data.user,
        profilePhoto: data.user.profilePhoto || user?.profilePhoto || "",
      };

      localStorage.setItem("studyconnect-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileMessage("Profile updated successfully!");
      setActivePage("My Profile");
    } catch (error) {
      setProfileMessage(
        error.message === "Failed to fetch"
          ? "Server connection failed. Check the backend."
          : error.message
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function createPost(event) {
    event.preventDefault();
    if (!postText.trim() || posting) return;

    const token = localStorage.getItem("studyconnect-token");

    if (!token) {
      setPostMessage("Please login again.");
      return;
    }

    const type = activePage === "Doubt Zone" ? "doubt" : postType;

    const community =
      type === "doubt"
        ? "Doubt Zone"
        : type === "resource"
          ? "Study Resources"
          : selectedCommunity === "All"
            ? "General"
            : selectedCommunity;

    setPosting(true);
    setPostMessage("");

    try {
      const response = await fetch(POSTS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: postText.trim(),
          community,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not publish post.");
      }

      const newPost = formatPost(data.post);
      setPosts((previous) => [newPost, ...previous]);

      if (type === "resource") {
        setSavedPosts((previous) =>
          previous.some((item) => item.id === newPost.id)
            ? previous
            : [newPost, ...previous]
        );
      }

      setPostText("");
      setPostType("post");
      setPostMessage(
        type === "doubt"
          ? "Your doubt was published successfully!"
          : type === "resource"
            ? "Resource published and saved successfully!"
            : "Post published successfully!"
      );

      if (type === "post") setActivePage("Home");
    } catch (error) {
      setPostMessage(error.message || "Could not publish post.");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId) {
    const token = localStorage.getItem("studyconnect-token");

    if (!token) {
      setPostMessage("Please login again.");
      return;
    }

    try {
      const response = await fetch(`${POSTS_API_URL}/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update like.");
      }

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId ? { ...post, likes: data.likes } : post
        )
      );

      setProfilePosts((previous) =>
        previous.map((post) =>
          post.id === postId ? { ...post, likes: data.likes } : post
        )
      );

      setLikedPosts((previous) =>
        data.liked
          ? [...previous.filter((id) => id !== postId), postId]
          : previous.filter((id) => id !== postId)
      );
    } catch (error) {
      setPostMessage(error.message || "Could not update like.");
    }
  }

  const visiblePosts =
    selectedCommunity === "All"
      ? posts
      : posts.filter((post) => post.community === selectedCommunity);

  function renderPost(post) {
    return (
      <PostCard
        key={post.id}
        post={post}
        liked={likedPosts.includes(post.id)}
        saved={savedPosts.some((item) => item.id === post.id)}
        onLike={() => toggleLike(post.id)}
        onSave={() => toggleSavedPost(post)}
      />
    );
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="welcome-panel">
          <div className="brand">
            <span className="brand-icon">S</span> StudyConnect
          </div>

          <div className="welcome-content">
            <span className="eyebrow">LEARN. CONNECT. GROW.</span>
            <h1>Your learning journey starts here.</h1>
            <p>
              Connect with students, share knowledge, solve doubts
              and grow together with your learning community.
            </p>

            <div className="feature-list">
              <div>✦ Connect with fellow students</div>
              <div>✦ Share knowledge and resources</div>
              <div>✦ Learn something new every day</div>
            </div>
          </div>

          <p className="panel-footer">
            A community built for curious minds.
          </p>
        </section>

        <section className="form-panel">
          <div className="form-container">
            <div className="mobile-brand">
              <span className="brand-icon">S</span> StudyConnect
            </div>

            <span className="eyebrow">YOUR STUDENT COMMUNITY</span>
            <h2>{isLogin ? "Welcome back!" : "Create your account"}</h2>

            <p className="form-subtitle">
              {isLogin
                ? "Sign in to continue your learning journey."
                : "Join students who learn and grow together."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={isLogin ? "active" : ""}
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={!isLogin ? "active" : ""}
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  minLength={8}
                  maxLength={72}
                  required
                />
                <small>Use at least 8 characters.</small>
              </div>

              <button className="submit-button" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in →"
                    : "Create account →"}
              </button>
            </form>

            {message && (
              <div className="message" role="status">
                {message}
              </div>
            )}

            <p className="switch-text">
              {isLogin
                ? "New to StudyConnect?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
              >
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>

            <p className="privacy-note">
              By continuing, you agree to use StudyConnect respectfully
              and responsibly.
            </p>
          </div>
        </section>
      </main>
    );
  }
    return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">S</span> StudyConnect
        </div>

        <div className="topbar-right">
          <span className="online-dot" />
          <span className="topbar-label">Student Community</span>

          <button
            type="button"
            className="notification-top-button"
            onClick={() => setActivePage("Notifications")}
            aria-label="Open notifications"
          >
            🔔 {unreadCount > 0 ? unreadCount : ""}
          </button>

          <Avatar user={user} className="avatar small-avatar" />
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-user">
            <Avatar user={user} className="avatar large-avatar" />
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <p className="sidebar-heading">MENU</p>

          {[
            ["Home", "⌂"],
            ["My Profile", "♙"],
            ["Communities", "◈"],
            ["Doubt Zone", "?"],
            ["Study Resources", "📚"],
            ["Saved Resources", "☆"],
            ["Students", "♙"],
            ["Notifications", "🔔"],
          ].map(([page, icon]) => (
            <button
              key={page}
              type="button"
              className={`nav-item ${
                activePage === page ? "selected" : ""
              }`}
              onClick={() => setActivePage(page)}
            >
              <span className="nav-icon">{icon}</span>
              {page}
              {page === "Notifications" && unreadCount > 0 && (
                <span className="notification-count">{unreadCount}</span>
              )}
            </button>
          ))}

          <div className="sidebar-bottom">
            <div className="sidebar-tip">
              <span>✦ Your daily reminder</span>
              <p>Small steps every day lead to big achievements.</p>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >
              ↪ Log out
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          {activePage === "Home" && (
            <>
              <div className="dashboard-heading">
                <div>
                  <p className="eyebrow">YOUR LEARNING SPACE</p>
                  <h1>
                    Welcome back, {user.name.split(" ")[0]}! 👋
                  </h1>
                  <p>Learn together. Share ideas. Grow every day.</p>
                </div>
                <span className="date-chip">✦ Student Dashboard</span>
              </div>

              <section className="welcome-card">
                <div>
                  <span className="welcome-card-label">
                    YOUR COMMUNITY, YOUR GROWTH
                  </span>
                  <h2>Great things happen when students connect.</h2>
                  <p>
                    Ask questions, share what you learn, and help others
                    succeed.
                  </p>
                  <button
                    type="button"
                    className="light-button"
                    onClick={() => setActivePage("Communities")}
                  >
                    Explore communities →
                  </button>
                </div>
                <div className="welcome-art">✦</div>
              </section>

              <section className="community-section">
                <div className="section-heading">
                  <div>
                    <h2>Explore communities</h2>
                    <p>Find your people and learn together.</p>
                  </div>
                  <button
                    type="button"
                    className="subtle-button"
                    onClick={() => setActivePage("Communities")}
                  >
                    View all →
                  </button>
                </div>

                <div className="community-grid">
                  {communities.slice(0, 3).map((community) => (
                    <button
                      type="button"
                      className="community-card"
                      key={community.name}
                      onClick={() => {
                        setSelectedCommunity(community.name);
                        setActivePage("Communities");
                      }}
                    >
                      <span className="community-icon">
                        {community.icon}
                      </span>
                      <strong>{community.name}</strong>
                      <span>{community.members}</span>
                      <span className="card-arrow">↗</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="feed-section">
                <div className="section-heading">
                  <div>
                    <h2>Community feed</h2>
                    <p>Conversations from fellow students.</p>
                  </div>
                </div>

                <form className="create-post" onSubmit={createPost}>
                  <Avatar user={user} />

                  <div className="post-input-area">
                    <select
                      value={postType}
                      onChange={(event) => setPostType(event.target.value)}
                      aria-label="Choose post type"
                    >
                      <option value="post">Normal Post</option>
                      <option value="doubt">Ask a Doubt</option>
                      <option value="resource">Study Resource</option>
                    </select>

                    <textarea
                      value={postText}
                      onChange={(event) => setPostText(event.target.value)}
                      placeholder="Share something with your community..."
                      rows={2}
                      maxLength={1000}
                    />

                    <div className="post-actions">
                      <span>Share knowledge ✦</span>
                      <button
                        type="submit"
                        disabled={!postText.trim() || posting}
                      >
                        {posting ? "Publishing..." : "Publish post"}
                      </button>
                    </div>
                  </div>
                </form>

                {postMessage && <p role="status">{postMessage}</p>}
                {postsError && <p role="alert">{postsError}</p>}
                {postsLoading && <p>Loading posts...</p>}

                {!postsLoading && !postsError && posts.length === 0 && (
                  <div className="empty-state">
                    <span>✦</span>
                    <h3>Start the conversation</h3>
                    <p>Publish your first post for fellow students.</p>
                  </div>
                )}

                {posts.slice(0, 5).map(renderPost)}
              </section>
            </>
          )}

          {activePage === "My Profile" && (
            <section className="content-page">
              <p className="eyebrow">YOUR SPACE</p>
              <h1>My Profile</h1>
              <p className="page-description">
                Introduce yourself to your learning community.
              </p>

              <div className="profile-card">
                <Avatar user={user} className="avatar profile-avatar" />
                <h2>{user.name}</h2>
                <p>{user.email}</p>

                <div className="profile-detail">
                  <strong>About Me</strong>
                  <p>{user.bio || "Your learning journey starts here!"}</p>
                </div>

                <div className="profile-detail">
                  <strong>My Skills</strong>
                  <p>
                    {user.skills?.length
                      ? user.skills.join(", ")
                      : "Add your skills to showcase what you know."}
                  </p>
                </div>

                <button
                  type="button"
                  className="submit-button"
                  onClick={openEditProfile}
                >
                  ✏️ Edit Profile
                </button>

                <span className="profile-badge">✦ Student Member</span>

                {profileMessage && <p role="status">{profileMessage}</p>}
              </div>
            </section>
          )}

          {activePage === "Edit Profile" && (
            <section className="profile-edit-page">
              <div className="profile-edit-header">
                <div className="profile-edit-icon">✦</div>
                <div>
                  <h2>Edit Your Profile</h2>
                  <p>Personalize your StudyConnect student profile.</p>
                </div>
              </div>

              <form className="profile-edit-card" onSubmit={saveProfile}>
                <div className="profile-avatar-section">
                  <div className="profile-photo-editor">
                    {photoPreview ? (
                      <img
                        className="profile-large-avatar profile-photo-image"
                        src={photoPreview}
                        alt="Selected profile"
                      />
                    ) : (
                      <Avatar
                        user={user}
                        className="profile-large-avatar"
                      />
                    )}

                    <label className="photo-choose-button">
                      Choose Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handlePhotoSelect}
                        hidden
                      />
                    </label>

                    <button
                      type="button"
                      className="photo-upload-button"
                      onClick={uploadProfilePhoto}
                      disabled={!selectedPhoto || photoUploading}
                    >
                      {photoUploading ? "Uploading..." : "Upload Photo"}
                    </button>

                    {photoMessage && (
                      <p className="photo-upload-message" role="status">
                        {photoMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <h3>{profileName || "Your Name"}</h3>
                    <p>Student Member · StudyConnect</p>
                  </div>
                </div>

                <div className="profile-form-divider" />

                <div className="profile-form-group">
                  <label htmlFor="profileName">Full Name</label>
                  <input
                    id="profileName"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder="Enter your full name"
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profileBio">About Me</label>
                  <textarea
                    id="profileBio"
                    value={profileBio}
                    onChange={(event) => setProfileBio(event.target.value)}
                    placeholder="Tell the community about yourself, your interests and goals..."
                    rows={4}
                    maxLength={300}
                  />
                  <small>Maximum 300 characters.</small>
                </div>

                <div className="profile-form-group">
                  <label htmlFor="profileSkills">Skills & Interests</label>
                  <input
                    id="profileSkills"
                    value={profileSkills}
                    onChange={(event) => setProfileSkills(event.target.value)}
                    placeholder="Java, React, DSA, Web Development"
                  />
                  <small>Separate each skill with a comma.</small>
                </div>

                {profileMessage && (
                  <p role="status" className="profile-edit-note">
                    {profileMessage}
                  </p>
                )}

                <div className="profile-form-actions">
                  <button
                    className="profile-cancel-btn"
                    type="button"
                    disabled={profileSaving}
                    onClick={() => {
                      setProfileMessage("");
                      setActivePage("My Profile");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="profile-save-btn"
                    type="submit"
                    disabled={profileSaving}
                  >
                    {profileSaving ? "Saving..." : "Save Changes →"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activePage === "Communities" && (
            <section className="content-page">
              <p className="eyebrow">LEARN TOGETHER</p>
              <h1>Student Communities</h1>
              <p className="page-description">
                Choose a subject to explore related discussions.
              </p>

              <div className="community-grid all-communities">
                {communities.map((community) => (
                  <button
                    type="button"
                    className={`community-card ${
                      selectedCommunity === community.name
                        ? "community-active"
                        : ""
                    }`}
                    key={community.name}
                    onClick={() => setSelectedCommunity(community.name)}
                  >
                    <span className="community-icon">{community.icon}</span>
                    <strong>{community.name}</strong>
                    <span>{community.members}</span>
                    <span className="card-arrow">↗</span>
                  </button>
                ))}
              </div>

              <div className="section-heading community-feed-heading">
                <h2>
                  {selectedCommunity === "All"
                    ? "All discussions"
                    : `${selectedCommunity} discussions`}
                </h2>
                <button
                  type="button"
                  className="subtle-button"
                  onClick={() => setSelectedCommunity("All")}
                >
                  Show all
                </button>
              </div>

              {visiblePosts.length ? (
                visiblePosts.map(renderPost)
              ) : (
                <div className="empty-state">
                  <span>✦</span>
                  <h3>No discussions yet</h3>
                  <p>
                    Be the first to start a conversation in this community.
                  </p>
                </div>
              )}
            </section>
          )}

          {activePage === "Doubt Zone" && (
            <section className="content-page">
              <p className="eyebrow">ASK. UNDERSTAND. SOLVE.</p>
              <h1>Doubt Zone</h1>
              <p className="page-description">
                Ask questions and help fellow students solve their doubts.
              </p>

              <form
                className="create-post doubt-form"
                onSubmit={createPost}
              >
                <textarea
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  placeholder="Describe your doubt clearly..."
                  rows={4}
                  maxLength={1000}
                  required
                />

                <button
                  type="submit"
                  disabled={!postText.trim() || posting}
                >
                  {posting ? "Publishing..." : "Post your doubt"}
                </button>
              </form>

              {postMessage && <p role="status">{postMessage}</p>}

              <div className="section-heading">
                <h2>Recently asked doubts</h2>
              </div>

              {postsLoading && <p>Loading doubts...</p>}

              {!postsLoading &&
                posts.filter((post) => post.type === "doubt").length ===
                  0 && (
                  <div className="empty-state">
                    <span>❓</span>
                    <h3>No doubts yet</h3>
                    <p>Be the first student to ask a question!</p>
                  </div>
                )}

              {posts
                .filter((post) => post.type === "doubt")
                .map(renderPost)}
            </section>
          )}

          {activePage === "Study Resources" && (
            <section className="content-page">
              <p className="eyebrow">LEARN AND SHARE</p>
              <h1>Study Resources 📚</h1>
              <p className="page-description">
                Discover useful study notes, learning tips and resources
                shared by students.
              </p>

              {postsLoading && <p>Loading resources...</p>}

              {!postsLoading &&
                posts.filter((post) => post.type === "resource").length ===
                  0 && (
                  <div className="empty-state">
                    <span>📚</span>
                    <h3>No resources shared yet</h3>
                    <p>
                      Go to Home, choose Study Resource, write something
                      and publish it.
                    </p>
                    <button
                      type="button"
                      className="submit-button"
                      onClick={() => setActivePage("Home")}
                    >
                      Share a resource →
                    </button>
                  </div>
                )}

              {posts
                .filter((post) => post.type === "resource")
                .map(renderPost)}
            </section>
          )}
                    {activePage === "Students" && (
            <section className="content-page">
              <p className="eyebrow">YOUR LEARNING NETWORK</p>
              <h1>Discover Students</h1>
              <p className="page-description">
                Connect with fellow learners and grow together.
              </p>

              <button
                type="button"
                className="submit-button"
                onClick={loadStudents}
                disabled={studentsLoading}
              >
                {studentsLoading ? "Loading..." : "Refresh Students"}
              </button>

              {studentsMessage && <p role="status">{studentsMessage}</p>}

              {followListStudent && (
                <section className="follow-list-panel">
                  <div className="follow-list-header">
                    <div>
                      <h2>
                        {followListStudent.name}'s{" "}
                        {followListType === "followers"
                          ? "Followers"
                          : "Following"}
                      </h2>
                      <p>Students in your learning network</p>
                    </div>

                    <button
                      type="button"
                      className="stat-button"
                      onClick={() => {
                        setFollowListStudent(null);
                        setFollowListType("");
                        setFollowList([]);
                        setFollowListMessage("");
                      }}
                    >
                      Close ✕
                    </button>
                  </div>

                  {followListLoading && <p>Loading students...</p>}
                  {followListMessage && (
                    <p role="alert">{followListMessage}</p>
                  )}

                  {!followListLoading &&
                    !followListMessage &&
                    followList.length === 0 && (
                      <p>No students in this list yet.</p>
                    )}

                  {!followListLoading && followList.length > 0 && (
                    <div className="follow-list-items">
                      {followList.map((person) => (
                        <div
                          className="follow-list-item"
                          key={getId(person)}
                        >
                          <Avatar user={person} />
                          <div className="follow-list-info">
                            <strong>{person.name}</strong>
                            <p>{person.email}</p>
                            <p>{person.bio || "Student at StudyConnect"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {selectedProfile && (
                <section className="follow-list-panel">
                  <div className="follow-list-header">
                    <h2>Student Profile</h2>
                    <button
                      type="button"
                      className="stat-button"
                      onClick={() => {
                        setSelectedProfile(null);
                        setProfilePosts([]);
                        setProfilePostsMessage("");
                      }}
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="student-full-profile">
                    <Avatar user={selectedProfile} />
                    <h2>{selectedProfile.name}</h2>
                    <p>{selectedProfile.email}</p>
                    <p>{selectedProfile.bio || "No bio added yet."}</p>

                    <div className="student-stats">
                      <button
                        type="button"
                        className="stat-button"
                        onClick={() =>
                          openFollowList(selectedProfile, "followers")
                        }
                      >
                        <strong>{selectedProfile.followers || 0}</strong>
                        <span>Followers</span>
                      </button>

                      <button
                        type="button"
                        className="stat-button"
                        onClick={() =>
                          openFollowList(selectedProfile, "following")
                        }
                      >
                        <strong>{selectedProfile.following || 0}</strong>
                        <span>Following</span>
                      </button>
                    </div>

                    <h3>Skills</h3>

                    {selectedProfile.skills?.length ? (
                      <div className="profile-skills">
                        {selectedProfile.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <p>No skills added yet.</p>
                    )}

                    <h3>Posts</h3>

                    {profilePostsLoading && <p>Loading posts...</p>}
                    {profilePostsMessage && (
                      <p role="alert">{profilePostsMessage}</p>
                    )}

                    {!profilePostsLoading &&
                      !profilePostsMessage &&
                      profilePosts.length === 0 && (
                        <p>This student has not shared any posts yet.</p>
                      )}

                    <div className="profile-posts">
                      {profilePosts.map(renderPost)}
                    </div>

                    {selectedProfile.isMe ? (
                      <p>This is your profile.</p>
                    ) : (
                      <button
                        type="button"
                        className="submit-button"
                        onClick={() => toggleFollow(selectedProfile)}
                      >
                        {selectedProfile.isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    )}
                  </div>
                </section>
              )}

              {!studentsLoading &&
                students.length === 0 &&
                !studentsMessage && (
                  <div className="empty-state">
                    <span>♙</span>
                    <h3>No students found</h3>
                    <p>
                      Register another student account to test following.
                    </p>
                  </div>
                )}

              <div className="student-grid">
                {students.map((student) => (
                  <article
                    className="profile-card student-card"
                    key={getId(student)}
                  >
                    <Avatar
                      user={student}
                      className="avatar profile-avatar"
                    />
                    <h2>{student.name}</h2>
                    <p>{student.email}</p>
                    <p>{student.bio || "Student at StudyConnect"}</p>

                    <div className="student-stats">
                      <button
                        type="button"
                        className="stat-button"
                        onClick={() =>
                          openFollowList(student, "followers")
                        }
                      >
                        <strong>{student.followers || 0}</strong>
                        <span>Followers</span>
                      </button>

                      <button
                        type="button"
                        className="submit-button"
                        onClick={() => openStudentProfile(student)}
                      >
                        View Profile
                      </button>

                      <button
                        type="button"
                        className="stat-button"
                        onClick={() =>
                          openFollowList(student, "following")
                        }
                      >
                        <strong>{student.following || 0}</strong>
                        <span>Following</span>
                      </button>
                    </div>

                    {student.skills?.length > 0 && (
                      <p>
                        <strong>Skills:</strong> {student.skills.join(", ")}
                      </p>
                    )}

                    {student.isMe ? (
                      <button
                        type="button"
                        className="submit-button"
                        disabled
                      >
                        Your Profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="submit-button"
                        onClick={() => toggleFollow(student)}
                        disabled={studentsLoading}
                      >
                        {student.isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {activePage === "Notifications" && (
            <section className="content-page">
              <p className="eyebrow">STAY UPDATED</p>
              <h1>Notifications 🔔</h1>
              <p className="page-description">
                Keep up with your StudyConnect community.
              </p>

              <div className="notifications-section">
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all as read ({unreadCount})
                </button>

                {notificationsLoading ? (
                  <p>Loading notifications...</p>
                ) : notifications.length === 0 ? (
                  <div className="empty-state">
                    <span>🔔</span>
                    <h3>No notifications yet</h3>
                    <p>Your community notifications will appear here.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      className={
                        item.isRead
                          ? "notification"
                          : "notification unread"
                      }
                    >
                      <strong>{item.sender?.name || "Student"}</strong>
                      <p>{item.message}</p>
                      <small>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : ""}
                      </small>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="submit-button"
                onClick={() => setActivePage("Home")}
              >
                Back to Home →
              </button>
            </section>
          )}

          {activePage === "Saved Resources" && (
            <section className="content-page">
              <p className="eyebrow">YOUR BOOKMARKS</p>
              <h1>Saved Resources</h1>
              <p className="page-description">
                Your saved study posts are collected here.
              </p>

              {savedPosts.length > 0 ? (
                savedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    liked={likedPosts.includes(post.id)}
                    saved
                    onLike={() => toggleLike(post.id)}
                    onSave={() => toggleSavedPost(post)}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <span>☆</span>
                  <h3>Your learning library is empty</h3>
                  <p>
                    Open Home and click Save on a post to keep it here.
                  </p>
                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => setActivePage("Home")}
                  >
                    Explore posts →
                  </button>
                </div>
              )}
            </section>
          )}
        </main>

        <aside className="right-sidebar">
          <div className="right-card">
            <h3>Popular subjects</h3>

            {communities.slice(0, 4).map((community) => (
              <button
                type="button"
                className="popular-item"
                key={community.name}
                onClick={() => {
                  setSelectedCommunity(community.name);
                  setActivePage("Communities");
                }}
              >
                <span>{community.icon}</span>
                <span>{community.name}</span>
                <span>→</span>
              </button>
            ))}
          </div>

          <div className="right-card learning-card">
            <span className="learning-sparkle">✦</span>
            <h3>Keep learning</h3>
            <p>
              Ask a question today or help another student solve theirs.
            </p>
            <button
              type="button"
              onClick={() => setActivePage("Doubt Zone")}
            >
              Visit Doubt Zone →
            </button>
          </div>

          <p className="dashboard-footer">
            StudyConnect · Learn together, grow together.
          </p>
        </aside>
      </div>
    </div>
  );
}

function PostCard({ post, liked, saved, onLike, onSave }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function toggleComments() {
    const opening = !showComments;
    setShowComments(opening);

    if (!opening) return;

    setLoadingComments(true);
    setMessage("");

    try {
      const response = await fetch(
        `${POSTS_API_URL}/${post.id}/comments`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load comments.");
      }

      setComments(data.comments || []);
    } catch (error) {
      setMessage(error.message || "Could not load comments.");
    } finally {
      setLoadingComments(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();

    if (!commentText.trim() || sending) return;

    const token = localStorage.getItem("studyconnect-token");

    if (!token) {
      setMessage("Please login again.");
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const response = await fetch(
        `${POSTS_API_URL}/${post.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: commentText.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not add comment.");
      }

      setComments(data.comments || []);
      setCommentText("");
      setMessage("Comment added successfully!");
    } catch (error) {
      setMessage(error.message || "Could not add comment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="post-card">
      <div className="post-header">
        <Avatar
          user={{
            name: post.name,
            profilePhoto: post.profilePhoto,
          }}
        />

        <div className="post-author">
          <strong>{post.name}</strong>
          <span>
            {post.community} · {post.time}
          </span>
        </div>

        <span className="post-menu">•••</span>
      </div>

      {post.type && post.type !== "post" && (
        <span className={`post-type-badge ${post.type}`}>
          {post.type === "doubt" ? "❓ Doubt" : "📚 Study Resource"}
        </span>
      )}

      <p className="post-content">{post.text}</p>

      <div className="post-footer">
        <button
          type="button"
          className={`post-action ${liked ? "liked" : ""}`}
          onClick={onLike}
        >
          {liked ? "♥" : "♡"} {post.likes} Likes
        </button>

        <button
          type="button"
          className="post-action"
          onClick={onSave}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>

        <button
          type="button"
          className="post-action"
          onClick={toggleComments}
        >
          💬 {comments.length || post.comments} Comments{" "}
          {showComments ? "↑" : "↓"}
        </button>
      </div>

      {showComments && (
        <div className="comments-panel">
          {loadingComments && <p className="comment-note">Loading comments...</p>}

          {!loadingComments && comments.length === 0 && (
            <p className="comment-note">
              No comments yet. Be the first to comment!
            </p>
          )}

          {comments.map((comment, index) => (
            <div
              className="comment-item"
              key={comment._id || index}
            >
              <strong>{comment.author?.name || "Student"}</strong>
              <p>{comment.text}</p>
            </div>
          ))}

          <form className="comment-form" onSubmit={submitComment}>
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write a comment..."
              maxLength={500}
            />

            <button
              type="submit"
              disabled={!commentText.trim() || sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>

          {message && (
            <p className="comment-note" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default App;