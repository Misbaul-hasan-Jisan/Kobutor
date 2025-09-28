// backend/sockets/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import UserStatus from "../models/userStatus.js"; 

let io;

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
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "secretkey"
        );
        socket.userId = decoded.id;
        socket.join(decoded.id);
        
        // Update user status to online
        await UserStatus.findOneAndUpdate(
          { userId: decoded.id },
          { 
            isOnline: true,
            socketId: socket.id,
            status: "online",
            lastSeen: new Date()
          },
          { upsert: true, new: true }
        );
        
        // Notify all users that this user is online
        socket.broadcast.emit("userOnline", decoded.id);
        
        // Send current online users to the newly connected client
        const onlineUsers = await UserStatus.find({ 
          isOnline: true 
        }).select('userId');
        const onlineUserIds = onlineUsers.map(user => user.userId.toString());
        
        socket.emit("onlineUsers", onlineUserIds);
        console.log(`User ${decoded.id} authenticated on socket, online users:`, onlineUserIds);
      } catch (err) {
        console.error("Authentication error:", err);
        socket.disconnect();
      }
    });

    // Add this new event handler for getting online users
    socket.on("getOnlineUsers", async () => {
      if (socket.userId) {
        const onlineUsers = await UserStatus.find({ 
          isOnline: true 
        }).select('userId');
        const onlineUserIds = onlineUsers.map(user => user.userId.toString());
        socket.emit("onlineUsers", onlineUserIds);
      }
    });

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
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
      if (socket.userId) {
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { status: "away", lastSeen: new Date() }
        );
        socket.broadcast.emit("userAway", socket.userId);
      }
    });

    socket.on("userBack", async () => {
      if (socket.userId) {
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
        // Update user status to offline
        await UserStatus.findOneAndUpdate(
          { userId: socket.userId },
          { 
            isOnline: false,
            status: "offline",
            lastSeen: new Date()
          }
        );
        
        // Notify all users that this user is offline
        socket.broadcast.emit("userOffline", socket.userId);
      }
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
