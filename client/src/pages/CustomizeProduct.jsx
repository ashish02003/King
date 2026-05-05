import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as fabric from 'fabric';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import MugWrapPreview from '../components/MugWrapPreview';
import { FaTimes, FaArrowLeft, FaPlus, FaMinus, FaMagic, FaImage, FaFont, FaSmile, FaCheck, FaTrash, FaUndo } from 'react-icons/fa';

const CustomizeProduct = () => {
    const { id } = useParams();
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const initialPlaceholdersRef = useRef({});
    const [canvas, setCanvas] = useState(null);
    const [template, setTemplate] = useState(null);
    const [activeTab, setActiveTab] = useState('image');
    const [selectedObject, setSelectedObject] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [mugPreviewUrl, setMugPreviewUrl] = useState(null);
    const [showMugPreview, setShowMugPreview] = useState(false);
    const [activeUploadSlot, setActiveUploadSlot] = useState(null);
    const [customizationMode, setCustomizationMode] = useState('singlePhotoBothSides');
    const [photoTextValue, setPhotoTextValue] = useState('');
    const [photoSide, setPhotoSide] = useState('left');
    const [textSide, setTextSide] = useState('right');
    const [selectedUploadShape, setSelectedUploadShape] = useState('auto');
    const [uploadShapeBySlot, setUploadShapeBySlot] = useState({ left: 'auto', center: 'auto', right: 'auto' });
    const [shapeTargetSlot, setShapeTargetSlot] = useState('center');
    const [slotShapeOverrides, setSlotShapeOverrides] = useState({});
    const [slotAssets, setSlotAssets] = useState({
        left: { imageUrl: null, text: '', shapeType: null, transform: null },
        center: { imageUrl: null, text: '', shapeType: null, transform: null },
        right: { imageUrl: null, text: '', shapeType: null, transform: null }
    });

    const { user } = useAuth();
    const { addToCart, setSelectedItemIds, buyNowItem, setBuyNowItem } = useCart();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(buyNowItem?.template?._id === id ? buyNowItem.quantity : 1);

    // Logic for wrap product detection
    const isWrapProduct = (() => {
        const catLower = (template?.category || '').toLowerCase();
        return catLower.includes('mug') || catLower.includes('bottle') || catLower.includes('case') ||
            template?.wrapType === 'mug' || template?.wrapType === 'bottle' || template?.wrapType === 'phone';
    })();

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/templates/${id}`);
                setTemplate(data);
                if (buyNowItem?.template?._id !== data._id) setQuantity(data.moq || 1);
                const catLower = (data.category || '').toLowerCase();
                if (catLower.includes('mug') || catLower.includes('bottle')) setShowMugPreview(true);
            } catch (error) { console.error(error); }
        };
        fetchTemplate();
    }, [id]);

    useEffect(() => {
        if (!template || !canvasRef.current) return;
        const isWrap = isWrapProduct;
        const canvasWidth = isWrap ? 800 : 400;
        const canvasHeight = isWrap ? 400 : 600;

        const initCanvas = new fabric.Canvas(canvasRef.current, {
            height: canvasHeight,
            width: canvasWidth,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true
        });
        setCanvas(initCanvas);
        return () => initCanvas.dispose();
    }, [template?._id]);

    const handleAddToCart = async () => {
        if (!canvas) return;
        setLoadingAction('cart');
        try {
            const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 });
            await addToCart({
                template: template._id,
                price: template.basePrice,
                quantity,
                finalImageUrl: dataUrl,
                customizedJson: canvas.toJSON()
            });
            toast.success('Added to cart');
            navigate('/cart');
        } catch (err) { toast.error('Failed to add'); } finally { setLoadingAction(null); }
    };

    if (!template) return (
        <div className="min-h-screen bg-primary-dark flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-primary-dark pt-24">
            <div className="flex flex-col lg:flex-row h-[calc(100vh-96px)]">
                {/* Tools Sidebar */}
                <div className="w-full lg:w-80 bg-primary border-r border-white/[0.06] flex flex-col">
                    <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-gold transition-colors"><FaArrowLeft size={14} /></button>
                        <h1 className="text-base font-serif text-white">Customize</h1>
                        <div className="w-5"></div>
                    </div>

                    <div className="flex bg-white/[0.03] p-1 mx-5 mt-5 rounded-luxury">
                        {[
                            { id: 'image', icon: <FaImage size={12} />, label: 'Image' },
                            { id: 'text', icon: <FaFont size={12} />, label: 'Text' },
                            { id: 'emoji', icon: <FaSmile size={12} />, label: 'Emoji' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-luxury text-[10px] font-medium uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-gold text-primary-dark' : 'text-white/40 hover:text-white/60'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                        {activeTab === 'image' && (
                            <div className="space-y-5">
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="border-2 border-dashed border-gold/20 rounded-luxury p-10 text-center group cursor-pointer hover:border-gold/40 hover:bg-gold/[0.03] transition-all"
                                >
                                    <FaPlus className="text-gold mx-auto mb-3 text-xl group-hover:scale-110 transition-transform" />
                                    <p className="text-gold text-[10px] font-medium uppercase tracking-wider">Upload Photo</p>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-white/30 text-[10px] font-medium uppercase tracking-wider">Shape</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['rectangle', 'circle', 'heart', 'star'].map(shape => (
                                            <button key={shape} className="aspect-square rounded-luxury bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:border-gold/30 transition-all">
                                                <div className={`w-6 h-6 border-2 border-white/20 ${shape === 'circle' ? 'rounded-full' : ''}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="space-y-5">
                                <textarea
                                    className="input-luxury w-full h-28 resize-none text-sm"
                                    placeholder="Enter your text..."
                                    onBlur={(e) => {
                                        if (e.target.value && canvas) {
                                            const text = new fabric.IText(e.target.value, {
                                                left: canvas.width / 2,
                                                top: canvas.height / 2,
                                                fontFamily: 'serif',
                                                fill: '#C9A14A',
                                                originX: 'center',
                                                originY: 'center'
                                            });
                                            canvas.add(text);
                                            canvas.setActiveObject(text);
                                            canvas.renderAll();
                                        }
                                    }}
                                ></textarea>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="btn-outline py-2.5 text-[10px]">Serif</button>
                                    <button className="btn-outline py-2.5 text-[10px]">Modern</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-white/[0.06] space-y-3">
                         <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-luxury">
                            <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Qty</span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="text-white/50 hover:text-gold"><FaMinus size={10} /></button>
                                <span className="text-white font-medium">{quantity}</span>
                                <button onClick={() => setQuantity(q => q+1)} className="text-white/50 hover:text-gold"><FaPlus size={10} /></button>
                            </div>
                        </div>
                        <button
                            disabled={!!loadingAction}
                            onClick={handleAddToCart}
                            className="btn-gold w-full flex items-center justify-center gap-2.5 py-3.5"
                        >
                            {loadingAction === 'cart' ? 'Saving...' : 'Add to Cart & Buy'}
                            <FaCheck size={11} />
                        </button>
                    </div>
                </div>

                {/* Canvas Workspace */}
                <div className="flex-1 bg-primary-dark p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]">
                         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 space-y-6 flex flex-col items-center">
                        <div className="luxury-card p-3 bg-white shadow-card">
                            <canvas ref={canvasRef} className="rounded-sm"></canvas>
                        </div>

                        <div className="flex gap-3">
                            <button className="w-10 h-10 bg-white/[0.03] rounded-full flex items-center justify-center text-white/30 hover:text-gold transition-all border border-white/[0.06]">
                                <FaUndo size={13} />
                            </button>
                            <button className="w-10 h-10 bg-white/[0.03] rounded-full flex items-center justify-center text-white/30 hover:text-red-400 transition-all border border-white/[0.06]">
                                <FaTrash size={13} />
                            </button>
                        </div>
                    </div>

                    {/* 3D Preview */}
                    {showMugPreview && (
                        <div className="absolute bottom-6 right-6 w-56 h-56 bg-primary/90 backdrop-blur-xl rounded-luxury border border-white/[0.06] overflow-hidden p-3">
                             <div className="w-full h-full rounded-luxury bg-primary-light flex items-center justify-center border border-white/[0.06]">
                                <p className="text-[8px] text-gold font-medium uppercase tracking-[0.3em] animate-pulse">Live Preview</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomizeProduct;
