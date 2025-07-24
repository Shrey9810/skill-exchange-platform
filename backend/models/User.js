const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: '' }
});

const ReviewSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exchange: { type: mongoose.Schema.Types.ObjectId, ref: 'Exchange', required: true },
    createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://placehold.co/100x100/EED6D3/88394A?text=U' },
    bio: { type: String, default: 'Welcome to my SkillSwap profile!' },
    skillsOffered: [SkillSchema],
    reviews: [ReviewSchema],
    avgRating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
