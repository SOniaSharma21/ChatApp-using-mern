import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast"; // ✅ FIX

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // ✅ GET USERS
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ GET MESSAGES
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);

        // ✅ reset unseen when chat opens
        setUnseenMessages((prev) => ({
          ...prev,
          [userId]: 0,
        }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ SEND MESSAGE
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]); // ✅ FIX
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ SOCKET SUBSCRIBE (FIXED)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // if current chat open
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        setMessages((prev) => [...prev, newMessage]);

        // mark as seen
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        // increase unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]:
            (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage); // ✅ FIX (important)
    };
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};