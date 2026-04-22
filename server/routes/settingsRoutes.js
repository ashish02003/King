const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/authMiddleware');

// Get settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settings
router.put('/', protect, admin, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (settings) {
            Object.assign(settings, req.body);
            const updated = await settings.save();
            res.json(updated);
        } else {
            const created = await Settings.create(req.body);
            res.json(created);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
