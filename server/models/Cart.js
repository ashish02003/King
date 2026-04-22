// const mongoose = require('mongoose');

// const cartSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: 'User'
//     },
//     template: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: 'Template'
//     },
//     customizedJson: {
//         type: Object,
//         required: true
//     },
//     finalImageUrl: {
//         type: String,
//         required: true
//     },
//     price: {
//         type: Number,
//         required: true
//     },
//     qty: {
//         type: Number,
//         required: true,
//         default: 1
//     }
// }, { timestamps: true });

// module.exports = mongoose.model('Cart', cartSchema);


const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    customizations: [{
        shapeId: String,
        shapeType: String,
        uploadedImageUrl: String,
        clippedImageUrl: String,
        cloudinaryPublicId: String,
        position: {
            x: Number,
            y: Number
        },
        size: {
            width: Number,
            height: Number
        }
    }],
    finalDesignUrl: String,
    canvasJSON: Object,
    slotAssets: Object,
    userUploadedImages: [String],
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    packingCharges: {
        type: Number,
        default: 0
    },
    shippingCharges: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Calculate total price before saving
cartSchema.pre('save', async function () {
    if (this.items && Array.isArray(this.items)) {
        this.totalPrice = this.items.reduce((total, item) => {
            return total + (item.price * (item.quantity || 1));
        }, 0);
    } else {
        this.totalPrice = 0;
    }
});

module.exports = mongoose.model('Cart', cartSchema);