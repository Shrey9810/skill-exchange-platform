const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Exchange = require('./models/Exchange');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT"]
    }
});

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/', (req, res) => res.send('SkillSwap API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/exchanges', require('./routes/exchanges'));
app.use('/api/gemini', require('./routes/gemini'));

// Socket.IO Connection Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinExchangeRoom', (exchangeId) => {
        socket.join(exchangeId);
        console.log(`User ${socket.id} joined room ${exchangeId}`);
    });

    socket.on('sendMessage', async ({ exchangeId, senderId, text }) => {
        try {
            const message = { sender: senderId, text, timestamp: new Date() };
            
            const exchange = await Exchange.findByIdAndUpdate(
                exchangeId,
                { 
                    $push: { messages: message },
                    // --- UPDATE: Also set the sender of the last message ---
                    $set: { 
                        lastMessageTimestamp: new Date(),
                        lastMessageSender: senderId 
                    }
                },
                { new: true }
            ).populate('messages.sender', 'name avatar');

            if (exchange) {
                const newMessage = exchange.messages[exchange.messages.length - 1];
                socket.to(exchangeId).emit('newMessage', newMessage);
            }
        } catch (error) {
            console.error('Error saving or broadcasting message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
