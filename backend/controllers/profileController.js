const User = require('../models/User');
const Exchange = require('../models/Exchange');

// --- REVISED AND FIXED FUNCTION ---
// Get current user's profile, now with reviewer details populated
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await User.findById(req.user.id)
            .select('-password')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'reviewer',
                    select: 'name avatar'
                }
            });

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    const { name, bio, skillsOffered, avatar } = req.body;
    const profileFields = { name, bio, skillsOffered, avatar };

    try {
        let profile = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add a review for a user after a completed exchange
exports.addReview = async (req, res) => {
    const { exchangeId, ratedUserId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    try {
        const ratedUser = await User.findById(ratedUserId);
        const exchange = await Exchange.findById(exchangeId);

        if (!ratedUser || !exchange) {
            return res.status(404).json({ msg: 'User or Exchange not found.' });
        }

        const isProposer = exchange.proposer.toString() === reviewerId;
        
        if ((isProposer && exchange.proposerRated) || (!isProposer && exchange.receiverRated)) {
            return res.status(400).json({ msg: 'You have already submitted a review for this exchange.' });
        }

        ratedUser.reviews.push({ rating, comment, reviewer: reviewerId, exchange: exchangeId });

        const totalRating = ratedUser.reviews.reduce((acc, review) => acc + review.rating, 0);
        ratedUser.avgRating = totalRating / ratedUser.reviews.length;

        await ratedUser.save();

        if (isProposer) {
            exchange.proposerRated = true;
        } else {
            exchange.receiverRated = true;
        }
        await exchange.save();

        res.json(ratedUser.reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- REVISED AND FIXED FUNCTION ---
// Get a user's public profile by their ID
exports.getProfileById = async (req, res) => {
    try {
        const userProfile = await User.findById(req.params.userId)
            .select('-password -email')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'reviewer',
                    select: 'name avatar'
                }
            });

        if (!userProfile) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // FIX: Get the total review count *before* filtering for comments.
        const totalReviewCount = userProfile.reviews.length;
        
        // Now, filter the reviews to only include those with comments for display.
        const reviewsWithComments = userProfile.reviews.filter(review => review.comment && review.comment.trim() !== '');
        userProfile.reviews = reviewsWithComments;

        const completedExchangesCount = await Exchange.countDocuments({
            status: 'completed',
            $or: [{ proposer: req.params.userId }, { receiver: req.params.userId }]
        });

        res.json({
            profile: userProfile,
            completedExchanges: completedExchangesCount,
            totalReviewCount: totalReviewCount // Send the correct total count to the frontend
        });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};
