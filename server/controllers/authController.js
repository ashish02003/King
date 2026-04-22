const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Helper: build user response object
const userResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    shippingAddress: user.shippingAddress || {},
    token: generateToken(user._id)
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user'
        });

        if (user) {
            res.status(201).json(userResponse(user));
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            user.lastActive = Date.now();
            await user.save();
            res.json(userResponse(user));
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (admin)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change current user's password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update current user's profile (name/email)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    const { name, email, shippingAddress } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        
        if (shippingAddress) {
            user.shippingAddress = {
                ...user.shippingAddress,
                ...shippingAddress
            };
        }

        await user.save();

        res.json(userResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload/Update user avatar
// @route   PUT /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // If user already has an avatar, delete the old one from Cloudinary
        if (user.avatar) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = user.avatar.split('/');
                const fileWithExt = urlParts[urlParts.length - 1];
                const folder = urlParts[urlParts.length - 2];
                const publicId = folder + '/' + fileWithExt.split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error('Error deleting old avatar from Cloudinary:', err.message);
            }
        }

        user.avatar = req.file.path;
        await user.save();

        res.json(userResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user avatar
// @route   DELETE /api/auth/avatar
// @access  Private
const deleteAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.avatar) {
            try {
                const urlParts = user.avatar.split('/');
                const fileWithExt = urlParts[urlParts.length - 1];
                const folder = urlParts[urlParts.length - 2];
                const publicId = folder + '/' + fileWithExt.split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error('Error deleting avatar from Cloudinary:', err.message);
            }
        }

        user.avatar = '';
        await user.save();

        res.json(userResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getUsers, changePassword, updateProfile, uploadAvatar, deleteAvatar };
