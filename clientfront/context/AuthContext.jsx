import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// --- Base URL from .env
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

// Create context
export const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ✅ Check auth on mount
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Login or Register
  const login = async (state, credentials) => {
    try {
      const endpoint = state === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const { data } = await axios.post(endpoint, credentials);

      if (data.success) {
        const user = data.userData || data.user;
        setAuthUser(user);
        connectSocket(user);

        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        setToken(data.token);
        localStorage.setItem("token", data.token);

        toast.success(data.message);
      } else {
        console.log("Backend", data);
        toast.error(data.message);
      }
    } catch (error) {
      console.log("Frontend", error)
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["Authorization"] = null;
    toast.success("Logged out successfully");
    if (socket) socket.disconnect();
  };

  // ✅ Update Profile
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Socket connection
  const connectSocket = (user, token) => {
    if (!user || socket?.connected) return;

    console.log("Socket", user)

    const newSocket = io(backendUrl, {
      auth: { userId: user._id, token }, // updated for Socket.io v4+
    });

    newSocket.connect();
    setSocket(newSocket);

    // Listen for online users (event name must match backend)
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    // Clean up on disconnect
    newSocket.on("disconnect", () => {
      setOnlineUsers([]);
    });
  };

  // ✅ Set token header & check auth on mount
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    checkAuth();

    return () => {
      if (socket) socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Provide context value
  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
