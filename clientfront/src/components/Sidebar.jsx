import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../../context/ChatContext";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");

  const navigate = useNavigate();

  const search = (input || "").trim().toLowerCase();

  const filteredUsers = search.length
    ? (users || []).filter(
        (user) =>
          user &&
          typeof user.fullName === "string" &&
          user.fullName.toLowerCase().includes(search)
      )
    : users || [];

  useEffect(() => {
    if (typeof getUsers === "function") getUsers();
  }, [onlineUsers, getUsers]);

  return (
    <div
      className={`bg-white/30 backdrop-blur-xl h-full p-5 overflow-y-scroll text-gray-800 border-r border-white/30 ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-40" />

          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer opacity-70 hover:opacity-100"
            />

            {/* Dropdown */}
            <div className="absolute top-full right-0 z-20 w-32 p-4 rounded-md bg-white/80 backdrop-blur-md border border-white/30 text-gray-700 hidden group-hover:block shadow-md">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-violet-600"
              >
                Edit profile
              </p>

              <hr className="my-2 border-white/30" />

              <p
                onClick={() => logout()}
                className="cursor-pointer text-sm hover:text-red-500"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/50 backdrop-blur-md rounded-full flex items-center gap-2 py-2 px-4 mt-5 border border-white/30">
          <img
            src={assets.search_icon}
            alt="Search"
            className="w-3 opacity-60"
          />

          <input
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none text-gray-800 text-sm placeholder-gray-500 flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      {/* Users */}
      <div className="flex flex-col gap-1">
        {filteredUsers.map((user, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({
                ...prev,
                [user._id]: 0,
              }));
            }}
            className={`relative flex items-center gap-3 p-2 pl-4 rounded-lg cursor-pointer transition backdrop-blur-md
              ${
                selectedUser?._id === user._id
                  ? "bg-violet-200/60"
                  : "hover:bg-white/40"
              }`}
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt=""
              className="w-[35px] aspect-square rounded-full border border-white/40"
            />

            <div className="flex flex-col leading-5">
              <p className="text-gray-900">{user.fullName}</p>

              {Array.isArray(onlineUsers) &&
              onlineUsers.includes(user._id) ? (
                <span className="text-green-500 text-xs">online</span>
              ) : (
                <span className="text-gray-500 text-xs">offline</span>
              )}
            </div>

            {unseenMessages[user._id] > 0 && (
              <p className="absolute top-2 right-3 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 text-white shadow">
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;