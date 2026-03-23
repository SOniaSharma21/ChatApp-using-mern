import React, { useContext, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Chatcontainer from '../components/Chatcontainer';
import Rightside from '../components/Rightside';
import { ChatContext } from '../../context/ChatContext';

const Homepage = () => {
  const { selectedUser, setSelectedUser } = useContext(ChatContext);
  const [activeChat, setActiveChat] = useState(null); // tracks clicked chat

  return (
    <div className="w-screen h-screen">
      <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full grid grid-cols-1 relative
        ${selectedUser && activeChat
          ? "md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
          : selectedUser
            ? "md:grid-cols-[1fr_2fr]"
            : "md:grid-cols-1"
        }`}
      >
        {/* Left Sidebar always shows */}
        <Sidebar setActiveChat={setActiveChat} />

        {/* Show ChatContainer only if a user is selected */}
        {selectedUser && (
          <Chatcontainer setActiveChat={setActiveChat} />
        )}

        {/* Show RightSide only if a chat is active */}
        {selectedUser && activeChat && (
  <Rightside selectedUser={selectedUser} setSelectedUser={setSelectedUser} activeChat={activeChat} />
)}
      </div>
    </div>
  );
};

export default Homepage;