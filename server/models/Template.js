// const mongoose = require('mongoose');

// const templateSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     category: {
//         type: String, // e.g., 'Mobile Cover', 'Mug', 'T-Shirt'
//         required: true
//     },
//     canvasSettings: {
//         type: Object, // Stores Fabric.js JSON object for base template
//         required: true
//     },
//     previewImage: {
//         type: String, // URL from Cloudinary
//         required: true
//     },
//     overlayImageUrl: {
//         type: String // The frame/design with transparency (optional)
//     },
//     backgroundImageUrl: {
//         type: String // Optional: Flat design for Mugs/T-Shirts
//     },
//     maskImageUrl: {
//         type: String // Optional mask for complex shapes
//     },
//     printArea: {
//         x: Number,
//         y: Number,
//         width: Number,
//         height: Number,
//         angle: Number
//     },
//     basePrice: {
//         type: Number,
//         required: true,
//         default: 0
//     },
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     // 🔥 NEW: Mobile Case Specific Fields
//     brand: {
//         type: String // e.g., 'Apple', 'Samsung', 'OnePlus'
//     },
//     modelName: {
//         type: String // e.g., 'iPhone 15', 'Galaxy S23'
//     },
//     caseType: {
//         type: String,
//         enum: ['Soft', 'Glass', 'Metal', 'None'],
//         default: 'None'
//     }
// }, { timestamps: true });

// module.exports = mongoose.model('Template', templateSchema);


const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String, // e.g., 'Mobile Cover', 'Mug', 'T-Shirt'
        required: true
    },
    canvasSettings: {
        type: Object, // Stores Fabric.js JSON object for base template
        required: true
    },

    // 🔥 NEW: Photo upload zones with shape clipping info
    photoZones: [{
        id: {
            type: String,
            required: true
        },
        shapeType: {
            type: String,
            enum: ['star', 'heart', 'circle', 'rectangle', 'ellipse', 'polygon', 'custom'],
            required: true
        },
        position: {
            x: { type: Number, required: true },
            y: { type: Number, required: true }
        },
        size: {
            width: { type: Number, required: true },
            height: { type: Number, required: true }
        },
        angle: {
            type: Number,
            default: 0
        },
        customPath: {
            type: String // For custom shapes - SVG path or polygon points
        },
        starPoints: {
            type: Number,
            default: 5
        },
        polygonSides: {
            type: Number,
            default: 6
        }
    }],

    previewImage: {
        type: String, // URL from Cloudinary
        required: true
    },
    // Demo/sample image: product with sample photo in frame (shown on home so users see how their photo will look)
    demoImageUrl: {
        type: String
    },
    overlayImageUrl: {
        type: String // The frame/design with transparency (optional)
    },
    backgroundImageUrl: {
        type: String // Optional: Flat design for Mugs/T-Shirts/Mobile Cases
    },
    maskImageUrl: {
        type: String // Optional mask for complex shapes
    },
    printArea: {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        angle: Number
    },
    // 🔥 NEW: Array of extra gallery image URLs
    galleryImages: [{
        type: String
    }],
    basePrice: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Mobile Case Specific Fields
    brand: {
        type: String // e.g., 'Apple', 'Samsung', 'OnePlus'
    },
    modelName: {
        type: String // e.g., 'iPhone 15', 'Galaxy S23'
    },
    caseType: {
        type: String,
        enum: ['Soft', 'Glass', 'Metal', 'None'],
        default: 'None'
    },

    // 🔥 NEW: Variant and Specification Fields
    variantNo: {
        type: String
    },
    productSize: {
        type: String
    },
    printSize: {
        type: String
    },
    moq: {
        type: Number,
        default: 1
    },
    // 🔥 NEW: Wrap type for cylindrical product preview (mug, bottle, etc.)
    wrapType: {
        type: String,
        enum: ['none', 'mug', 'bottle', 'planter', 'phone'],
        default: 'none'
    },

    // ─── Pricing Charges (set by Admin) ─────────────────────────────────────────
    packingCharges: {
        type: Number,
        default: 0   // Extra packing cost per unit
    },
    shippingCharges: {
        type: Number,
        default: 0   // Flat shipping cost per order
    },

    // ─── Product Info for User-facing display ───────────────────────────────────
    description: {
        type: String,
        default: ''  // Full product description
    },
    uses: {
        type: [String],
        default: []  // e.g. ['Corporate gifting', 'Personal use']
    },
    benefits: {
        type: [String],
        default: []  // e.g. ['BPA Free', 'Dishwasher safe']
    },
    gst: {
        type: Number,
        default: 0   // GST percentage
    },
    // 🔥 NEW: High-Quality Mockup Previews
    mockupViews: [{
        viewName: { type: String, default: 'Default View' }, // e.g., 'Front', 'Left', 'Right', 'Perspective'
        backgroundUrl: { type: String, required: true },     // The photographic mockup image
        overlayUrl: { type: String },                        // Optional highlights/shadows layer
        side: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'center'
        },
        shapeType: {
            type: String,
            enum: ['rectangle', 'rounded', 'circle', 'heart', 'mug-wrap'],
            default: 'rectangle'
        },
        // Coordinates on the mockup background where the design should be placed
        placement: {
            x: { type: Number, required: true },
            y: { type: Number, required: true },
            width: { type: Number, required: true },
            height: { type: Number, required: true },
            angle: { type: Number, default: 0 },
            curve: { type: Number, default: 0 }             // Simple bend/warp factor
        },
        // Optional transform for fitting side mockup background image
        bgTransform: {
            zoom: { type: Number, default: 1 },
            offsetX: { type: Number, default: 0 }, // percentage-ish offset (-1..1 recommended)
            offsetY: { type: Number, default: 0 }
        },
        customPath: { type: String } // For custom shapes - SVG path or polygon points
    }]
}, { timestamps: true });


module.exports = mongoose.model('Template', templateSchema);