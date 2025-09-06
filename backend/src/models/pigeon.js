// src/models/Pigeon.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pigeonSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    zone: { type: String, enum: ['local', 'international', 'random'], required: true },
    countryCode: { type: String },
    color: { type: String, enum: ['black', 'white', 'brown'], default: 'white' },
    content: { type: String, required: true },
    status: { type: String, enum: ['catchable', 'caught', 'expired'], default: 'catchable' },
    expiresAt: { type: Date },
}, { timestamps: true });

export default model('Pigeon', pigeonSchema);
