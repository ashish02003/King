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
import { Layout, Card, Button, Typography, Space, Tag, InputNumber } from 'antd';
import { FaTimes, FaArrowLeft, FaPlus, FaMinus } from 'react-icons/fa';
// customizationAPI no longer needed – frontend clipPath approach is used

const { Content } = Layout;
const { Title, Text } = Typography;

const CustomizeProduct = () => {
    const { id } = useParams();
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [template, setTemplate] = useState(null);
    const [activeTab, setActiveTab] = useState('image');
    const [selectedObject, setSelectedObject] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    // Mug/cylindrical wrap preview
    const [mugPreviewUrl, setMugPreviewUrl] = useState(null);   // flat design URL for mug warp render
    const [showMugPreview, setShowMugPreview] = useState(false); // toggle the 3D preview panel

    const { user } = useAuth();
    const { addToCart, setSelectedItemIds, buyNowItem, setBuyNowItem } = useCart();
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(buyNowItem?.template?._id === id ? buyNowItem.quantity : 1);

    // Sync quantity changes back to buyNowItem state
    useEffect(() => {
        if (template && buyNowItem?.template?._id === template._id) {
            setBuyNowItem(prev => ({ ...prev, quantity }));
        }
    }, [quantity, template, setBuyNowItem]);

    // Fetch Template
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/templates/${id}`);
                setTemplate(data);

                // Initialize quantity to MOQ if not already carried over
                if (buyNowItem?.template?._id !== data._id) {
                    setQuantity(data.moq || 1);
                }

                // Improved robust check for 3D-capable categories
                const catLower = (data.category || '').toLowerCase();
                const is3DType = catLower.includes('mug') ||
                    catLower.includes('bottle') ||
                    catLower.includes('case') ||
                    data.wrapType === 'mug' ||
                    data.wrapType === 'bottle' ||
                    data.wrapType === 'phone';

                if (is3DType) {
                    setShowMugPreview(true);
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchTemplate();
    }, [id]);

    // Body scroll lock
    useEffect(() => {
        if (previewModalOpen) {
            document.body.style.overflow = 'hidden';
            // Scroll to top of overlay when opened
            const overlay = document.querySelector('.preview-overlay');
            if (overlay) overlay.scrollTop = 0;
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [previewModalOpen]);

    // Initialize Canvas
    useEffect(() => {
        if (!template || !canvasRef.current) return;

        const initCanvas = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 400,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true
        });

        setCanvas(initCanvas);

        // Selection Events
        const handleSelection = (e) => {
            const obj = e.selected ? e.selected[0] : (e.target || null);
            if (obj && (obj.locked === true || obj.locked === 'true')) {
                initCanvas.discardActiveObject();
                setSelectedObject(null);
                return;
            }
            setSelectedObject(obj);
            setIsPanning(false);
        };

        const handleCleared = () => {
            setSelectedObject(null);
            setIsPanning(false);
        };

        // Keep clipPath (shape) fixed at placeholder position so only image moves, not the shape
        const syncClipPathToPlaceholder = (obj) => {
            if (!obj.clipPath || !obj.maskRef) return;
            const mask = obj.maskRef;
            obj.clipPath.set({
                left: mask.left,
                top: mask.top,
                scaleX: mask.scaleX ?? 1,
                scaleY: mask.scaleY ?? 1,
                angle: mask.angle ?? 0,
                originX: mask.originX || 'center',
                originY: mask.originY || 'center'
            });
            obj.clipPath.setCoords();
        };

        // Constrain dragged images to stay inside their placeholder area
        const handleObjectMoving = (e) => {
            const obj = e.target;
            if (!obj) return;

            // Target ONLY the uploaded image inside the shape
            if (obj.role === 'clipped-image' && obj.maskRef) {
                const mask = obj.maskRef;
                const mCenter = mask.getCenterPoint();
                const mW = mask.getScaledWidth();
                const mH = mask.getScaledHeight();
                const iW = obj.getScaledWidth();
                const iH = obj.getScaledHeight();

                let newX = obj.left;
                let newY = obj.top;

                // 1. Constrain Panning: The image must always COVER the shape area.
                if (iW >= mW) {
                    const limitX = (iW - mW) / 2;
                    newX = Math.max(mCenter.x - limitX, Math.min(mCenter.x + limitX, newX));
                } else {
                    newX = mCenter.x;
                }

                if (iH >= mH) {
                    const limitY = (iH - mH) / 2;
                    newY = Math.max(mCenter.y - limitY, Math.min(mCenter.y + limitY, newY));
                } else {
                    newY = mCenter.y;
                }

                obj.set({ left: newX, top: newY });

                // Force clipPath (shape) to stay at placeholder position – only image moves, shape stays fixed
                syncClipPathToPlaceholder(obj);

                obj.setCoords();
            }
        };

        const handleObjectModified = (e) => {
            const obj = e.target;
            if (obj && obj.role === 'clipped-image' && obj.maskRef) {
                syncClipPathToPlaceholder(obj);
            }
        };

        initCanvas.on('selection:created', handleSelection);
        initCanvas.on('selection:updated', handleSelection);
        initCanvas.on('selection:cleared', handleCleared);
        initCanvas.on('object:moving', handleObjectMoving);
        initCanvas.on('object:modified', handleObjectModified);

        // Keyboard Delete Logic
        const handleKeyDown = (e) => {
            // CRITICAL FIX: Ignore delete/backspace if user is typing in ANY input or textarea
            const isTyping = e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable;

            if (isTyping) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObj = initCanvas.getActiveObject();
                if (activeObj && !activeObj.isEditing) {
                    if (activeObj.locked === true || activeObj.locked === 'true' || activeObj.role === 'placeholder') {
                        toast.error("Admin elements cannot be deleted");
                        e.preventDefault();
                        return;
                    }
                    // RESTORE PLACEHOLDER IF DELETING CLIPPED IMAGE OR GROUP
                    if ((activeObj.role === 'clipped-image' || activeObj.role === 'image-group') && activeObj.maskRef) {
                        const mask = activeObj.maskRef;
                        mask.set({ visible: true, selectable: true, evented: true });
                        const label = initCanvas.getObjects().find(obj =>
                            obj.role === 'placeholder-label' &&
                            (obj.placeholderRef === mask || obj.id === `label_${mask.id}`)
                        );
                        if (label) label.set({ visible: true });
                    }

                    initCanvas.remove(activeObj);
                    initCanvas.renderAll();
                    setSelectedObject(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        initCanvas.on('mouse:down', (opt) => {
            if (opt.target) {
                if (opt.target.role === 'placeholder') {
                    // Prevent selection/movement when clicking to upload
                    initCanvas.discardActiveObject();
                    // Don't hide placeholder here - only hide after successful upload
                    fileInputRef.current.click();
                    initCanvas.activePlaceholder = opt.target;
                } else if (opt.target.role === 'placeholder-label') {
                    initCanvas.discardActiveObject();
                    fileInputRef.current.click();
                    initCanvas.activePlaceholder = opt.target.placeholderRef;
                }
            }
        });

        const setupTemplate = async () => {
            // 1. Background Image
            if (template.backgroundImageUrl) {
                try {
                    const isWebUrl = template.backgroundImageUrl.startsWith('http');
                    const bgUrl = isWebUrl
                        ? template.backgroundImageUrl + (template.backgroundImageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime()
                        : template.backgroundImageUrl;

                    const img = await fabric.FabricImage.fromURL(bgUrl, {
                        crossOrigin: isWebUrl ? 'anonymous' : undefined
                    });

                    const scale = Math.min(initCanvas.width / img.width, initCanvas.height / img.height);
                    img.set({
                        scaleX: scale, scaleY: scale,
                        left: initCanvas.width / 2, top: initCanvas.height / 2,
                        originX: 'center', originY: 'center',
                        selectable: false, evented: false
                    });

                    initCanvas.add(img);
                    initCanvas.sendObjectToBack(img);
                    initCanvas.productImage = img;
                    initCanvas.renderAll();
                } catch (error) {
                    console.error('Failed to load background image:', error);
                }
            }

            // 2. Load Top Overlay
            if (template.overlayImageUrl && template.overlayImageUrl.includes('http')) {
                try {
                    const img = await fabric.FabricImage.fromURL(template.overlayImageUrl, { crossOrigin: 'anonymous' });
                    img.scaleToWidth(300);
                    img.set({
                        left: (initCanvas.width - img.getScaledWidth()) / 2,
                        top: 50, selectable: false, evented: false
                    });
                    initCanvas.overlayImage = img;
                    initCanvas.add(img);
                    initCanvas.bringObjectToFront(img);
                    initCanvas.renderAll();
                } catch (error) {
                    console.error('Failed to load overlay image:', error);
                }
            }

            // 3. Load Objects
            if (template.canvasSettings && template.canvasSettings.objects) {
                try {
                    const objectsToLoad = JSON.parse(JSON.stringify(template.canvasSettings.objects)).map(obj => {
                        if (obj.src && obj.src.startsWith('http')) {
                            obj.src = obj.src + (obj.src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                            obj.crossOrigin = 'anonymous';
                        }
                        return obj;
                    });

                    const objs = await fabric.util.enlivenObjects(objectsToLoad);
                    objs.forEach((item, index) => {
                        const originalObj = objectsToLoad[index];
                        if (originalObj.id === 'background_image') return;

                        // Restoration logic: Verify role/id from original JSON if missing on instance
                        let role = item.role || originalObj.role;
                        const id = item.id || originalObj.id;

                        // Heuristic: older templates may not have role="placeholder" saved.
                        // Detect photo areas by their admin styling: 
                        // Old: red dashed stroke (#ff6b6b) / soft pink fill
                        // New: indigo dashed stroke (#6366f1 / #4f46e5)
                        const looksLikeAdminPlaceholder =
                            !role &&
                            originalObj.strokeDashArray &&
                            Array.isArray(originalObj.strokeDashArray) &&
                            originalObj.strokeDashArray.length > 0 &&
                            (
                                originalObj.stroke === '#ff6b6b' ||
                                originalObj.stroke === '#6366f1' ||
                                originalObj.stroke === '#4f46e5' ||
                                originalObj.fill === 'rgba(255, 228, 225, 0.6)' ||
                                originalObj.fill === 'rgba(99, 102, 241, 0.1)'
                            );

                        if (looksLikeAdminPlaceholder) {
                            role = 'placeholder';
                        }

                        // Placeholder logic
                        if (role === 'placeholder' || id === 'user_photo_area') {
                            // Preserve shapeType from original object (star, circle, etc.)
                            const preservedShapeType = item.shapeType || originalObj.shapeType;

                            item.set({
                                role: 'placeholder',
                                id: id || `placeholder_${index}`, // Ensure ID is present
                                shapeType: preservedShapeType, // CRITICAL: Preserve shapeType for clipping
                                selectable: true,
                                evented: true,
                                // Lock movement initially - unlock only after image is uploaded
                                lockMovementX: true,
                                lockMovementY: true,
                                lockScalingX: true,
                                lockScalingY: true,
                                lockRotation: true,
                                // Gray background for the shape area
                                strokeWidth: 1,
                                stroke: '#94a3b8', // Slate-400 border
                                strokeDashArray: null,
                                fill: 'rgba(226, 232, 240, 0.7)', // Slate-200 gray background
                                // Vincent: Corrected field names
                                originX: 'center',
                                originY: 'center',
                                hoverCursor: 'pointer'
                            });

                            // Also set on instance for serialization
                            item.shapeType = preservedShapeType;

                            const center = (typeof item.getCenterPoint === 'function' ? item.getCenterPoint() : null) || { x: 200, y: 300 };
                            const labelId = `label_${item.id}`;
                            const w = item.type === 'path' && item.getBoundingRect ? item.getBoundingRect().width : (item.width * (item.scaleX || 1));
                            const h = item.type === 'path' && item.getBoundingRect ? item.getBoundingRect().height : (item.height * (item.scaleY || 1));
                            // Simplified blue text label centered in the gray shape
                            const label = new fabric.IText('Select\nPhoto', {
                                fontSize: Math.max(12, Math.min(w || 80, h || 80) / 6),
                                fill: '#2563eb', // Professional Blue-600
                                fontWeight: 'bold',
                                textAlign: 'center',
                                originX: 'center',
                                originY: 'center',
                                left: center.x,
                                top: center.y,
                                selectable: false,
                                evented: false,
                                role: 'placeholder-label',
                                id: labelId,
                                placeholderRef: item,
                                lineHeight: 1
                            });
                            initCanvas.add(item, label);
                        } else {
                            item.set({ selectable: false, evented: false });
                            initCanvas.add(item);
                        }
                    });
                    initCanvas.renderAll();
                    if (initCanvas.productImage) initCanvas.sendObjectToBack(initCanvas.productImage);
                } catch (e) { console.error(e); }
            }
        };

        setupTemplate();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            initCanvas.off('selection:created', handleSelection);
            initCanvas.off('selection:updated', handleSelection);
            initCanvas.off('selection:cleared', handleCleared);
            initCanvas.off('object:moving', handleObjectMoving);
            initCanvas.dispose();
        };
    }, [template?._id]);

    // Helpers
    const addToCanvas = (obj) => {
        if (!canvas) return;
        obj.set({
            left: canvas.width / 2, top: canvas.height / 2,
            originX: 'center', originY: 'center'
        });
        canvas.add(obj);
        canvas.setActiveObject(obj);
        if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
        canvas.renderAll();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) {
            if (canvas) canvas.activePlaceholder = null;
            return;
        }

        // Reset input value to allow re-uploading the same file
        e.target.value = '';

        const loadingToast = toast.loading('Uploading...');
        try {
            // ── Step 1: Find the target placeholder ──────────────────────────────────
            let placeholder = canvas.activePlaceholder || canvas.getActiveObject();

            // Must be an actual placeholder
            if (placeholder && placeholder.role !== 'placeholder') placeholder = null;

            // Fallback A: first visible placeholder by role
            if (!placeholder) {
                const candidates = canvas.getObjects().filter(o => o.role === 'placeholder');
                placeholder = candidates.find(o => o.visible !== false) || candidates[0];
            }

            // Fallback B: by ID (Prioritize Mug Wrap)
            if (!placeholder) {
                const mugArea = canvas.getObjects().find(o => o.id && o.id.includes('mug_wrap_area'));
                placeholder = mugArea || canvas.getObjects().find(o =>
                    o.id && (o.id === 'user_photo_area' || o.id.startsWith('placeholder'))
                );
            }

            // Fallback C: largest non-background shape
            if (!placeholder) {
                const shapes = canvas.getObjects().filter(o => {
                    if (o.id === 'background_image' || o.role === 'placeholder-label') return false;
                    if (o.type === 'image') return false;
                    return true;
                });
                if (shapes.length > 0) {
                    const area = (o) => {
                        try {
                            if (o.type === 'path' && o.getBoundingRect) {
                                const r = o.getBoundingRect(); return r.width * r.height;
                            }
                            return (o.getScaledWidth?.() || 0) * (o.getScaledHeight?.() || 0);
                        } catch { return 0; }
                    };
                    shapes.sort((a, b) => area(b) - area(a));
                    placeholder = shapes[0];
                    placeholder.set({ role: 'placeholder' });
                    placeholder.role = 'placeholder';
                }
            }

            if (!placeholder) {
                return toast.error('No photo area found. Ask admin to mark a placeholder.', { id: loadingToast });
            }

            // ── Step 2: Upload raw image to Cloudinary ───────────────────────────────
            toast.loading('Uploading 0%', {
                id: loadingToast,
                style: { background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a' }
            });

            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
                onUploadProgress: (ev) => {
                    if (ev.total) {
                        const pct = Math.round((ev.loaded * 100) / ev.total);
                        toast.loading(`Uploading ${pct}%`, {
                            id: loadingToast,
                            style: { background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', fontWeight: 'bold' }
                        });
                    }
                }
            });

            const imageUrl = uploadRes.data.url;

            // ── Step 3: Load image into Fabric.js ───────────────────────────────────
            let img;
            try {
                img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
            } catch (loadErr) {
                console.error('Image load failed:', loadErr);
                return toast.error('Image could not be loaded. Try another image.', { id: loadingToast });
            }

            if (!img || !img.width) {
                return toast.error('Invalid image from server. Try again.', { id: loadingToast });
            }

            // ── Step 4: Clone placeholder → use as Fabric clipPath ───────────────────
            // This works for ANY shape: Heart (path), Star (polygon), Circle, Rect, free-draw, etc.
            let clipMask = null;
            try {
                clipMask = await placeholder.clone();
                clipMask.set({
                    absolutePositioned: true,
                    left: placeholder.left,
                    top: placeholder.top,
                    scaleX: placeholder.scaleX || 1,
                    scaleY: placeholder.scaleY || 1,
                    angle: placeholder.angle || 0,
                    originX: placeholder.originX || 'center',
                    originY: placeholder.originY || 'center',
                    evented: false,
                    selectable: false
                });
            } catch (cloneErr) {
                console.warn('Could not clone placeholder for clipPath:', cloneErr);
                clipMask = null;
            }

            // ── Step 5: Get placeholder bounding size ────────────────────────────────
            let pW, pH;
            try {
                if (placeholder.type === 'path' && typeof placeholder.getBoundingRect === 'function') {
                    const r = placeholder.getBoundingRect();
                    pW = r.width; pH = r.height;
                } else {
                    pW = placeholder.getScaledWidth?.() ?? (placeholder.width * (placeholder.scaleX || 1));
                    pH = placeholder.getScaledHeight?.() ?? (placeholder.height * (placeholder.scaleY || 1));
                }
            } catch { /* ignore */ }
            if (!pW || !pH || !Number.isFinite(pW) || !Number.isFinite(pH)) { pW = 200; pH = 200; }

            // ── Step 6: Position & scale image to cover the placeholder ──────────────
            const center = (typeof placeholder.getCenterPoint === 'function')
                ? placeholder.getCenterPoint()
                : { x: canvas.width / 2, y: canvas.height / 2 };

            const scale = Math.max(pW / img.width, pH / img.height);

            img.set({
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center',
                angle: placeholder.angle || 0,
                scaleX: scale,
                scaleY: scale,
                clipPath: clipMask || undefined,  // ← key: shape mask applied here
                role: 'clipped-image',
                maskRef: placeholder,
                selectable: true,
                evented: true
            });

            // ── Step 7: Hide placeholder + label, show image ─────────────────────────
            placeholder.set({
                visible: false,
                selectable: false, // Fully lock the shape
                evented: false,    // Shape can no longer be clicked
                lockMovementX: true,
                lockMovementY: true
            });

            const labelId = `label_${placeholder.id}`;
            const label = canvas.getObjects().find(o =>
                o.id === labelId || (o.role === 'placeholder-label' && o.placeholderRef === placeholder)
            );
            if (label) label.set({ visible: false });

            canvas.activePlaceholder = null;

            canvas.add(img);
            canvas.setActiveObject(img);
            if (canvas.overlayImage) canvas.bringObjectToFront(canvas.overlayImage);
            canvas.bringObjectToFront(img);
            canvas.renderAll();

            // ── Step 8: Trigger 3D preview visibility for relevant categories ───────────
            const catL = (template.category || '').toLowerCase();
            const is3D = catL.includes('mug') || catL.includes('bottle') || catL.includes('case') ||
                template?.wrapType === 'mug' || template?.wrapType === 'bottle' || template?.wrapType === 'phone' ||
                (placeholder && placeholder.shapeType === 'mug-wrap');

            if (is3D) {
                setMugPreviewUrl(imageUrl);
                setShowMugPreview(true);
            }

            toast.success('Image uploaded! Drag to reposition.', {
                id: loadingToast,
                style: { background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', fontWeight: 'bold' }
            });
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error uploading image';
            toast.error(msg, { id: loadingToast });
        }
    };

    // ── Helper: Upload Design ─────────────────────────────
    const uploadDesign = async (dataUrl) => {
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('image', blob, 'final_design.png');
        const { data } = await axios.post(`${API_BASE}/upload`, formData);
        return data;
    };

    const handleAddToCart = async (directBuy = false) => {
        if (!user) return toast.error("Please login first");
        setLoadingAction(directBuy ? 'order' : 'cart');
        const loadingToast = toast.loading(directBuy ? "Preparing Checkout..." : "Adding to Cart...");

        try {
            // Hide selection/UI before exporting
            const ui = canvas.getObjects().filter(o => o.role === 'placeholder' || o.role === 'placeholder-label');
            ui.forEach(o => o.set('visible', false));
            canvas.discardActiveObject();
            canvas.renderAll();

            const data = await uploadDesign(canvas.toDataURL({ multiplier: 2 }));
            ui.forEach(o => o.set('visible', true));

            const payload = { 
                template: template._id, 
                customizedJson: canvas.toJSON(), 
                finalImageUrl: data.url, 
                price: template.basePrice, 
                quantity: quantity,
                packingCharges: template.packingCharges || 0,
                shippingCharges: template.shippingCharges || 0,
                templateData: template
            };
            
            if (directBuy) {
                // IMPORTANT: Separate flow for "Buy Now" - don't go to permanent cart
                setBuyNowItem({
                    ...payload,
                    template: template // store full template object for checkout display
                });
                toast.success("Design Ready!", { id: loadingToast });
                navigate(`/checkout?id=${template._id}`);
            } else {
                await addToCart(payload);
                toast.success("Added to cart!", { id: loadingToast });
            }
        } catch (e) { 
            console.error(e);
            toast.error("Process failed. Try again.", { id: loadingToast }); 
        } finally { 
            setLoadingAction(null); 
        }
    };

    const handlePreview = () => {
        const ui = canvas.getObjects().filter(o => o.role === 'placeholder' || o.role === 'placeholder-label');
        ui.forEach(o => o.set('visible', false));
        canvas.discardActiveObject();
        canvas.renderAll();

        const designUrl = canvas.toDataURL({ multiplier: 2 });
        setPreviewImage(designUrl);

        // For 3D-capable templates, use the current full canvas design for the 3D preview
        const catLower = (template.category || '').toLowerCase();
        const is3D = catLower.includes('mug') || catLower.includes('bottle') || catLower.includes('case') ||
            template?.wrapType === 'mug' || template?.wrapType === 'bottle' || template?.wrapType === 'phone';

        if (is3D || showMugPreview) {
            setMugPreviewUrl(designUrl);
        }

        ui.forEach(o => o.set('visible', true));
        setPreviewModalOpen(true);
    };

    if (!template) return <div className="p-20 text-center">Loading...</div>;

    const TabButton = ({ name, icon, label }) => (
        <button className={`flex-1 p-3 text-center border-b-2 font-medium transition-colors ${activeTab === name ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(name)}>
            <span className="text-xl block mb-1">{icon}</span>
            <span className="text-sm">{label}</span>
        </button>
    );

    const PreviewModal = () => (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 preview-overlay">
            <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative">
                {/* Header */}
                <div className="px-8 py-7 border-b border-gray-100 flex justify-between items-center bg-transparent">
                    <div className="font-sans">
                        <h2 className="text-[28px] font-[900] uppercase tracking-tighter m-0 text-[#1e293b] leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>DESIGN PREVIEW</h2>
                        <p className="  text-[10px] font-black uppercase tracking-[0.25em] mt-2 opacity-80 text-[#911805] " style={{ letterSpacing: '0.1em' }}>REVIEW YOUR CUSTOMIZATION BEFORE ORDERING</p>
                    </div>
                    <button
                        onClick={() => setPreviewModalOpen(false)}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:rotate-90 hover:bg-gray-100 transition-all duration-300 text-gray-400 hover:text-red-500 shadow-sm"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Content - SCROLLABLE AREA */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-transparent">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left: Product Specs Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-[#f8fafc] rounded-[2.5rem] p-8 border border-slate-100">
                                <h3 className="text-[11px] font-[900] uppercase tracking-[0.1em] text-[#911805] mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>PRODUCT TECHNICALS</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                        <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">PRODUCT</span>
                                        <span className="text-[13px] font-[900] text-[#1e293b]">{template.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                        <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">CATEGORY</span>
                                        <Tag className="m-0 border-none px-4 font-black text-[9px] uppercase rounded-full bg-blue-100 text-blue-600">{template.category}</Tag>
                                    </div>
                                    {template.productSize && (
                                        <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                            <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">CAPACITY/SIZE</span>
                                            <span className="text-[13px] font-[900] text-[#1e293b]">{template.productSize}</span>
                                        </div>
                                    )}
                                    {template.printSize && (
                                        <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                            <span className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider">PRINT AREA</span>
                                            <span className="text-[13px] font-[900] text-[#1e293b]">{template.printSize}</span>
                                        </div>
                                    )}
                                    <div className="pt-6 mt-6 border-t border-slate-200 space-y-3">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-[#94a3b8]">
                                            <span>Base Price</span>
                                            <span className="text-[#1e293b] font-[900]">₹{template.basePrice}</span>
                                        </div>
                                        {template.shippingCharges > 0 && (
                                            <div className="flex justify-between items-center text-[11px] font-bold text-[#94a3b8]">
                                                <span>Shipping Fee</span>
                                                <span className="text-[#1e293b] font-[900]">₹{template.shippingCharges}</span>
                                            </div>
                                        )}
                                        <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-black text-[#94a3b8] uppercase tracking-widest">EST. TOTAL</span>
                                            <span className="text-[32px] font-[900] text-[#2D5A27] leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                                                ₹{((template.basePrice + (template.packingCharges || 0)) * quantity + (template.shippingCharges || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 rounded-[2rem] p-6 border border-blue-100/50">
                                <p className="text-[11px] text-blue-600/70 font-bold leading-relaxed">
                                    Kindly note: The colors on your screen may slightly differ from the actual printed product due to screen calibration.
                                </p>
                            </div>
                        </div>

                        {/* Right: Visual Previews */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Flat Design View */}
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 ml-4">2D Design Layout</span>
                                    <div className="bg-gray-50 rounded-[2.5rem] aspect-square flex items-center justify-center p-8 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-200/20 to-transparent"></div>
                                        <img src={previewImage} alt="Final" className="max-h-full max-w-full object-contain drop-shadow-2xl z-10 transition-transform duration-500 group-hover:scale-110" />
                                        {template.overlayImageUrl && (
                                            <img
                                                src={template.overlayImageUrl}
                                                alt="Mockup"
                                                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-40 z-20 mix-blend-multiply"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* 3D View (If applicable) */}
                                {(template?.wrapType === 'mug' || template?.wrapType === 'bottle' || showMugPreview) && (
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 ml-4">3D Realistic Mockup</span>
                                        <div className="bg-gray-50 rounded-[2.5rem] aspect-square flex items-center justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-bl from-indigo-100/30 to-transparent"></div>
                                            <div className="scale-[0.8] transition-transform duration-500 group-hover:scale-[0.85]">
                                                <MugWrapPreview
                                                    photoUrl={mugPreviewUrl || previewImage}
                                                    wrapType={template?.wrapType || (() => {
                                                        const cat = (template.category || '').toLowerCase();
                                                        if (cat.includes('mug')) return 'mug';
                                                        if (cat.includes('bottle')) return 'bottle';
                                                        if (cat.includes('case')) return 'phone';
                                                        return 'mug';
                                                    })()}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons - EXACTLY as per screenshot + Add to Cart */}
                <div className="p-8 border-t border-gray-100 bg-transparent flex flex-col md:flex-row gap-4">
                    <button
                        onClick={() => setPreviewModalOpen(false)}
                        className="flex-1 py-5 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-gray-700 hover:bg-slate-50 transition-all text-xs"
                    >
                        BACK TO EDITOR
                    </button>

                    <button
                        onClick={() => { setPreviewModalOpen(false); handleAddToCart(true); }}
                        className="flex-[2] py-5 rounded-2xl bg-[#187336] hover:bg-[#0a4b0e] text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-xs"
                    >
                        PLACE ORDER SUCCESSFULLY <span className="text-xl">→</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Layout style={{ minHeight: 'calc(100vh - 80px)', background: '#F8F5F0', position: 'relative', overflow: 'hidden' }}>
                <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 overflow-hidden -z-10`}>
                    <div className="luxury-blob bg-luxury-gold/50 top-[-10%] left-[-5%] animate-float"></div>
                    <div className="luxury-blob bg-luxury-green-light/40 bottom-[-5%] right-[-10%] animate-float" style={{ animationDelay: '-10s' }}></div>
                    <div className="luxury-blob bg-luxury-blue-light/30 top-1/2 left-1/2 animate-float" style={{ animationDelay: '-15s' }}></div>
                </div>
                <Content style={{ padding: '24px 16px', position: 'relative', zIndex: 10 }}>
                    <div className="container mx-auto mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-8 py-3 bg-white border-none rounded-full text-[13px] font-[900] text-[#1e293b] hover:text-luxury-green transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] uppercase tracking-[0.15em] group"
                        >
                            <FaArrowLeft className="text-sm transition-transform group-hover:-translate-x-1" /> GO BACK
                        </button>
                    </div>
                    <div className="container mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-128px)] gap-6">
                        <Card
                            className="flex-1 relative flex items-center justify-center"
                            style={{ borderRadius: 20 }}
                            bodyStyle={{ padding: 16, height: '100%', overflow: 'visible' }}
                        >
                            <div className="shadow-2xl border-[10px] border-white rounded-[2rem] bg-white inline-block">
                                <canvas ref={canvasRef} />
                            </div>
                            <Button
                                type="secondary"
                                onClick={handlePreview}
                                style={{ position: 'absolute', top: 16, right: 16 }}
                            >
                                👁️ Preview
                            </Button>


                        </Card>

                        <Card
                            className="w-full lg:w-[400px] flex flex-col h-full"
                            style={{ borderRadius: 20 }}
                            bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            <div className="p-4 border-b group">
                                <Title level={4} style={{ marginBottom: 4 }}>{template.name}</Title>
                                <div className="flex items-center justify-between">
                                    <Text className="text-lg font-black" style={{ color: '#2D5A27' }} strong>₹{template.basePrice + (template.packingCharges || 0)}</Text>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                                            {template.shippingCharges > 0 ? `+ ₹${template.shippingCharges} Shipping` : 'FREE Delivery'}
                                        </span>
                                        {template.packingCharges > 0 && (
                                            <span className="text-[9px] text-gray-300 font-bold italic">Inc. Packing Charges</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-b bg-gray-50">
                                <TabButton name="image" icon="📷" label="Images" />
                                <TabButton name="text" icon="T" label="Text" />
                                <TabButton name="emoji" icon="😊" label="Emoji" />
                                <TabButton name="shapes" icon="🔷" label="Shapes" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {activeTab === 'image' && (
                                    <div className="space-y-4">
                                        <button onClick={() => fileInputRef.current.click()} className="w-full border-2 border-dashed border-indigo-300 py-6 rounded-lg text-indigo-600 hover:bg-indigo-50 font-medium">+ Upload Photo</button>
                                        <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
                                    </div>
                                )}
                                {activeTab === 'text' && (
                                    <div className="space-y-4">
                                        <button onClick={() => addToCanvas(new fabric.IText('Your Text', { fontFamily: 'Arial', fontSize: 24, fill: '#000000' }))} className="w-full bg-white border py-3 rounded hover:bg-gray-100 font-serif text-lg">Add Heading</button>
                                        {selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                            <div className="p-4 bg-white border rounded space-y-3">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Text Color</label>
                                                    <input
                                                        type="color"
                                                        value={selectedObject.fill || '#000000'}
                                                        onChange={(e) => {
                                                            selectedObject.set('fill', e.target.value);
                                                            canvas.renderAll();
                                                        }}
                                                        className="w-full h-10 rounded border cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Font Size</label>
                                                    <input
                                                        type="number"
                                                        min="8"
                                                        max="200"
                                                        value={selectedObject.fontSize || 24}
                                                        onChange={(e) => {
                                                            selectedObject.set('fontSize', Number(e.target.value));
                                                            canvas.renderAll();
                                                        }}
                                                        className="w-full border p-2 rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Font Style</label>
                                                    <select
                                                        value={selectedObject.fontFamily || 'Arial'}
                                                        onChange={(e) => {
                                                            selectedObject.set('fontFamily', e.target.value);
                                                            canvas.renderAll();
                                                        }}
                                                        className="w-full border p-2 rounded"
                                                    >
                                                        <option value="Arial">Arial</option>
                                                        <option value="Times New Roman">Times New Roman</option>
                                                        <option value="Courier New">Courier New</option>
                                                        <option value="Georgia">Georgia</option>
                                                        <option value="Verdana">Verdana</option>
                                                        <option value="Impact">Impact</option>
                                                        <option value="Comic Sans MS">Comic Sans MS</option>
                                                        <option value="Roboto">Roboto</option>
                                                        <option value="Open Sans">Open Sans</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-600 mb-2 block">Text Formatting</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const isBold = selectedObject.fontWeight === 'bold';
                                                                selectedObject.set('fontWeight', isBold ? 'normal' : 'bold');
                                                                canvas.renderAll();
                                                            }}
                                                            className={`flex-1 p-2 border rounded text-sm font-semibold ${selectedObject.fontWeight === 'bold'
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-50 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <strong>B</strong>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const isItalic = selectedObject.fontStyle === 'italic';
                                                                selectedObject.set('fontStyle', isItalic ? 'normal' : 'italic');
                                                                canvas.renderAll();
                                                            }}
                                                            className={`flex-1 p-2 border rounded text-sm ${selectedObject.fontStyle === 'italic'
                                                                ? 'bg-blue-500 text-white italic'
                                                                : 'bg-gray-50 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <em>I</em>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'emoji' && (
                                    <EmojiPicker onEmojiClick={(d) => addToCanvas(new fabric.IText(d.emoji, { fontSize: 50 }))} width="100%" height={350} />
                                )}
                                {activeTab === 'shapes' && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => addToCanvas(new fabric.Rect({ width: 80, height: 80, fill: '#ff4444' }))} className="aspect-square bg-red-500 rounded-lg hover:opacity-80 transition-opacity"></button>
                                        <button onClick={() => addToCanvas(new fabric.Circle({ radius: 40, fill: '#44ff44' }))} className="aspect-square bg-green-500 rounded-full hover:opacity-80 transition-opacity"></button>
                                        <button onClick={() => addToCanvas(new fabric.Triangle({ width: 80, height: 80, fill: '#4444ff' }))} className="aspect-square bg-blue-500 hover:opacity-80 transition-opacity" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></button>
                                    </div>
                                )}
                                {selectedObject && (
                                    <div className="mt-6 p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Layer Controls</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => { canvas.bringToFront(selectedObject); if (canvas.overlayImage) canvas.bringToFront(canvas.overlayImage); canvas.renderAll(); }} 
                                                className="p-2.5 bg-white text-[10px] font-black uppercase text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
                                            >
                                                Front
                                            </button>
                                            <button 
                                                onClick={() => { canvas.sendToBack(selectedObject); if (canvas.productImage) canvas.sendToBack(canvas.productImage); canvas.renderAll(); }} 
                                                className="p-2.5 bg-white text-[10px] font-black uppercase text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                onClick={() => { canvas.remove(selectedObject); setSelectedObject(null); canvas.renderAll(); }} 
                                                className="p-2.5 bg-red-50 text-[10px] font-black uppercase text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t space-y-5 bg-white shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                                {/* Quantity Selector UI */}
                                <div className="flex items-center justify-between bg-slate-50/80 p-5 rounded-2xl border border-slate-100/50">
                                    <span className="text-[11px] font-[900] text-slate-400 uppercase tracking-widest leading-none">Quantity</span>
                                    <div className="flex items-center gap-5 bg-white rounded-xl shadow-sm p-1.5 border border-slate-100">
                                        <button 
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-800 rounded-lg disabled:opacity-30"
                                            disabled={quantity <= (template.moq || 1)}
                                        >
                                            <FaMinus size={12} />
                                        </button>
                                        <span className="w-8 text-center font-[900] text-slate-900 text-[18px]">{quantity}</span>
                                        <button 
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-800 rounded-lg"
                                        >
                                            <FaPlus size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Order Summary breakdown */}
                                <div className="space-y-3 px-2">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                        <span>Product price (x{quantity})</span>
                                        <span className="text-slate-900 font-bold">₹{(template.basePrice * quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                        <span>Packing Charges</span>
                                        <span className="text-slate-900 font-bold">+ ₹{((template.packingCharges || 0) * quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                        <span>Shipping Charges</span>
                                        <span className={template.shippingCharges === 0 ? 'text-green-600 font-bold' : 'text-slate-900 font-bold'}>
                                            {template.shippingCharges === 0 ? 'FREE' : `+ ₹${(template.shippingCharges || 0).toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div className="pt-4 mt-1 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-[900] text-slate-900 uppercase tracking-[0.2em]">EST. TOTAL</span>
                                        <span className="text-[32px] font-[900] text-[#2D5A27] leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                                            ₹{((template.basePrice + (template.packingCharges || 0)) * quantity + (template.shippingCharges || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 pt-3">
                                    <Button
                                        block
                                        type="primary"
                                        disabled={!!loadingAction}
                                        onClick={() => handleAddToCart(false)}
                                        className="h-[60px] font-black transition-all hover:-translate-y-1 active:scale-[0.98]"
                                        style={{ background: '#111', borderColor: '#111', borderRadius: '18px', fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                                    >
                                        {loadingAction === 'cart' ? 'SAVING...' : 'ADD TO CART'}
                                    </Button>
                                    <Button
                                        block
                                        type="primary"
                                        disabled={!!loadingAction}
                                        onClick={() => {
                                            if (canvas) {
                                               handleAddToCart(true); 
                                            } else {
                                               navigate(`/checkout?id=${template._id}`);
                                            }
                                        }}
                                        className="h-[68px] font-black transition-all hover:-translate-y-1 active:scale-[0.98] shadow-2xl shadow-green-100"
                                        style={{ background: '#2D5A27', borderColor: '#2D5A27', borderRadius: '18px', fontSize: '15px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                                    >
                                        {loadingAction === 'order' ? 'PREPARING...' : 'PROCEED TO BUY'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Content>
            </Layout>

            {previewModalOpen && <PreviewModal />}
        </>
    );
};

export default CustomizeProduct;




