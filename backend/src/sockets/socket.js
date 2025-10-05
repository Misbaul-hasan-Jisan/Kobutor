// backend/sockets/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import UserStatus from "../models/userStatus.js"; 

let io;
const chatPageUsers = new Map(); // Track users specifically on chat page

export const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Authenticate socket connection
    socket.on("authenticate", async (token) => {
      try {
        // Check if already authenticated to prevent duplicates
        if (socket.userId) {
          console.log(`User ${socket.userId} already authenticated, skipping`);
          return;
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "secretkey"
        );
        socket.userId = decoded.id;
        socket.join(decoded.id);
        
        console.log(`User ${decoded.id} authenticated`);
        
      } catch (err) {
        console.error("Authentication error:", err);
        socket.disconnect();
      }
    });

    // User enters chat page
    socket.on("enterChatPage", async () => {
      if (!socket.userId) {
        console.log("User not authenticated for chat page");
        return;
      }

      try {
        // Add user to chat page users
        chatPageUsers.set(socket.userId, {
          socketId: socket.id,
          userId: socket.userId,
          enteredAt: new Date()
        });
        
        // Update user status to online in database
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { 
            isOnline: true,
            socketId: socket.id,
            status: "online",
            lastSeen: new Date()
          },
          { upsert: true, new: true }
        );
        
        // Get ALL users currently on chat page (from our Map)
        const onlineUserIds = Array.from(chatPageUsers.keys());
        
        console.log(`User ${socket.userId} entered chat page, online users:`, onlineUserIds);
        
        // 1. Send current online users to the newly connected client
        socket.emit("onlineUsers", onlineUserIds);
        
        // 2. Notify ALL other clients that this user is now online
        socket.broadcast.emit("userOnline", socket.userId);
        
      } catch (error) {
        console.error("Error entering chat page:", error);
      }
    });

    // User leaves chat page (but socket might still be connected)
    socket.on("leaveChatPage", async () => {
      if (!socket.userId) return;

      try {
        // Remove user from chat page users
        chatPageUsers.delete(socket.userId);
        
        // Update user status to offline in database
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { 
            isOnline: false,
            status: "offline",
            lastSeen: new Date()
          }
        );
        
        // Notify ALL users that this user is offline
        socket.broadcast.emit("userOffline", socket.userId);
        
        console.log(`User ${socket.userId} left chat page`);
        
      } catch (error) {
        console.error("Error leaving chat page:", error);
      }
    });

    // Get online users (only those on chat page)
    socket.on("getOnlineUsers", async () => {
      try {
        const onlineUserIds = Array.from(chatPageUsers.keys());
        socket.emit("onlineUsers", onlineUserIds);
        console.log(`Sent online users to ${socket.userId}:`, onlineUserIds);
      } catch (error) {
        console.error("Error getting online users:", error);
      }
    });

    // Request online status for specific users
    socket.on("requestUserStatus", async (userIds) => {
      try {
        const statusMap = {};
        
        userIds.forEach(userId => {
          const isOnline = chatPageUsers.has(userId);
          statusMap[userId] = {
            isOnline,
            status: isOnline ? "online" : "offline",
            lastSeen: new Date() // You might want to store this separately
          };
        });
        
        socket.emit("userStatuses", statusMap);
      } catch (error) {
        console.error("Error getting user statuses:", error);
      }
    });

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.userId} joined chat: ${chatId}`);
    });

    socket.on("messageReaction", (data) => {
      const { chatId, messageId, reactions } = data;
      socket.to(chatId).emit("messageReaction", {
        chatId,
        messageId,
        reactions,
      });
    });

    // Add pin/unpin event handlers
    socket.on("messagePinned", (data) => {
      const { chatId, messageId, pinnedBy, pinnedAt } = data;
      socket.to(chatId).emit("messagePinned", {
        chatId,
        messageId,
        pinnedBy,
        pinnedAt
      });
    });

    socket.on("messageUnpinned", (data) => {
      const { chatId, messageId } = data;
      socket.to(chatId).emit("messageUnpinned", {
        chatId,
        messageId
      });
    });

    socket.on("sendMessage", (messageData) => {
      io.to(messageData.chatId).emit("receiveMessage", messageData);

      const otherParticipants = messageData.participants?.filter(
        (p) => p !== socket.userId
      );

      if (otherParticipants) {
        otherParticipants.forEach((participantId) => {
          io.to(participantId).emit("newMessageNotification", {
            chatId: messageData.chatId,
            message: messageData.text,
            sender: messageData.sender,
          });
        });
      }
    });

    socket.on("markAsRead", (data) => {
      const { chatId, messageIds } = data;
      socket.to(chatId).emit("messagesRead", {
        chatId,
        messageIds,
        readBy: socket.userId,
      });
    });

    socket.on("typing", (data) => {
      socket.to(data.chatId).emit("typing", {
        chatId: data.chatId,
        userId: socket.userId,
      });
    });

    socket.on("stopTyping", (data) => {
      socket.to(data.chatId).emit("stopTyping", {
        chatId: data.chatId,
        userId: socket.userId,
      });
    });

    socket.on("userAway", async () => {
      if (socket.userId && chatPageUsers.has(socket.userId)) {
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { status: "away", lastSeen: new Date() }
        );
        socket.broadcast.emit("userAway", socket.userId);
      }
    });

    socket.on("userBack", async () => {
      if (socket.userId && chatPageUsers.has(socket.userId)) {
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { status: "online", lastSeen: new Date() }
        );
        socket.broadcast.emit("userOnline", socket.userId);
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
      
      if (socket.userId) {
        // Remove from chat page users
        chatPageUsers.delete(socket.userId);
        
        // Update user status to offline
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { 
            isOnline: false,
            status: "offline",
            lastSeen: new Date()
          }
        );
        
        // Notify ALL users that this user is offline
        io.emit("userOffline", socket.userId);
      }
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};