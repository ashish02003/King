require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

// Environment Variable Check
if (!process.env.MONGO_URI) {
    console.error('CRITICAL ERROR: MONGO_URI is not defined in .env or Vercel Settings!');
}

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
// const domain = 'https://ashishproject.vercel.app';

// Middleware
// app.use(cors({
//     origin: [domain, 'http://localhost:5173', 'http://localhost:3000','http://localhost:5174'],
//     credentials: true
// }));

const allowedOrigins = [
    'https://ashishproject.vercel.app',
    'https://admin-mimittinaa.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Database Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

// Connect to DB immediately
connectDB();

// Better mongoose event logging to help debug connection issues
mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/customization', require('./routes/customizationRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));    // ✅ Razorpay
app.use('/api/shipping', require('./routes/shippingRoutes'));   // ✅ NimbusPost webhook + tracking
app.use('/api/settings', require('./routes/settingsRoutes'));


// Serve frontend static files if present
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback:
// - `/admin/*` should load the standalone admin React app.
// - everything else should load the main client React app.
// This ensures deep links like `/admin/login` don't return the client `index.html`.
const clientIndexPath = path.join(publicPath, 'index.html');
const adminIndexPath = path.join(publicPath, 'admin', 'index.html');
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    if (req.path === '/admin' || req.path.startsWith('/admin/')) {
        return res.sendFile(adminIndexPath, (err) => {
            // If admin build isn't present yet, gracefully fall back to client.
            if (err) return res.sendFile(clientIndexPath);
        });
    }

    return res.sendFile(clientIndexPath);
});

// For local development
// if (process.env.NODE_ENV !== 'production') {
//     app.listen(PORT, () => {
//         console.log(`Server running on port ${PORT}`);
//     });
// }

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Export for Vercel
module.exports = app;




