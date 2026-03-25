import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaTrash, FaPlus } from 'react-icons/fa';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [description, setDescription] = useState('');
    const [stock, setStock] = useState(0);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchCategories = async () => {
        try {
            const { data } = await axios.get('https://mimitiinaa.vercel.app/api/categories');
            setCategories(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load categories');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setName('');
        setImageFile(null);
        setDescription('');
        setStock(0);
        setWidth(0);
        setHeight(0);
        setEditId(null);
        // Reset file input manually if needed, or rely on React state
        document.getElementById('fileInput').value = '';
    };

    const handleEdit = (cat) => {
        setEditId(cat._id);
        setName(cat.name);
        setDescription(cat.description || '');
        setStock(cat.stock || 0);
        setWidth(cat.dimensions?.width || 0);
        setHeight(cat.dimensions?.height || 0);
        // Image handling is tricky, we don't set file input, just keep as is
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return toast.error('Category name is required');

        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('stock', stock);
            formData.append('width', width);
            formData.append('height', height);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (editId) {
                await axios.put(`https://mimitiinaa.vercel.app/api/categories/${editId}`, formData, config);
                toast.success('Category updated!');
            } else {
                await axios.post('https://mimitiinaa.vercel.app/api/categories', formData, config);
                toast.success('Category created!');
            }

            resetForm();
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This cannot be undone.')) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            };
            await axios.delete(`https://mimitiinaa.vercel.app/api/categories/${id}`, config);
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Manage Categories</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-xl shadow-md h-fit">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        {editId ? '✏️ Edit Category' : <><FaPlus className="text-blue-500" /> Add New Category</>}
                    </h2>
                    {editId && <button onClick={resetForm} className="text-xs text-red-500 underline mb-4">Cancel Edit</button>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded"
                                placeholder="e.g. Mobile Covers"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Image Upload</label>
                            <input
                                id="fileInput"
                                type="file"
                                accept="image/*"
                                className="w-full border p-2 rounded"
                                onChange={(e) => setImageFile(e.target.files[0])}
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload to replace existing image.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Stock/Ref ID</label>
                                <input disabled className="w-full border p-2 rounded bg-gray-100" placeholder="Auto-generated" />
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Recommended Upload Size (for Users)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">Width (px)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded text-sm"
                                        value={width}
                                        onChange={(e) => setWidth(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Height (px)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded text-sm"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Description (Optional)</label>
                            <textarea
                                className="w-full border p-2 rounded"
                                placeholder="Short description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-bold py-2 rounded disabled:opacity-50 ${editId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Saving...' : (editId ? 'Update Category' : 'Add Category')}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold mb-4">Existing Categories ({categories.length})</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {categories.map((cat) => (
                            <div key={cat._id} className={`flex items-center justify-between p-3 border rounded hover:bg-gray-50 ${editId === cat._id ? 'border-blue-500 bg-blue-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover rounded" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">No Img</div>
                                    )}
                                    <div>
                                        <p className="font-bold text-gray-800">{cat.name}</p>
                                        <p className="text-xs text-gray-500">Stock: {cat.stock} | Size: {cat.dimensions?.width}x{cat.dimensions?.height}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="text-blue-500 hover:text-blue-700 p-2 border rounded"
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat._id)}
                                        className="text-red-500 hover:text-red-700 p-2 border rounded"
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-center text-gray-400 py-10">No categories found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;
