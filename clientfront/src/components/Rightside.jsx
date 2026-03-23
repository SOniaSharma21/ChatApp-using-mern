import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const Rightside = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers, authUser } = useContext(AuthContext);

  const [msgImages, setMsgImages] = useState([]);
  const [calls, setCalls] = useState([]);

  // ✅ Extract images from messages
  useEffect(() => {
    if (messages) {
      setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image));
    }
  }, [messages]);

  // ✅ FETCH CALL HISTORY (FIXED)
  useEffect(() => {
    if (!selectedUser || !authUser) return;

    const fetchCalls = async () => {
      try {
        const res = await fetch(`/api/calls/${authUser._id}`);
        const data = await res.json();

        console.log("CALL DATA:", data); // 🔍 DEBUG

        // ✅ FILTER CALLS WITH SELECTED USER
        const filtered = data.filter(
          c =>
            c?.from?._id?.toString() === selectedUser._id ||
            c?.to?._id?.toString() === selectedUser._id
        );

        setCalls(filtered);
      } catch (err) {
        console.error("Fetch Calls Error:", err);
      }
    };

    fetchCalls();
  }, [selectedUser, authUser]);

  if (!selectedUser) return null;

  return (
    <div className="bg-white/30 backdrop-blur-xl text-gray-800 w-full relative overflow-y-auto border-l border-white/30 max-md:hidden">

      {/* USER INFO */}
      <div className="pt-16 flex flex-col items-center gap-2 text-sm mx-auto">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          className="w-20 h-20 rounded-full border"
        />

        <h1 className="text-xl font-semibold flex items-center gap-2">
          {onlineUsers?.includes(selectedUser._id) && (
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          )}
          {selectedUser.fullName}
        </h1>

        <p className="text-gray-600 text-center px-6">
          {selectedUser.bio}
        </p>
      </div>

      <hr className="my-5" />

      {/* MEDIA */}
      <div className="px-5">
        <p className="font-medium mb-2">Media</p>

        <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto">
          {msgImages.map((url, i) => (
            <img
              key={i}
              src={url}
              onClick={() => window.open(url)}
              className="rounded-lg cursor-pointer"
            />
          ))}
        </div>
      </div>

      <hr className="my-5" />

      {/* 🔥 CALL HISTORY */}
      <div className="px-5 pb-20">
        <p className="font-medium mb-3">Call History</p>

        <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto">

          {calls.length === 0 && (
            <p className="text-sm text-gray-500">No calls yet</p>
          )}

          {calls.map((call, i) => {
            const isCaller = call.from._id === authUser._id;

            return (
              <div
                key={i}
                className="flex items-center justify-between bg-white/50 p-2 rounded-lg"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <img
                    src={
                      (isCaller
                        ? call.to.profilePic
                        : call.from.profilePic) || assets.avatar_icon
                    }
                    className="w-10 h-10 rounded-full"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      {isCaller
                        ? call.to.fullName
                        : call.from.fullName}
                    </p>

                    <p
                      className={`text-xs ${
                        call.status === "missed"
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {call.type === "video" ? "🎥" : "📞"}{" "}
                      {call.status}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-xs text-gray-500 text-right">
                  <p>
                    {call.duration
                      ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                      : ""}
                  </p>
                  <p>
                    {new Date(call.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-violet-500 text-white py-2 px-10 rounded-full"
      >
        Logout
      </button>
    </div>
  );
};

export default Rightside;