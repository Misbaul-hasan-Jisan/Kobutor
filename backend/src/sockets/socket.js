// backend/sockets/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

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

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Authenticate socket connection
    socket.on("authenticate", (token) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "secretkey"
        );
        socket.userId = decoded.id;
        socket.join(decoded.id); // Join user's personal room
        console.log(`User ${decoded.id} authenticated on socket`);
      } catch (err) {
        socket.disconnect();
      }
    });

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });
    socket.on("messageReaction", (data) => {
      const { chatId, messageId, reactions } = data;

      // Broadcast reaction update to all users in the chat
      socket.to(chatId).emit("messageReaction", {
        chatId,
        messageId,
        reactions,
      });
    });

    socket.on("sendMessage", (messageData) => {
      io.to(messageData.chatId).emit("receiveMessage", messageData);

      // Notify other participant if they're not in the chat
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

      // Notify other participants in the chat
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



    socket.on("markAsRead", (data) => {
      socket.to(data.chatId).emit("messagesRead", {
        chatId: data.chatId,
        readerId: socket.userId,
        messageIds: data.messageIds,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
