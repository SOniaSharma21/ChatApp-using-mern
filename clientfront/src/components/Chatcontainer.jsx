import React, { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { io } from "socket.io-client";

const Chatcontainer = ({ setActiveChat }) => {
  const { messages, selectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  // CALL STATES
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [callType, setCallType] = useState(null);
  const [callStatus, setCallStatus] = useState("Calling...");
  const [remoteStream, setRemoteStream] = useState(null);

  const socket = useRef(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:5000");
    return () => socket.current.disconnect();
  }, []);

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= MESSAGE =================

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input });
    setInput('');
  };

  // ================= CALL =================

  const startCall = async (type) => {
    setCallType(type);
    setCallStatus("Calling...");

    setCallActive(false);
    setTimeout(() => setCallActive(true), 100);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true
      });
    } catch (err) {
      console.error(err);
      return;
    }

    localVideoRef.current.srcObject = stream;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    stream.getTracks().forEach(track =>
      peerConnection.current.addTrack(track, stream)
    );

    peerConnection.current.ontrack = (event) => {
      const stream = event.streams[0];
      remoteVideoRef.current.srcObject = stream;
      setRemoteStream(stream);
      setCallStatus("Connected");
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: selectedUser._id
        });
      }
    };

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.current.emit("call-user", { offer, to: selectedUser._id, type });
  };

  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("incoming-call", async ({ offer, from, type }) => {
      setCallType(type);
      setCallStatus("Incoming call...");
      setCallActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true
      });

      localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      stream.getTracks().forEach(track =>
        peerConnection.current.addTrack(track, stream)
      );

      peerConnection.current.ontrack = (event) => {
        const stream = event.streams[0];
        remoteVideoRef.current.srcObject = stream;
        setRemoteStream(stream);
        setCallStatus("Connected");
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            candidate: event.candidate,
            to: from
          });
        }
      };

      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.current.emit("answer-call", { answer, to: from });
    });

    socket.current.on("call-answered", async ({ answer }) => {
      await peerConnection.current?.setRemoteDescription(answer);
    });

    socket.current.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(candidate);
      }
    });
  }, []);

 const endCall = async () => {
  try {
    // ⏱ calculate duration
    const duration = Math.floor((Date.now() - callStartTime.current) / 1000);

    // 🔥 SAVE CALL
    await fetch("/api/calls/save-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: authUser._id,
        to: selectedUser._id,
        type: callType,
        duration,
        status: remoteStream ? "completed" : "missed"
      })
    });

  } catch (err) {
    console.error("Save call error:", err);
  }

  // 🧹 cleanup
  localVideoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
  peerConnection.current?.close();
  peerConnection.current = null;

  setRemoteStream(null);
  setCallActive(false);
  setCallType(null);
};

  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject;
    stream?.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  const toggleVideo = () => {
    const stream = localVideoRef.current?.srcObject;
    stream?.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setVideoOn(track.enabled);
    });
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      setActiveChat(selectedUser);
    }
  }, [selectedUser]);

  if (!selectedUser) return null;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <img src={selectedUser.profilePic || assets.avatar_icon} className="w-10 h-10 rounded-full" />
          <p>{selectedUser.fullName}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => startCall("audio")}>📞</button>
          <button onClick={() => startCall("video")}>🎥</button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
        {messages.map((msg, i) => {
          const isSender = msg.senderId === authUser._id;

          return (
            <div key={i} className={`flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"}`}>

              {!isSender && (
                <img src={selectedUser.profilePic || assets.avatar_icon} className="w-8 h-8 rounded-full" />
              )}

              <div className={`p-2 rounded-lg max-w-xs ${isSender ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-200 rounded-bl-none"}`}>
                {msg.text && <p>{msg.text}</p>}
                {msg.image && <img src={msg.image} className="mt-2 rounded-lg max-h-40" />}
                <div className="text-xs mt-1 opacity-70">{formatMessageTime(msg.createdAt)}</div>
              </div>

              {isSender && (
                <img src={authUser.profilePic || assets.avatar_icon} className="w-8 h-8 rounded-full" />
              )}

            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* INPUT */}
      <div className="p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 flex-1 rounded"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>

      {/* CALL UI */}
      {callActive && (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center text-white">

          {/* VIDEO */}
          {callType === "video" ? (
            <div className="relative w-full h-full">

              <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />

              {!remoteStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img src={selectedUser.profilePic || assets.avatar_icon} className="w-32 h-32 rounded-full mb-4" />
                  <p>{selectedUser.fullName}</p>
                  <p>{callStatus}</p>
                </div>
              )}

              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="absolute bottom-10 right-5 w-32 rounded-lg border"
              />

              <div className="absolute top-10 w-full text-center">
                <p className="text-lg font-semibold">{selectedUser.fullName}</p>
                <p className="text-sm">{callStatus}</p>
              </div>

            </div>
          ) : (
            // AUDIO
            <div className="flex flex-col items-center">
              <img src={selectedUser.profilePic || assets.avatar_icon} className="w-40 h-40 rounded-full mb-6" />
              <h2 className="text-2xl">{selectedUser.fullName}</h2>
              <p className="mt-2">{callStatus}</p>
            </div>
          )}

          {/* CONTROLS */}
          <div className="absolute bottom-10 flex gap-4">
            <button onClick={toggleMute}>{isMuted ? "🔇" : "🎤"}</button>
            {callType === "video" && <button onClick={toggleVideo}>{videoOn ? "📷" : "🚫"}</button>}
            <button onClick={endCall}>❌</button>
          </div>

        </div>
      )}

    </div>
  );
};

export default Chatcontainer;