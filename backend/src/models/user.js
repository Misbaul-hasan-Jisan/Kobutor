// backend/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: function() { return this.authProvider === 'email'; },
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: function() { return this.authProvider === 'email'; }
    },
    // Google authentication fields
    googleId: {
      type: String,
      sparse: true // Allows null values but ensures uniqueness when present
    },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email"
    },
    displayName: {
      type: String,
      trim: true
    },
    photoURL: {
      type: String,
      default: ""
    },
    // Verification fields
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    emailVerificationToken: { 
      type: String 
    },
    emailVerificationExpires: { 
      type: Date 
    },
    status: { 
      type: String, 
      enum: ["pending", "active", "suspended"], 
      default: "pending" 
    },
    // Add username change tracking
    previousUsernames: [{ 
      username: String,
      changedAt: { type: Date, default: Date.now }
    }],
    lastUsernameChange: { 
      type: Date 
    },
    usernameChangeCount: { 
      type: Number, 
      default: 0 
    },
    // Additional fields for better user management
    lastLogin: {
      type: Date
    },
    loginCount: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true 
  }
);

// Compound indexes for better query performance
userSchema.index({ email: 1, authProvider: 1 });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 });
userSchema.index({ status: 1, isVerified: 1 });

// Virtual for checking if user is active
userSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.isVerified;
});

// Pre-save middleware to handle username changes
userSchema.pre('save', function(next) {
  if (this.isModified('username') && !this.isNew) {
    // Track username changes
    if (!this.previousUsernames) {
      this.previousUsernames = [];
    }
    
    // Add current username to history before changing
    const currentUsername = this._previousUsername || this.username;
    this.previousUsernames.push({
      username: currentUsername,
      changedAt: new Date()
    });
    
    this.lastUsernameChange = new Date();
    this.usernameChangeCount += 1;
  }
  next();
});

// Method to check if user can change username
userSchema.methods.canChangeUsername = function() {
  const MAX_CHANGES_PER_MONTH = 2;
  const ONE_MONTH_AGO = new Date();
  ONE_MONTH_AGO.setMonth(ONE_MONTH_AGO.getMonth() - 1);
  
  if (!this.lastUsernameChange) return true;
  
  // Count changes in last month
  const recentChanges = this.previousUsernames.filter(
    change => change.changedAt > ONE_MONTH_AGO
  ).length;
  
  return recentChanges < MAX_CHANGES_PER_MONTH;
};

// Method to get user display name (for Google users)
userSchema.methods.getDisplayName = function() {
  return this.displayName || this.username || this.email.split('@')[0];
};

// Method to get user profile picture
userSchema.methods.getProfilePicture = function() {
  return this.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getDisplayName())}&background=random`;
};

// Static method to find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Static method to find user by email (case-insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to check if email exists
userSchema.statics.emailExists = async function(email) {
  const user = await this.findOne({ email: email.toLowerCase() });
  return !!user;
};

// Static method to create Google user
userSchema.statics.createGoogleUser = async function(googleData) {
  const { uid, email, displayName, photoURL, emailVerified } = googleData;
  
  // Generate username from email
  const baseUsername = email.split('@')[0];
  let username = baseUsername;
  let counter = 1;
  
  // Ensure unique username
  while (await this.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  const user = new this({
    username,
    email: email.toLowerCase(),
    displayName: displayName || username,
    photoURL: photoURL || '',
    googleId: uid,
    authProvider: 'google',
    isVerified: emailVerified || true,
    status: 'active'
  });
  
  return user.save();
};

export default mongoose.model("User", userSchema);