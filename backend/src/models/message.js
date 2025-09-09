// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isRead: { type: Boolean, default: false },
    reactions: {
      type: Map,
      of: {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        count: { type: Number, default: 0 }
      },
      default: () => new Map() // Initialize as empty Map
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Convert Map to object for JSON response
        if (ret.reactions instanceof Map) {
          ret.reactions = Object.fromEntries(ret.reactions);
        } else if (ret.reactions && typeof ret.reactions === 'object') {
          // Already an object, no conversion needed
        } else {
          ret.reactions = {};
        }
        return ret;
      }
    },
    toObject: {
      transform: function(doc, ret) {
        if (ret.reactions instanceof Map) {
          ret.reactions = Object.fromEntries(ret.reactions);
        } else if (ret.reactions && typeof ret.reactions === 'object') {
          // Already an object
        } else {
          ret.reactions = {};
        }
        return ret;
      }
    }
  }
);

// In your Message model:
messageSchema.methods.toJSON = function() {
  const message = this.toObject();
  if (message.reactions instanceof Map) {
    message.reactions = Object.fromEntries(message.reactions);
  } else if (message.reactions && typeof message.reactions === 'object') {
    // Already an object, no conversion needed
  } else {
    message.reactions = {};
  }
  return message;
};

export default mongoose.model("Message", messageSchema);