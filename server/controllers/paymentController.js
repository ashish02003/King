const Razorpay = require('razorpay');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Razorpay Order (generates order_id for frontend modal)
// @route   POST /api/payment/create-order
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createRazorpayOrder = async (req, res) => {
    try {
        // Lazy init — instantiated per-request so missing keys don't crash server on boot
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const { amount } = req.body; // amount in Rupees

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay needs paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                userEmail: req.user.email
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay create order error:', error);
        let message = 'Payment initiation failed';
        if (error.statusCode === 401) {
            message = 'Invalid Razorpay API Keys. Please check your .env file.';
        }
        res.status(500).json({
            message,
            error: error.message,
            tip: 'Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct in .env'
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payment/verify
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification fields' });
        }

        // HMAC signature verification — critical security step
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSign === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            paymentResult: {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                status: 'paid'
            }
        });
    } catch (error) {
        console.error('verifyPayment error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createRazorpayOrder, verifyPayment };
