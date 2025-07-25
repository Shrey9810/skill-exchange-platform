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

// --- CORS Configuration for Production ---
// Define the list of URLs that are allowed to connect to your backend.
const allowedOrigins = [
    'http://localhost:3000',    // For local development
    process.env.CLIENT_URL      // For your deployed Vercel frontend
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        // If the origin of the request is in our allowed list, allow it.
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Otherwise, block the request.
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

// Use the CORS options for all incoming Express requests
app.use(cors(corsOptions));

// Initialize Socket.IO with the same CORS options
const io = new Server(server, {
    cors: corsOptions,
    allowEIO3: true
});

// Connect to Database
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.get('/', (req, res) => res.send('SkillSwap API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/exchanges', require('./routes/exchanges'));
app.use('/api/gemini', require('./routes/gemini'));

// A simple in-memory store for user sockets
const userSockets = {};

// Socket.IO Connection Logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Store user socket
    socket.on('registerUser', (userId) => {
        userSockets[userId] = socket.id;
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('joinExchangeRoom', (exchangeId) => {
        socket.join(exchangeId);
        console.log(`User ${socket.id} joined room ${exchangeId}`);
    });

    socket.on('sendMessage', async ({ exchangeId, senderId, text }) => {
        try {
            const exchange = await Exchange.findById(exchangeId);
            if (!exchange || exchange.status !== 'active') {
                console.error(`Message rejected: Exchange ${exchangeId} is not active or does not exist.`);
                return;
            }

            const messagePayload = {
                sender: senderId,
                text: text,
                timestamp: new Date()
            };
            
            exchange.messages.push(messagePayload);
            exchange.lastMessageTimestamp = new Date();
            exchange.lastMessageSender = senderId;
            
            const updatedExchange = await exchange.save();
            await updatedExchange.populate('messages.sender', 'name avatar');

            if (updatedExchange) {
                const newMessage = updatedExchange.messages[updatedExchange.messages.length - 1];
                
                const payload = {
                    ...newMessage.toObject(),
                    exchangeId: exchangeId
                };

                io.to(exchangeId).emit('newMessage', payload);
            } else {
                console.error('FAILED: Could not save the updated exchange:', exchangeId);
            }
        } catch (error) {
            console.error('CRITICAL: Error during message saving or broadcasting:', error);
        }
    });

    // --- WebRTC Signaling Events ---
    socket.on('video-call-request', ({ from, to, exchangeId }) => {
        console.log(`Video call request from ${from.name} to ${to._id}`);
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('incoming-video-call', { from, exchangeId });
        } else {
            socket.emit('call-error', { message: 'User is not online.' });
        }
    });

    socket.on('video-call-accepted', ({ from, to }) => {
        console.log(`Call accepted by ${from.name} to ${to.name}`);
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('call-accepted', { from });
        }
    });

    socket.on('video-call-declined', ({ to }) => {
        console.log(`Call declined by user to ${to.name}`);
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('call-declined');
        }
    });
    
    socket.on('webrtc-offer', ({ offer, to, from }) => {
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('webrtc-offer', { offer, from });
        }
    });

    socket.on('webrtc-answer', ({ answer, to }) => {
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('webrtc-answer', answer);
        }
    });

    socket.on('webrtc-ice-candidate', ({ candidate, to }) => {
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('webrtc-ice-candidate', candidate);
        }
    });

    socket.on('end-call', ({ to }) => {
        const toSocketId = userSockets[to._id];
        if (toSocketId) {
            io.to(toSocketId).emit('call-ended');
        }
    });


    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}. Reason: ${reason}`);
        // Clean up user from userSockets
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                delete userSockets[userId];
                console.log(`User ${userId} unregistered.`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
