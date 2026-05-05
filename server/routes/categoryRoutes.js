const express = require('express');
const router = express.Router();
const { createCategory, getCategories, deleteCategory, updateCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure Multer for memory storage (we'll upload to Cloudinary in controller)
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
    .get(getCategories)
    .post(protect, admin, upload.single('image'), createCategory);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateCategory)
    .delete(protect, admin, deleteCategory);

module.exports = router;

