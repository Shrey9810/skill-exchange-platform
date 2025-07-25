const mongoose = require('mongoose');
const Exchange = require('../models/Exchange');
const User = require('../models/User');


// Create a new exchange proposal
exports.createExchange = async (req, res) => {
    const { receiverId, proposerSkill, receiverSkill } = req.body;
    try {
        const newExchange = new Exchange({
            proposer: req.user.id,
            receiver: receiverId,
            proposerSkill,
            receiverSkill
        });
        const exchange = await newExchange.save();
        res.json(exchange);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get all exchanges for the current user
exports.getMyExchanges = async (req, res) => {
    try {
        const exchanges = await Exchange.find({
            $or: [{ proposer: req.user.id }, { receiver: req.user.id }]
        })
        .populate('proposer', 'name avatar')
        .populate('receiver', 'name avatar')
        .sort({ createdAt: -1 });
        res.json(exchanges);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get a single exchange by ID
exports.getExchangeById = async (req, res) => {
    try {
        const exchange = await Exchange.findById(req.params.id)
            .populate('proposer', 'name avatar')
            .populate('receiver', 'name avatar')
            .populate('messages.sender', 'name avatar');
        
        if (!exchange) {
            return res.status(404).json({ msg: 'Exchange not found' });
        }
        
        if (exchange.proposer._id.toString() !== req.user.id && exchange.receiver._id.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(exchange);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update exchange status (accept, decline)
exports.updateExchangeStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const exchange = await Exchange.findById(req.params.id);

        if (!exchange) {
            return res.status(404).json({ msg: 'Exchange not found' });
        }
        if (exchange.status !== 'pending') {
            return res.status(400).json({ msg: 'This exchange is no longer pending.' });
        }
        if (exchange.receiver.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'You are not authorized to update this proposal.' });
        }

        exchange.status = status;
        await exchange.save();

        const updatedExchange = await Exchange.findById(req.params.id)
            .populate('proposer', 'name avatar')
            .populate('receiver', 'name avatar');

        res.json(updatedExchange);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark an exchange as complete by one party
exports.completeExchange = async (req, res) => {
    try {
        const exchange = await Exchange.findById(req.params.id);
        if (!exchange) {
            return res.status(404).json({ msg: 'Exchange not found' });
        }
        if (exchange.status !== 'active') {
            return res.status(400).json({ msg: 'Only active exchanges can be marked as complete.' });
        }

        const userId = req.user.id;
        const isProposer = exchange.proposer.toString() === userId;
        const isReceiver = exchange.receiver.toString() === userId;

        if (!isProposer && !isReceiver) {
            return res.status(401).json({ msg: 'You are not part of this exchange.' });
        }
        
        if (isProposer) exchange.proposerCompleted = true;
        else exchange.receiverCompleted = true;

        if (exchange.proposerCompleted && exchange.receiverCompleted) {
            exchange.status = 'completed';
        }

        await exchange.save();
        
        const updatedExchange = await Exchange.findById(exchange._id)
            .populate('proposer', 'name avatar')
            .populate('receiver', 'name avatar');

        res.json(updatedExchange);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- MAJOR FIX: Rewritten for efficiency and accuracy ---
// Get notification counts for the current user
exports.getNotificationCounts = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Count pending proposals where the user is the receiver
        const newProposalsCount = await Exchange.countDocuments({
            receiver: userId,
            status: 'pending',
            seenByReceiver: false
        });

        // Count active exchanges with unread messages using a single, efficient query
        const unreadMessagesCount = await Exchange.countDocuments({
            status: 'active',
            lastMessageSender: { $ne: userId }, // The other user sent the last message
            $or: [
                // Case 1: The current user is the PROPOSER and the last message is newer than their last seen time
                { proposer: userId, $expr: { $gt: ["$lastMessageTimestamp", "$lastSeenByProposer"] } },
                // Case 2: The current user is the RECEIVER and the last message is newer than their last seen time
                { receiver: userId, $expr: { $gt: ["$lastMessageTimestamp", "$lastSeenByReceiver"] } }
            ]
        });

        res.json({ newProposalsCount, unreadMessagesCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// Mark notifications as seen
exports.markNotificationsAsSeen = async (req, res) => {
    const { type, exchangeId } = req.body;
    const userId = req.user.id;

    try {
        if (type === 'proposals') {
            await Exchange.updateMany(
                { receiver: userId, status: 'pending', seenByReceiver: false },
                { $set: { seenByReceiver: true } }
            );
        } else if (type === 'messages' && exchangeId) {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange) return res.status(404).json({ msg: 'Exchange not found' });

            const isProposer = exchange.proposer.toString() === userId;
            const updateField = isProposer ? 'lastSeenByProposer' : 'lastSeenByReceiver';
            
            // Use the current time to mark as seen
            await Exchange.updateOne({ _id: exchangeId }, { $set: { [updateField]: new Date() } });
        }
        res.json({ msg: 'Notifications marked as seen' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
