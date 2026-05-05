const Template = require('../models/Template');

const deriveWrapTypeFromCategory = (category = '') => {
    const c = String(category || '').toLowerCase();
    if (c.includes('mug')) return 'mug';
    if (c.includes('sipper') || c.includes('bottle')) return 'bottle';
    if (c.includes('planter')) return 'planter';
    if (c.includes('cover') || c.includes('case')) return 'phone';
    return 'none';
};

const isWrapFamilyCategory = (category = '', wrapType = 'none') => {
    const c = String(category || '').toLowerCase();
    return (
        wrapType === 'mug' ||
        wrapType === 'bottle' ||
        wrapType === 'planter' ||
        c.includes('mug') ||
        c.includes('sipper') ||
        c.includes('bottle') ||
        c.includes('planter')
    );
};

const hasInvalidWrapShapes = (mockupViews = []) =>
    (mockupViews || []).some((mv) => (mv?.shapeType || 'mug-wrap') !== 'mug-wrap');

// @desc    Create a new product template
// @route   POST /api/templates
// @access  Private/Admin
const createTemplate = async (req, res) => {
    try {
        const {
            name,
            category,
            canvasSettings,
            previewImage,
            demoImageUrl,
            overlayImageUrl,
            backgroundImageUrl,
            maskImageUrl,
            printArea,
            basePrice,
            brand,
            modelName,
            caseType,
            variantNo,
            productSize,
            printSize,
            moq,
            packingCharges,
            shippingCharges,
            description,
            uses,
            benefits,
            galleryImages,
            gst,
            wrapType,
            mockupViews
        } = req.body;

        const normalizedWrapType = (wrapType && wrapType !== 'none')
            ? wrapType
            : deriveWrapTypeFromCategory(category);
        if (isWrapFamilyCategory(category, normalizedWrapType) && !printSize) {
            return res.status(400).json({ message: 'Print size is required for Mug / Sipper-Bottle / Planter templates.' });
        }
        if (isWrapFamilyCategory(category, normalizedWrapType) && hasInvalidWrapShapes(mockupViews)) {
            return res.status(400).json({ message: 'Only mug-wrap shape is allowed for Mug / Sipper-Bottle / Planter templates.' });
        }

        const template = await Template.create({
            name,
            category,
            canvasSettings,
            previewImage,
            demoImageUrl,
            overlayImageUrl,
            backgroundImageUrl,
            maskImageUrl,
            printArea,
            basePrice,
            brand,
            modelName,
            caseType,
            variantNo,
            productSize,
            printSize,
            moq,
            packingCharges: packingCharges || 0,
            shippingCharges: shippingCharges || 0,
            description: description || '',
            uses: uses || [],
            benefits: benefits || [],
            galleryImages: galleryImages || [],
            gst: gst || 0,
            wrapType: normalizedWrapType,
            mockupViews: mockupViews || [],
            createdBy: req.user?._id
        });

        res.status(201).json(template);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get all templates
// @route   GET /api/templates
// @access  Public
const getTemplates = async (req, res) => {
    try {
        const query = { isActive: true };

        // Add filters if provided in query params
        if (req.query.category) query.category = req.query.category;
        if (req.query.brand) query.brand = req.query.brand;
        if (req.query.modelName) query.modelName = req.query.modelName;
        if (req.query.caseType) query.caseType = req.query.caseType;

        const templates = await Template.find(query);
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Public
const getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (template) {
            res.json(template);
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private/Admin
const updateTemplate = async (req, res) => {
    try {
        const {
            name,
            category,
            canvasSettings,
            previewImage,
            demoImageUrl,
            overlayImageUrl,
            backgroundImageUrl,
            maskImageUrl,
            printArea,
            basePrice,
            brand,
            modelName,
            caseType,
            variantNo,
            productSize,
            printSize,
            moq,
            packingCharges,
            shippingCharges,
            description,
            uses,
            benefits,
            galleryImages,
            gst,
            wrapType,
            mockupViews
        } = req.body;

        const normalizedWrapType = (wrapType && wrapType !== 'none')
            ? wrapType
            : deriveWrapTypeFromCategory(category);
        if (isWrapFamilyCategory(category, normalizedWrapType) && !printSize) {
            return res.status(400).json({ message: 'Print size is required for Mug / Sipper-Bottle / Planter templates.' });
        }
        if (isWrapFamilyCategory(category, normalizedWrapType) && hasInvalidWrapShapes(mockupViews)) {
            return res.status(400).json({ message: 'Only mug-wrap shape is allowed for Mug / Sipper-Bottle / Planter templates.' });
        }

        const updatedTemplate = await Template.findByIdAndUpdate(
            req.params.id,
            {
                name,
                category,
                canvasSettings,
                previewImage,
                demoImageUrl,
                overlayImageUrl,
                backgroundImageUrl,
                maskImageUrl,
                printArea,
                basePrice,
                brand,
                modelName,
                caseType,
                variantNo,
                productSize,
                printSize,
                moq,
                packingCharges,
                shippingCharges,
                description,
                uses,
                benefits,
                galleryImages,
                gst,
                wrapType: normalizedWrapType,
                mockupViews
            },
            { new: true, runValidators: true }
        );

        if (updatedTemplate) {
            res.json(updatedTemplate);
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private/Admin
const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (template) {
            await template.deleteOne();
            res.json({ message: 'Template removed' });
        } else {
            res.status(404).json({ message: 'Template not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get unique brands
// @route   GET /api/templates/brands
// @access  Public
const getUniqueBrands = async (req, res) => {
    try {
        const brands = await Template.distinct('brand', { isActive: true, category: 'Mobile Cover', brand: { $ne: null } });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get models for a specific brand
// @route   GET /api/templates/models/:brand
// @access  Public
const getModelsForBrand = async (req, res) => {
    try {
        const models = await Template.distinct('modelName', {
            isActive: true,
            category: 'Mobile Cover',
            brand: req.params.brand
        });
        res.json(models);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getUniqueBrands,
    getModelsForBrand
};
