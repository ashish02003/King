import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaTrash, FaShoppingBag, FaPlus, FaMinus, FaTag,
    FaTruck, FaShieldAlt, FaPencilAlt, FaArrowLeft, FaBox
} from 'react-icons/fa';
import { Layout, Row, Col, Card, Button, Typography, Empty, Modal, Tag as AntTag, Space, Divider } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

const Cart = () => {
    const { cartItems, selectedItemIds, toggleSelection, getSelectedItems, removeFromCart, updateQuantity, loading } = useCart();
    const navigate = useNavigate();
    const [removeModal, setRemoveModal] = useState({ isOpen: false, itemId: null, itemName: '' });

    const selectedItems = getSelectedItems();

    // Subtotal of SELECTED items
    const subtotal = selectedItems.reduce((acc, item) => acc + ((item.price * (1 + (item.gst || 0) / 100)) * (item.quantity || 1)), 0);
    const packingChargesTotal = selectedItems.reduce((acc, item) => acc + ((item.packingCharges || 0) * (item.quantity || 1)), 0);
    const shippingChargesTotal = selectedItems.reduce((acc, item) => acc + (item.shippingCharges || 0), 0);
    const totalPrice = Math.round(subtotal + packingChargesTotal + shippingChargesTotal);
    const totalItems = selectedItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    const handleRemoveClick = (item) => {
        setRemoveModal({
            isOpen: true,
            itemId: item._id,
            itemName: item.template?.name || 'Custom Product'
        });
    };

    const handleConfirmRemove = () => {
        removeFromCart(removeModal.itemId);
        setRemoveModal({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleCancelRemove = () => {
        setRemoveModal({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleQtyChange = (item, delta) => {
        const newQty = (item.quantity || 1) + delta;
        if (newQty >= 1) {
            updateQuantity(item._id, newQty);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Content style={{ padding: '40px 16px' }}>
                <div className="container mx-auto max-w-6xl">
                    <Space align="center" size="large" style={{ marginBottom: 32 }}>
                        <Button
                            type="default"
                            shape="circle"
                            icon={<FaArrowLeft />}
                            onClick={() => navigate(-1)}
                            className="shadow-sm border-gray-200"
                        />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight m-0">Shopping Cart</h1>
                            <Text type="secondary" className="font-medium">
                                {selectedItems.length} of {cartItems.length} items selected for checkout
                            </Text>
                        </div>
                    </Space>

                    <Modal
                        open={removeModal.isOpen}
                        title="Remove item?"
                        onOk={handleConfirmRemove}
                        onCancel={handleCancelRemove}
                        okText="Yes, remove"
                        cancelText="Keep item"
                        okButtonProps={{ danger: true, className: "rounded-lg" }}
                        cancelButtonProps={{ className: "rounded-lg" }}
                    >
                        <Text>
                            Are you sure you want to remove{' '}
                            <Text strong>"{removeModal.itemName}"</Text> from your cart?
                        </Text>
                    </Modal>

                    {cartItems.length === 0 ? (
                        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                            <Empty
                                image={<FaShoppingBag size={60} className="text-blue-100 mx-auto mb-4" />}
                                description={
                                    <Space direction="vertical">
                                        <Text strong className="text-xl">Your cart is empty</Text>
                                        <Text type="secondary">Start customizing products to add them here</Text>
                                    </Space>
                                }
                            >
                                <Link to="/">
                                    <Button type="primary" size="large" className="bg-indigo-600 border-indigo-600 rounded-xl h-12 px-8 font-bold">
                                        Browse Products
                                    </Button>
                                </Link>
                            </Empty>
                        </Card>
                    ) : (
                        <Row gutter={24} align="stretch">
                            <Col xs={24} lg={16}>
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    {cartItems.map((item) => {
                                        const isSelected = selectedItemIds.includes(item._id);
                                        return (
                                            <Card
                                                key={item._id}
                                                className={`rounded-3xl border-gray-100 shadow-sm transition-all duration-300 ${isSelected ? 'ring-2 ring-indigo-500/20 bg-white' : 'opacity-70 grayscale-[0.5] bg-gray-50'}`}
                                                bodyStyle={{ padding: '24px' }}
                                            >
                                                <div className="flex gap-4 sm:gap-6 items-start">
                                                    {/* Checkbox */}
                                                    <div className="pt-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelection(item._id)}
                                                            className="w-6 h-6 rounded-lg accent-indigo-600 cursor-pointer"
                                                        />
                                                    </div>

                                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        {(item.finalImageUrl || item.finalDesignUrl) ? (
                                                            <img
                                                                src={item.finalImageUrl || item.finalDesignUrl}
                                                                alt={item.template?.name || 'Custom Design'}
                                                                className="w-full h-full object-contain p-2"
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center text-gray-400">
                                                                <FaShoppingBag size={32} />
                                                                <span className="text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-400">No Preview</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                                            <div className="min-w-0">
                                                                <h3 className="font-black text-lg text-gray-800 truncate mb-1">
                                                                    {item.template?.name || 'Custom Product'}
                                                                </h3>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                                                                        <FaTag size={8} /> Custom Design
                                                                    </span>
                                                                    {isSelected && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">
                                                                            Selected
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-xl font-black text-gray-900 mb-0">
                                                                    ₹{Math.round((item.price * (1 + (item.gst || 0) / 100)) * (item.quantity || 1)).toLocaleString()}
                                                                </p>
                                                                <div className="flex flex-col sm:items-end gap-0.5 mt-1">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                        Unit: ₹{Math.round(item.price * (1 + (item.gst || 0) / 100))} (Incl. GST)
                                                                    </p>
                                                                    {(item.packingCharges > 0 || item.shippingCharges > 0) && (
                                                                        <div className="flex flex-wrap gap-2 sm:justify-end">
                                                                            {item.packingCharges > 0 && (
                                                                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter">
                                                                                    + ₹{item.packingCharges} Packing
                                                                                </span>
                                                                            )}
                                                                            {item.shippingCharges > 0 && (
                                                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                                                                                    + ₹{item.shippingCharges} Shipping
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Divider style={{ margin: '12px 0' }} />

                                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                                            <div className={`flex items-center rounded-xl p-1 gap-1 transition-all ${isSelected ? 'bg-gray-100' : 'bg-gray-50 opacity-50 cursor-not-allowed'}`}>
                                                                <button
                                                                    onClick={() => handleQtyChange(item, -1)}
                                                                    disabled={!isSelected || (item.quantity || 1) <= 1}
                                                                    title={!isSelected ? "Select item to change quantity" : ""}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 disabled:opacity-30 transition-all font-black text-lg"
                                                                >
                                                                    <FaMinus size={12} />
                                                                </button>
                                                                <span className="w-10 text-center font-black text-gray-800 text-sm">
                                                                    {item.quantity || 1}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleQtyChange(item, 1)}
                                                                    disabled={!isSelected}
                                                                    title={!isSelected ? "Select item to change quantity" : ""}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 disabled:opacity-30 transition-all font-black text-lg"
                                                                >
                                                                    <FaPlus size={12} />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    disabled={!isSelected}
                                                                    onClick={() => navigate(`/customize/${item.template?._id || item.template}`)}
                                                                    title={!isSelected ? "Select item to edit" : ""}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider
                                                                        ${isSelected
                                                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
                                                                >
                                                                    <FaPencilAlt size={10} /> Edit
                                                                </button>
                                                                <button
                                                                    disabled={!isSelected}
                                                                    onClick={() => handleRemoveClick(item)}
                                                                    title={!isSelected ? "Select item to remove" : ""}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider
                                                                        ${isSelected
                                                                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                                                            : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
                                                                >
                                                                    <FaTrash size={10} /> Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </Space>
                            </Col>

                            <Col xs={24} lg={8}>
                                <Card
                                    className="rounded-3xl border-gray-100 shadow-xl overflow-hidden sticky top-24"
                                    title={<span className="font-black text-gray-800 uppercase tracking-widest text-xs">Order Summary</span>}
                                >
                                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                    <FaShoppingBag size={14} className="text-gray-400" />
                                                    Product Cost ({totalItems} items)
                                                </div>
                                                <Text strong className="text-gray-800">₹{Math.round(subtotal).toLocaleString()}</Text>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                    <FaBox size={14} className="text-gray-400" />
                                                    Packing Charges
                                                </div>
                                                <Text strong className={packingChargesTotal > 0 ? 'text-gray-800' : 'text-gray-300'}>
                                                    ₹{packingChargesTotal.toLocaleString()}
                                                </Text>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                                    <FaTruck size={14} className="text-gray-400" />
                                                    Shipping Fee
                                                </div>
                                                {shippingChargesTotal === 0
                                                    ? <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">FREE</span>
                                                    : <Text strong className="text-gray-800">₹{shippingChargesTotal.toLocaleString()}</Text>
                                                }
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100">
                                            <div className="flex justify-between items-end mb-6">
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</p>
                                                    <Title level={2} style={{ marginBottom: 0, color: '#2D5A27', fontWeight: 900 }}>
                                                        ₹{Math.round(totalPrice).toLocaleString()}
                                                    </Title>
                                                </div>
                                                <span className="text-[11px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">Best Price ✅</span>
                                            </div>

                                            <button
                                                disabled={selectedItems.length === 0}
                                                onClick={() => navigate('/checkout')}
                                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2
                                                    ${selectedItems.length === 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                        : 'bg-[#2D5A27] text-white hover:bg-[#23471e] hover:-translate-y-1 hover:shadow-green-900/10 active:scale-95'
                                                    }`}
                                            >
                                                Proceed to Checkout <span className="text-lg">→</span>
                                            </button>

                                            <Link to="/" className="block mt-4 text-center">
                                                <Text type="secondary" className="hover:text-indigo-600 text-xs font-black uppercase tracking-widest cursor-pointer transition-all">
                                                    ← Continue Shopping
                                                </Text>
                                            </Link>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                                            <FaShieldAlt className="text-indigo-500 mt-1" />
                                            <div>
                                                <Text strong className="text-[11px] uppercase tracking-widest text-gray-700">100% SECURE CHECKOUT</Text>
                                                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                                                    We use industry-standard encryption. Your payment details are never stored on our servers.
                                                </p>
                                            </div>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </div>
            </Content>
        </Layout>
    );
};

export default Cart;
