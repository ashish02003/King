const Order = require('../models/Order');
const Cart = require('../models/Cart');
const axios = require('axios');
const { getNimbusToken } = require('./shippingController');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create new order (called after payment verification)
// @route   POST /api/orders
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            subtotal,
            gstTotal,
            packingChargesTotal,
            shippingChargesTotal,
            totalPrice,
            paymentMethod,   // 'razorpay' | 'cod'
            paymentResult,   // { razorpay_order_id, razorpay_payment_id, razorpay_signature, status }
            isBuyNow
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const isCOD = paymentMethod === 'cod';

        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            subtotal,
            gstTotal: gstTotal || 0,
            packingChargesTotal: packingChargesTotal || 0,
            shippingChargesTotal: shippingChargesTotal || 0,
            totalPrice,
            paymentMethod: isCOD ? 'cod' : 'razorpay',
            paymentResult: isCOD ? undefined : paymentResult,
            isPaid: !isCOD,
            paidAt: isCOD ? undefined : Date.now(),
            paymentStatus: isCOD ? 'To be paid on delivery' : 'Paid',
            orderStatus: 'Pending'
        });

        const created = await order.save();

        // Clear the user's cart after order is placed ONLY if not a buy now checkout
        if (!isBuyNow) {
            try {
                await Cart.findOneAndUpdate(
                    { user: req.user._id },
                    { $set: { items: [] } }
                );
            } catch (cartErr) {
                console.warn('Could not clear cart after order:', cartErr.message);
            }
        }

        res.status(201).json(created);
    } catch (error) {
        console.error('createOrder error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('orderItems.template', 'name basePrice previewImage')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('orderItems.template', 'name basePrice previewImage');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Only allow owner or admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email phone')
            .populate('orderItems.template', 'name basePrice')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus, paymentStatus, deliveryStatus } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (orderStatus) order.orderStatus = orderStatus;
        if (deliveryStatus) order.deliveryStatus = deliveryStatus;
        
        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
            if (paymentStatus === 'Paid' && !order.isPaid) {
                order.isPaid = true;
                order.paidAt = Date.now();
            }
        }
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Ship order → Create shipment on NimbusPost & set Status → Shipped
// @route   PUT /api/orders/:id/ship
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const shipOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('orderItems.template', 'name basePrice');

        if (!order) return res.status(404).json({ message: 'Order not found' });
        // Allow packing for both paid (Razorpay) and COD orders
        // COD orders are fulfillment-first, payment happens on delivery

        // Get dynamic token (since NIMBUSPOST_TOKEN is not in .env)
        const token = await getNimbusToken();
        const addr = order.shippingAddress;

        // Build product name string
        const productName = order.orderItems
            .map(i => i.template?.name || 'Custom Product')
            .join(', ');

        const totalQty = order.orderItems.reduce((s, i) => s + (i.quantity || 1), 0);
        const weight = (totalQty * 0.5).toFixed(2);

        // Build order_items array for NimbusPost
        const orderItems = order.orderItems.map(item => ({
            name: item.template?.name || 'Custom Product',
            qty: item.quantity || 1,
            price: item.price,
            sku: item.template?._id.toString() || 'SKU-001'
        }));

        const nimbusPayload = {
            order_number: order._id.toString(),
            consignee_name: addr.fullName,
            consignee_address: addr.addressLine1,
            consignee_city: addr.city,
            consignee_state: addr.state,
            consignee_pincode: addr.pincode,
            consignee_phone: addr.phone,
            payment_type: order.paymentMethod === 'cod' ? 'cod' : 'prepaid',
            order_amount: order.totalPrice,
            cod_amount: order.paymentMethod === 'cod' ? order.totalPrice : 0,
            weight: parseFloat(weight),
            length: 15,
            breadth: 12,
            height: 10,
            pickup_warehouse_name: process.env.NIMBUSPOST_SELLER_NAME,
            pickup_contact_name: process.env.NIMBUSPOST_SELLER_NAME,
            pickup_address: process.env.NIMBUSPOST_SELLER_ADDRESS,
            pickup_city: process.env.NIMBUSPOST_SELLER_CITY,
            pickup_state: process.env.NIMBUSPOST_SELLER_STATE,
            pickup_pincode: process.env.NIMBUSPOST_SELLER_PINCODE,
            pickup_phone: process.env.NIMBUSPOST_SELLER_PHONE,
            order_items: orderItems
        };

        console.log("FINAL PAYLOAD (JSON - /v1/orders):", JSON.stringify(nimbusPayload, null, 2));
        
        try {
                const nimbusRes = await axios.post(
                    'https://api.nimbuspost.com/v1/orders',
                    nimbusPayload,
                    {
                        headers: {
                            Authorization: token,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const nimbusData = nimbusRes.data;
                console.log('NimbusPost response:', nimbusData);

                order.shippingInfo = {
                    awbCode: nimbusData.data?.awb_code || nimbusData.awb_code || '',
                    courier: nimbusData.data?.courier_name || nimbusData.courier_name || '',
                    nimbusOrderId: nimbusData.data?.order_id || nimbusData.order_id || '',
                    trackingUrl: nimbusData.data?.tracking_url || nimbusData.tracking_url || '',
                    lastStatus: 'Packed',
                    lastUpdated: new Date()
                };
            } catch(nimbusErr) {
                // Don't block status update if NimbusPost fails — log and continue
                console.error('NimbusPost API error:', nimbusErr?.response?.data || nimbusErr.message);
                order.shippingInfo = {
                    awbCode: '',
                    courier: '',
                    lastStatus: 'Shipped (NimbusPost pending)',
                    lastUpdated: new Date()
                };
            }

        order.orderStatus = 'Shipped';
        order.deliveryStatus = 'Pending';
            await order.save();

            res.json({
                message: 'Order shipped successfully',
                order,
                awbCode: order.shippingInfo?.awbCode || null
            });
        } catch (error) {
            console.error('shipOrder error:', error);
            res.status(500).json({ message: error.message });
        }
    };

    module.exports = {
        createOrder,
        getMyOrders,
        getOrderById,
        getAllOrders,
        updateOrderStatus,
        shipOrder
    };
