const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: { type: String, default: 'Mimitiinaa' },
    logoUrl: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    addressLine: { type: String, default: '2/41, 1st Floor, Ansari Road, Darya Ganj, New Delhi - 110002' },
    phone: { type: String, default: '7838873878' },
    email: { type: String, default: 'mimitiinaa.sales@gmail.com' },
    gstin: { type: String, default: '07AHEPP8198B1Z3' },
    bankDetails: {
        accountName: { type: String, default: 'Mimitiinaa' },
        bankName: { type: String, default: 'Union Bank of India' },
        accountNo: { type: String, default: '380901010036873' },
        ifscCode: { type: String, default: 'UBIN0538094' }
    },
    qrCodeUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
