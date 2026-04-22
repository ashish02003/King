// const axios = require('axios');
// const Order = require('../models/Order');

// // ─────────────────────────────────────────────────────────────────────────────
// // @desc    NimbusPost Webhook — auto-update delivery status
// // @route   POST /api/shipping/webhook
// // @access  Public (NimbusPost server only — validate token)
// // ─────────────────────────────────────────────────────────────────────────────
// const nimbusWebhook = async (req, res) => {
//     try {
//         // NimbusPost sends a token in headers or body — validate it
//         const incomingToken = req.headers['x-nimbuspost-token'] || req.body?.token;
//         if (incomingToken && incomingToken !== process.env.NIMBUSPOST_TOKEN) {
//             return res.status(401).json({ message: 'Unauthorized' });
//         }

//         const { awb_code, status, remark } = req.body;
//         if (!awb_code) return res.status(400).json({ message: 'AWB code missing' });

//         // Find order by AWB code
//         const order = await Order.findOne({ 'shippingInfo.awbCode': awb_code });
//         if (!order) {
//             return res.status(404).json({ message: `No order found for AWB: ${awb_code}` });
//         }

//         // Map NimbusPost status to our status enum
//         const statusMap = {
//             'PICKUP_PENDING': 'Packed',
//             'PICKUP_DONE': 'Shipped',
//             'IN_TRANSIT': 'Shipped',
//             'OUT_FOR_DELIVERY': 'Out for Delivery',
//             'DELIVERED': 'Delivered',
//             'DELIVERY_FAILED': 'Shipped',
//             'CANCELLED': 'Cancelled',
//             'RETURNED': 'Cancelled',
//         };

//         const mappedStatus = statusMap[status?.toUpperCase()] || order.orderStatus;

//         order.shippingInfo.lastStatus = status || '';
//         order.shippingInfo.lastUpdated = new Date();
//         order.orderStatus = mappedStatus;

//         await order.save();

//         console.log(`Webhook: Order ${order._id} — AWB ${awb_code} → ${mappedStatus}`);
//         res.status(200).json({ message: 'Status updated' });
//     } catch (error) {
//         console.error('nimbusWebhook error:', error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // @desc    Track shipment by AWB code
// // @route   GET /api/shipping/track/:awb
// // @access  Private
// // ─────────────────────────────────────────────────────────────────────────────
// const trackShipment = async (req, res) => {
//     try {
//         const { awb } = req.params;
//         const token = process.env.NIMBUSPOST_TOKEN;

//         const response = await axios.get(
//             `https://api.nimbuspost.com/v1/shipments/track/${awb}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );

//         res.json(response.data);
//     } catch (error) {
//         console.error('trackShipment error:', error?.response?.data || error.message);
//         res.status(500).json({ message: 'Tracking failed', error: error?.response?.data || error.message });
//     }
// };

// module.exports = { nimbusWebhook, trackShipment };


const axios = require('axios');
const Order = require('../models/Order');

// ─────────────────────────────────────────────────────────
//  Nimbus Token (with caching)
// ─────────────────────────────────────────────────────────
let cachedToken = null;
let tokenExpiry = null;

const getNimbusToken = async () => {
    try {
        // Agar token valid hai to reuse karo
        if (cachedToken && tokenExpiry > Date.now()) {
            return cachedToken;
        }

        const res = await axios.post(
            "https://api.nimbuspost.com/v1/users/login",
            {
                email: process.env.NIMBUS_EMAIL,
                password: process.env.NIMBUS_PASSWORD,
            }
        );

        cachedToken = res.data.data; // token
        tokenExpiry = Date.now() + (50 * 60 * 1000); // ~50 min cache

        console.log("✅ Nimbus token refreshed");

        return cachedToken;
    } catch (error) {
        console.error("❌ Nimbus Token Error:", error?.response?.data || error.message);
        throw new Error("Failed to get Nimbus token");
    }
};

// ─────────────────────────────────────────────────────────
// 🚚 Track Shipment
// ─────────────────────────────────────────────────────────
const trackShipment = async (req, res) => {
    try {
        const { awb } = req.params;

        const token = await getNimbusToken();

        const response = await axios.get(
            `https://api.nimbuspost.com/v1/shipments/track/${awb}`,
            {
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('❌ trackShipment error:', error?.response?.data || error.message);
        res.status(500).json({
            message: 'Tracking failed',
            error: error?.response?.data || error.message
        });
    }
};

// ─────────────────────────────────────────────────────────
// 📦 Nimbus Webhook (Auto Status Update)
// ─────────────────────────────────────────────────────────
const nimbusWebhook = async (req, res) => {
    try {
        // 🔐 Webhook security check
        const incomingToken =
            req.headers['x-nimbuspost-token'] || req.body?.token;

        if (
            process.env.NIMBUS_WEBHOOK_TOKEN &&
            incomingToken !== process.env.NIMBUS_WEBHOOK_TOKEN
        ) {
            return res.status(401).json({ message: 'Unauthorized webhook' });
        }

        const { awb_code, status, remark } = req.body;

        if (!awb_code) {
            return res.status(400).json({ message: 'AWB code missing' });
        }

        // 🔍 Find order
        const order = await Order.findOne({
            'shippingInfo.awbCode': awb_code,
        });

        if (!order) {
            return res
                .status(404)
                .json({ message: `No order found for AWB: ${awb_code}` });
        }

        // 🔄 Status Mapping
        const statusMap = {
            PICKUP_PENDING: 'Packed',
            PICKUP_DONE: 'Shipped',
            IN_TRANSIT: 'Shipped',
            OUT_FOR_DELIVERY: 'Out for Delivery',
            DELIVERED: 'Delivered',
            DELIVERY_FAILED: 'Shipped',
            CANCELLED: 'Cancelled',
            RETURNED: 'Cancelled',
        };

        const mappedStatus =
            statusMap[status?.toUpperCase()] || order.orderStatus;

        // 📝 Update order
        order.shippingInfo.lastStatus = status || '';
        order.shippingInfo.lastRemark = remark || '';
        order.shippingInfo.lastUpdated = new Date();

        order.orderStatus = mappedStatus;

        // COD payment auto update (optional)
        if (mappedStatus === 'Delivered' && order.paymentMethod === 'COD') {
            order.paymentStatus = 'Paid';
        }

        await order.save();

        console.log(
            `📦 Webhook: Order ${order._id} → ${mappedStatus} (${awb_code})`
        );

        res.status(200).json({ message: 'Status updated' });
    } catch (error) {
        console.error('❌ nimbusWebhook error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNimbusToken,
    trackShipment,
    nimbusWebhook,
};