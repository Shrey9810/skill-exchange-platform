const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ExchangeSchema = new mongoose.Schema({
    proposer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    proposerSkill: { type: Object, required: true },
    receiverSkill: { type: Object, required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'declined'],
        default: 'pending'
    },
    proposerCompleted: { type: Boolean, default: false },
    receiverCompleted: { type: Boolean, default: false },
    proposerRated: { type: Boolean, default: false },
    receiverRated: { type: Boolean, default: false },
    messages: [MessageSchema],
    createdAt: { type: Date, default: Date.now },
    
    seenByReceiver: { type: Boolean, default: false },
    lastMessageTimestamp: { type: Date, default: Date.now },
    lastSeenByProposer: { type: Date, default: Date.now },
    lastSeenByReceiver: { type: Date, default: Date.now },
    // --- NEW FIELD ---
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Exchange', ExchangeSchema);
