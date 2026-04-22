const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    template: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Template'
    },
    customizedJson: {
        type: Object,
        required: true
    },
    finalImageUrl: {
        type: String,
        required: true
    },
    slotAssets: {
        type: Object
    },
    userUploadedImages: [String],
    price: {           // base product price per unit
        type: Number,
        required: true
    },
    packingCharges: {  // per-unit packing charge from template
        type: Number,
        default: 0
    },
    shippingCharges: { // flat shipping charge from template
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [orderItemSchema],

    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
    },

    // ─── Price Breakdown ───────────────────────────────────────
    subtotal: { type: Number, required: true }, // sum of (price × qty)
    packingChargesTotal: { type: Number, default: 0 },
    shippingChargesTotal: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true }, // subtotal + packing + shipping

    // ─── Payment ───────────────────────────────────────────────
    paymentMethod: {
        type: String,
        default: 'razorpay'
    },
    paymentResult: {
        razorpay_order_id: { type: String },
        razorpay_payment_id: { type: String },
        razorpay_signature: { type: String },
        status: { type: String }
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // ─── Order Status ──────────────────────────────────────────
    orderStatus: {
        type: String,
        enum: [
            'Order Confirmed',
            'Packed',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled'
        ],
        default: 'Order Confirmed'
    },

    // ─── NimbusPost / Shipping Info ────────────────────────────
    shippingInfo: {
        awbCode: { type: String, default: '' }, // Tracking ID
        courier: { type: String, default: '' }, // Courier name
        nimbusOrderId: { type: String, default: '' },
        trackingUrl: { type: String, default: '' },
        lastStatus: { type: String, default: '' },
        lastUpdated: { type: Date }
    }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
