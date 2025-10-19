// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isRead: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false }, // New field for pinning
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who pinned the message
    pinnedAt: { type: Date }, // When it was pinned
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reactions: {
      type: Map,
      of: {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        count: { type: Number, default: 0 },
      },
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        if (ret.reactions instanceof Map) {
          ret.reactions = Object.fromEntries(ret.reactions);
        } else if (ret.reactions && typeof ret.reactions === "object") {
          // Already an object
        } else {
          ret.reactions = {};
        }
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        if (ret.reactions instanceof Map) {
          ret.reactions = Object.fromEntries(ret.reactions);
        } else if (ret.reactions && typeof ret.reactions === "object") {
          // Already an object
        } else {
          ret.reactions = {};
        }
        return ret;
      },
    },
  }
);

// Index for better performance on pinned messages
messageSchema.index({ chatId: 1, isPinned: -1, pinnedAt: -1 });

messageSchema.methods.toJSON = function () {
  const message = this.toObject();
  if (message.reactions instanceof Map) {
    message.reactions = Object.fromEntries(message.reactions);
  } else if (message.reactions && typeof message.reactions === "object") {
    // Already an object
  } else {
    message.reactions = {};
  }
  return message;
};

export default mongoose.model("Message", messageSchema);
