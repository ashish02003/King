const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Cloudinary Storage Configuration ─────────────────────────
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product-customization',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        resource_type: 'auto'
    },
});

const upload = multer({ storage: storage });

// ── POST /api/upload ─────────────────────────────────────────
// Supports both FormData (multipart) and Base64 (JSON)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        // 1. Check if file was uploaded via Multer (FormData)
        if (req.file) {
            return res.json({
                url: req.file.path,
                public_id: req.file.filename
            });
        }

        // 2. Fallback: Check for Base64 in JSON body
        const { image } = req.body || {};
        if (!image) {
            return res.status(400).json({ 
                message: 'No image provided. Use FormData field "image" or JSON field "image" with Base64.' 
            });
        }

        // Upload Base64 to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: 'product-customization',
            resource_type: 'auto'
        });

        res.json({
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id
        });
    } catch (err) {
        console.error('Upload route error:', err);
        res.status(500).json({
            message: 'Failed to upload image',
            error: err.message
        });
    }
});

module.exports = router;
