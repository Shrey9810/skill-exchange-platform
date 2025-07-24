const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        console.log("MONGO_URI:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4, // Force IPv4 to avoid DNS/IPv6 issues
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
