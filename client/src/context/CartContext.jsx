import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { API_BASE } from '../utils/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [selectedItemIds, setSelectedItemIds] = useState([]); // ✅ NEW: Track selected items for checkout
    const [buyNowItem, setBuyNowItem] = useState(null); // ✅ NEW: Single item for direct checkout
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const API_URL = `${API_BASE}/cart`;

    const fetchCartItems = async () => {
        if (!user) return;
        try {
            const { data } = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems(data);
            // By default, select all items
            setSelectedItemIds(data.map(item => item._id));
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCartItems();
        } else {
            setCartItems([]);
            setSelectedItemIds([]);
            setLoading(false);
        }
    }, [user]);

    const addToCart = async (itemData) => {
        if (!user) {
            toast.error('Please login to add to cart');
            return false;
        }

        try {
            const { data } = await axios.post(API_URL, itemData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems([...cartItems, data]);
            // Automatically select the newly added item
            setSelectedItemIds(prev => [...prev, data._id]);
            toast.success('Added to cart!');
            return data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error adding to cart');
            return null;
        }
    };

    const removeFromCart = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems(cartItems.filter(item => item._id !== id));
            setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
            toast.success('Removed from cart');
        } catch (error) {
            toast.error('Error removing item');
        }
    };

    const toggleSelection = (id) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const updateQuantity = async (id, quantity) => {
        if (quantity < 1) return;
        try {
            await axios.put(`${API_URL}/${id}`, { quantity }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems(cartItems.map(item =>
                item._id === id ? { ...item, quantity } : item
            ));
        } catch (error) {
            toast.error('Error updating quantity');
        }
    };

    const clearCart = async () => {
        try {
            await axios.delete(API_URL, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCartItems([]);
            setSelectedItemIds([]);
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    const getSelectedItems = () => {
        return cartItems.filter(item => selectedItemIds.includes(item._id));
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            selectedItemIds,
            setSelectedItemIds,
            buyNowItem,
            setBuyNowItem,
            toggleSelection,
            getSelectedItems,
            loading,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            fetchCartItems
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
