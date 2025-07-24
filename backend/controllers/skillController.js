const User = require('../models/User');

// Get all available skills, excluding those of the current user
exports.getAllSkills = async (req, res) => {
    const { search, category, userId } = req.query;

    try {
        // Base query to find users
        const userQuery = {};

        // Exclude the current user if their ID is provided
        if (userId) {
            userQuery._id = { $ne: userId };
        }

        // Build the query to find users who have skills that match the filter criteria
        const skillFilter = {};
        if (category && category !== 'All') {
            skillFilter['skillsOffered.category'] = category;
        }
        if (search) {
            skillFilter['skillsOffered.title'] = { $regex: search, $options: 'i' };
        }

        // Combine the queries
        const finalQuery = { ...userQuery, ...skillFilter };

        // Find users who match the query and select the necessary fields
        const usersWithSkills = await User.find(finalQuery).select('name avatar avgRating reviews skillsOffered');

        // Flatten the skills into a single array with owner info
        let allSkills = [];
        usersWithSkills.forEach(user => {
            const userSkills = user.skillsOffered
                // Filter again on the server to ensure we only return matched skills
                .filter(skill => {
                    const titleMatch = search ? skill.title.toLowerCase().includes(search.toLowerCase()) : true;
                    const categoryMatch = (category && category !== 'All') ? skill.category === category : true;
                    return titleMatch && categoryMatch;
                })
                .map(skill => ({
                    id: skill._id,
                    title: skill.title,
                    description: skill.description,
                    category: skill.category,
                    owner: { 
                        id: user._id, 
                        name: user.name, 
                        avatar: user.avatar,
                        // --- NEW --- Add rating info to the owner object
                        avgRating: user.avgRating,
                        reviewCount: user.reviews.length
                    }
                }));
            allSkills = [...allSkills, ...userSkills];
        });

        res.json(allSkills);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
