const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Exchange = require('./models/Exchange');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT"],
        credentials: true
    },
    allowEIO3: true 
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
    console.log(` User connected: ${socket.id}`);

    socket.on('joinExchangeRoom', (exchangeId) => {
        socket.join(exchangeId);
        console.log(` User ${socket.id} joined room ${exchangeId}`);
    });

    socket.on('sendMessage', async ({ exchangeId, senderId, text }) => {
        console.log(`\n Message received on backend:`);
        console.log(`  - Exchange ID: ${exchangeId}`);

        try {
            // --- MAJOR FIX: Add server-side validation ---
            // 1. Find the exchange first.
            const exchange = await Exchange.findById(exchangeId);

            // 2. Check if the exchange exists and if its status is 'active'.
            if (!exchange || exchange.status !== 'active') {
                console.error(` Message rejected: Exchange ${exchangeId} is not active or does not exist.`);
                return; // Stop execution if the chat should be closed.
            }

            const messagePayload = {
                sender: senderId,
                text: text,
                timestamp: new Date()
            };

            console.log('  - Exchange is active. Attempting to update database...');
            
            // 3. Proceed with saving the message only if validation passes.
            // We can use the 'exchange' object we already fetched.
            exchange.messages.push(messagePayload);
            exchange.lastMessageTimestamp = new Date();
            exchange.lastMessageSender = senderId;
            
            const updatedExchange = await exchange.save();
            await updatedExchange.populate('messages.sender', 'name avatar');


            if (updatedExchange) {
                console.log('  - Database update successful!');
                const newMessage = updatedExchange.messages[updatedExchange.messages.length - 1];
                console.log('  - Broadcasting "newMessage" event to room:', exchangeId);
                io.to(exchangeId).emit('newMessage', newMessage);
            } else {
                console.error(' FAILED: Could not save the updated exchange:', exchangeId);
            }
        } catch (error) {
            console.error(' CRITICAL: Error during message saving or broadcasting:', error);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(` User disconnected: ${socket.id}. Reason: ${reason}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(` Server started on port ${PORT}`));
