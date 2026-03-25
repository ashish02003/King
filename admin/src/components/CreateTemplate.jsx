import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    FaSave, FaTimes, FaShapes, FaFont, FaImage, FaLayerGroup,
    FaCog, FaArrowUp, FaArrowDown, FaTrash, FaLock, FaUnlock,
    FaMagic, FaCloudUploadAlt, FaEdit, FaPlus, FaCubes, FaCoffee,
    FaArrowLeft, FaEye
} from 'react-icons/fa';

const CreateTemplate = () => {
    const canvasRef = useRef(null);
    const bgImageInputRef = useRef(null);
    const graphicInputRef = useRef(null);
    const demoImageInputRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState(0);
    const [demoImageUrl, setDemoImageUrl] = useState('');
    const [variantNo, setVariantNo] = useState('');
    const [productSize, setProductSize] = useState('');
    const [printSize, setPrintSize] = useState('');
    const [moq, setMoq] = useState(1);
    const [packingCharges, setPackingCharges] = useState(0);  // ✅ NEW
    const [shippingCharges, setShippingCharges] = useState(0); // ✅ NEW
    const [categories, setCategories] = useState([]); // 👈 NEW
    const [activeTab, setActiveTab] = useState('background'); // background, shapes, text, elements

    // Fetch Categories – default to first category so new templates save under correct category
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/categories`);
                setCategories(data);
                setCategory(prev => {
                    if (data.length === 0) return prev;
                    if (prev === '' || !data.some(c => c.name === prev)) return data[0].name;
                    return prev;
                });
            } catch (error) {
                console.error('Failed to fetch categories', error);
                toast.error('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    const [selectedObject, setSelectedObject] = useState(null);
    const [objProps, setObjProps] = useState({
        width: 0,
        height: 0,
        angle: 0,
        fill: '#000000',
        fontSize: 40,
        fontFamily: 'Arial',
        locked: false
    });
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact', 'Comic Sans MS'];
    const { user } = useAuth();
    const navigate = useNavigate();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingBg, setIsUploadingBg] = useState(false);
    const { id } = useParams();
    const isEdit = !!id;

    // Custom Shape Drawing State
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawPoints, setDrawPoints] = useState([]);
    const drawPointsRef = useRef([]); // Ref for stable access in event handlers
    const [useSmoothCurve, setUseSmoothCurve] = useState(false); // false = exact points (straight edges), true = smooth curve between points
    const [tempObjects, setTempObjects] = useState([]);
    const [isEditingPoints, setIsEditingPoints] = useState(false);
    const editingShapeRef = useRef(null); // shape being edited (for add-point-on-segment)
    const addPointOnSegmentRef = useRef(() => { });
    const bendingSegmentRef = useRef(null); // segment index when dragging line to make curve (screenshot behaviour)
    const hoveredSegmentRef = useRef(-1);
    const segmentOverlayRef = useRef(null); // highlight overlay for selected/hovered line
    const [wrapType, setWrapType] = useState('none'); // 'none' | 'mug' | 'bottle'

    // Initialize Canvas
    useEffect(() => {
        const initCanvas = new fabric.Canvas(canvasRef.current, {
            height: 600,
            width: 400,
            backgroundColor: '#ffffff',
            selection: true
        });
        setCanvas(initCanvas);

        // Selection events
        const updateSelectionProps = (e) => {
            const obj = e.selected ? e.selected[0] : (e.target || null);
            setSelectedObject(obj);
            if (obj) {
                setObjProps({
                    width: Math.round(obj.getScaledWidth()),
                    height: Math.round(obj.getScaledHeight()),
                    angle: Math.round(obj.angle || 0),
                    fill: obj.fill || '#000000',
                    fontSize: obj.fontSize || 40,
                    fontFamily: obj.fontFamily || 'Arial',
                    locked: obj.locked || false,
                    role: obj.role || null
                });
            } else {
                setObjProps({ width: 0, height: 0, angle: 0, fill: '#000000', fontSize: 40, fontFamily: 'Arial', locked: false, role: null });
            }
        };

        const updateFromTransform = (e) => {
            const obj = e.target;
            if (obj) {
                setObjProps(prev => ({
                    ...prev,
                    width: Math.round(obj.getScaledWidth()),
                    height: Math.round(obj.getScaledHeight()),
                    angle: Math.round(obj.angle || 0)
                }));
            }
        };

        initCanvas.on('selection:created', updateSelectionProps);
        initCanvas.on('selection:updated', updateSelectionProps);
        initCanvas.on('selection:cleared', updateSelectionProps);

        // Transform events
        initCanvas.on('object:modified', updateFromTransform);
        initCanvas.on('object:scaling', updateFromTransform);
        initCanvas.on('object:rotating', updateFromTransform);
        initCanvas.on('object:moving', updateFromTransform);

        return () => {
            initCanvas.dispose();
        }
    }, []);

    // --- HANDLE CUSTOM SHAPE DRAWING EVENTS ---
    useEffect(() => {
        if (!canvas || !isDrawingMode) return;

        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;
        drawPointsRef.current = []; // Reset ref

        const handleMouseDown = (opt) => {
            if (opt.e.button === 2) return; // Right click ignore

            const pointer = canvas.getPointer(opt.e);
            let x = pointer.x;
            let y = pointer.y;

            // Snap to Grid
            if (objProps.snapToGrid) {
                x = Math.round(x / 10) * 10;
                y = Math.round(y / 10) * 10;
            }

            // Handle clicking first point to close shape
            if (drawPointsRef.current.length > 2) {
                const firstPt = drawPointsRef.current[0];
                const dist = Math.sqrt(Math.pow(x - firstPt.x, 2) + Math.pow(y - firstPt.y, 2));
                if (dist < 15) {
                    finishDrawing();
                    return;
                }
            }

            drawPointsRef.current.push({ x, y });
            setDrawPoints([...drawPointsRef.current]);

            // Add visual dot
            const dot = new fabric.Circle({
                left: x,
                top: y,
                radius: 5,
                fill: '#3498db',
                stroke: 'white',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                id: 'draw_dot'
            });
            canvas.add(dot);

            if (drawPointsRef.current.length > 1) {
                const prevPt = drawPointsRef.current[drawPointsRef.current.length - 2];
                const line = new fabric.Line([prevPt.x, prevPt.y, x, y], {
                    stroke: '#3498db',
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    id: 'draw_line'
                });
                canvas.add(line);
            }
            canvas.renderAll();
        };

        const handleMouseMove = (opt) => {
            const pointer = canvas.getPointer(opt.e);
            const pts = drawPointsRef.current;
            if (pts.length === 0) return;

            const lastPt = pts[pts.length - 1];

            // Remove old preview line and add new one from last point to cursor (fixes random dotted line)
            const oldLine = canvas.getObjects().find(o => o.id === 'temp_move_line');
            if (oldLine) canvas.remove(oldLine);

            const moveLine = new fabric.Line([lastPt.x, lastPt.y, pointer.x, pointer.y], {
                stroke: 'rgba(52, 152, 219, 0.6)',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                id: 'temp_move_line'
            });
            canvas.add(moveLine);

            // Highlight first point if close enough to close
            const firstDot = canvas.getObjects().find(o => o.id === 'draw_dot');
            if (pts.length > 2 && firstDot) {
                const dist = Math.sqrt(Math.pow(pointer.x - pts[0].x, 2) + Math.pow(pointer.y - pts[0].y, 2));
                firstDot.set({ fill: dist < 15 ? '#2ecc71' : '#3498db', radius: dist < 15 ? 8 : 5 });
            }

            canvas.renderAll();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') finishDrawing();
            if (e.key === 'Escape') cancelDrawing();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:dblclick', finishDrawing);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:dblclick', finishDrawing);
            window.removeEventListener('keydown', handleKeyDown);
            canvas.defaultCursor = 'default';
            canvas.selection = true;
        };
    }, [canvas, isDrawingMode]);

    // Fetch Template for Edit Mode
    useEffect(() => {
        if (isEdit && canvas) {
            const fetchTemplate = async () => {
                try {
                    const { data } = await axios.get(`${API_BASE}/templates/${id}`);
                    setName(data.name || '');
                    setCategory(data.category || '');
                    setPrice(data.basePrice || 0);
                    setBackgroundImageUrl(data.backgroundImageUrl || '');
                    setVariantNo(data.variantNo || '');
                    setProductSize(data.productSize || '');
                    setPrintSize(data.printSize || '');
                    setMoq(data.moq || 1);
                    setWrapType(data.wrapType || 'none');
                    setDemoImageUrl(data.demoImageUrl || '');
                    setPackingCharges(data.packingCharges || 0);   // ✅ NEW
                    setShippingCharges(data.shippingCharges || 0); // ✅ NEW

                    // Load canvas state
                    if (data.canvasSettings) {
                        // Deep clone and add cache busters and crossOrigin to all images in JSON
                        if (data.canvasSettings.objects) {
                            data.canvasSettings.objects = data.canvasSettings.objects.map(obj => {
                                if ((obj.type === 'image' || obj.type === 'fabric.Image') && obj.src && obj.src.startsWith('http')) {
                                    obj.src = obj.src + (obj.src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                                    obj.crossOrigin = 'anonymous';
                                }
                                return obj;
                            });
                        }

                        await canvas.loadFromJSON(data.canvasSettings);
                        canvas.renderAll();
                        console.log('Canvas loaded from JSON');
                    }
                } catch (error) {
                    console.error('Error fetching template:', error);
                    toast.error('Failed to load template data');
                }
            };
            fetchTemplate();
        }
    }, [isEdit, canvas, id]);

    // Upload Background Image
    const handleBackgroundUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Instant Local Preview
        const reader = new FileReader();
        reader.onload = async (f) => {
            const localUrl = f.target.result;

            // Add to canvas immediately
            const img = await fabric.FabricImage.fromURL(localUrl);

            const scale = Math.min(
                canvas.width / img.width,
                canvas.height / img.height
            );

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                id: 'background_image'
            });
            // Also set on instance for direct access
            img.id = 'background_image';

            // Remove existing background if any
            const existingBg = canvas.getObjects().find(obj => obj.id === 'background_image');
            if (existingBg) canvas.remove(existingBg);

            canvas.add(img);
            canvas.sendObjectToBack(img);
            canvas.renderAll();

            // 2. Background Upload to Cloudinary
            try {
                setIsUploadingBg(true);
                const formData = new FormData();
                formData.append('image', file);

                const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const imageUrl = uploadRes.data.url;
                setBackgroundImageUrl(imageUrl);

                // Update the canvas image object with the real URL for saving
                // In Fabric 6, we use a different approach to update source
                const validUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();

                // Remove the temporary local image and add the server one
                // This is safer than trying to mutate the existing object in Fabric 6
                const newImg = await fabric.FabricImage.fromURL(validUrl, {
                    crossOrigin: 'anonymous'
                });

                newImg.set({
                    scaleX: img.scaleX,
                    scaleY: img.scaleY,
                    left: img.left,
                    top: img.top,
                    originX: img.originX,
                    originY: img.originY,
                    selectable: false,
                    evented: false,
                    id: 'background_image'
                });
                newImg.id = 'background_image';
                // Fabric 6 sometimes needs the src property set on the instance for serialization
                newImg.src = validUrl;

                canvas.remove(img);
                canvas.add(newImg);
                canvas.sendObjectToBack(newImg);
                canvas.renderAll();

                console.log('Background upload complete and synced');
            } catch (error) {
                console.error('SYNC ERROR:', error);
                alert('Failed to sync background to server: ' + (error.response?.data?.message || error.message));
            } finally {
                setIsUploadingBg(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Generate Demo Image: product + shape with sample photo inside (so user dashboard shows product with photo in shape)
    const handleDemoImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !canvas) return;
        try {
            const placeholders = canvas.getObjects().filter(obj => obj.role === 'placeholder');
            if (placeholders.length === 0) {
                toast.error('Pehle canvas par koi Photo Area (shape) add karein, phir demo photo upload karein.');
                e.target.value = '';
                return;
            }
            toast.loading('Demo bana rahe hain – product + shape me photo...', { id: 'demo-gen' });
            const placeholder = placeholders[0];
            const blobUrl = URL.createObjectURL(file);
            const img = await fabric.FabricImage.fromURL(blobUrl, { crossOrigin: 'anonymous' });
            URL.revokeObjectURL(blobUrl);

            let clipMask;
            try {
                clipMask = await placeholder.clone();
                clipMask.set({
                    absolutePositioned: true,
                    left: placeholder.left,
                    top: placeholder.top,
                    scaleX: placeholder.scaleX,
                    scaleY: placeholder.scaleY,
                    angle: placeholder.angle || 0,
                    originX: placeholder.originX || 'center',
                    originY: placeholder.originY || 'center',
                    visible: false,
                    evented: false,
                    selectable: false
                });
            } catch (err) {
                console.warn('Clip clone failed', err);
            }

            const center = placeholder.getCenterPoint?.() || { x: canvas.width / 2, y: canvas.height / 2 };
            const pW = placeholder.getScaledWidth?.() || 200;
            const pH = placeholder.getScaledHeight?.() || 200;
            const baseW = img.width || pW;
            const baseH = img.height || pH;
            const scale = Math.max(pW / baseW, pH / baseH);
            img.set({
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center',
                angle: placeholder.angle || 0,
                clipPath: clipMask || undefined,
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false
            });

            placeholders.forEach(p => p.set('visible', false));
            canvas.add(img);
            canvas.renderAll();
            const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.5 });
            canvas.remove(img);
            placeholders.forEach(p => p.set('visible', true));
            canvas.renderAll();

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const demoFile = new File([blob], 'demo.png', { type: 'image/png' });
            const formData = new FormData();
            formData.append('image', demoFile);
            const uploadRes = await axios.post(`${API_BASE}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setDemoImageUrl(uploadRes.data.url);
            toast.success('Demo ready! Ab niche "Save Template" / "Update Template" dabayein taaki user dashboard par ye dikhe.', { id: 'demo-gen', duration: 5000 });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Demo generate nahi ho paya', { id: 'demo-gen' });
        }
        e.target.value = '';
    };

    // Add Shape
    const addShape = (type) => {
        if (!canvas) return;

        let shape;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({
                    left: centerX,
                    top: centerY,
                    width: 150,
                    height: 100,
                    fill: '#ff6b6b',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'rect'
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: centerX,
                    top: centerY,
                    radius: 50,
                    fill: '#4ecdc4',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'circle'
                });
                break;
            case 'triangle':
                shape = new fabric.Triangle({
                    left: centerX,
                    top: centerY,
                    width: 100,
                    height: 100,
                    fill: '#95e1d3',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'triangle'
                });
                break;
            case 'star':
                // Create star using polygon
                const starPoints = createStarPoints(5, 50, 25);
                shape = new fabric.Polygon(starPoints, {
                    left: centerX,
                    top: centerY,
                    fill: '#f9ca24',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'star'
                });
                break;
            case 'heart':
                // Create heart using path
                shape = new fabric.Path('M 272.70141,238.71731 \
                    C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731 \
                    C 152.70146,493.47282 288.63461,528.80461 381.26391,662.02535 \
                    C 468.83815,529.62199 609.82641,489.17075 609.82641,358.71731 \
                    C 609.82641,292.47731 556.06651,238.71731 489.82641,238.71731 \
                    C 441.77851,238.71731 400.42481,267.08774 381.26391,307.90481 \
                    C 362.10311,267.08773 320.74941,238.71731 272.70141,238.71731 z', {
                    left: centerX,
                    top: centerY,
                    fill: '#e74c3c',
                    stroke: '#333',
                    strokeWidth: 2,
                    scaleX: 0.15,
                    scaleY: 0.15,
                    shapeType: 'heart'
                });
                break;
            case 'rounded':
                // Create rounded rectangle
                shape = new fabric.Rect({
                    left: centerX,
                    top: centerY,
                    width: 150,
                    height: 100,
                    rx: 20, // Horizontal radius for rounded corners
                    ry: 20, // Vertical radius for rounded corners
                    fill: '#9b59b6',
                    stroke: '#333',
                    strokeWidth: 2,
                    shapeType: 'rounded'
                });
                break;
            case 'mug-wrap':
                // Authentically curved Mug Smile Path
                const mugPathStr = createMugSmilePath(340, 200, 22);
                shape = new fabric.Path(mugPathStr, {
                    left: centerX,
                    top: centerY,
                    fill: 'rgba(135, 206, 250, 0.25)',
                    stroke: '#38bdf8',
                    strokeWidth: 2,
                    strokeDashArray: [12, 6],
                    shapeType: 'mug-wrap',
                    role: 'placeholder'
                });
                break;
            case 'wave':
                const pathStr = createWavePath(400, 150, 2, 40);
                shape = new fabric.Path(pathStr, {
                    left: centerX,
                    top: centerY,
                    fill: '#6c5ce7', // Nice purple
                    stroke: null,
                    opacity: 0.85,
                    shapeType: 'wave'
                });
                // Add a subtle gradient by default
                shape.set('fill', new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 400, y2: 0 },
                    colorStops: [
                        { offset: 0, color: '#a29bfe' },
                        { offset: 1, color: '#6c5ce7' }
                    ]
                }));
                break;
        }

        if (shape) {
            shape.set({
                originX: 'center',
                originY: 'center',
                // Default props for any shape
                transparentCorners: false,
                cornerColor: '#3498db',
                cornerStyle: 'circle'
            });
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        }
    };

    // Add a full-width mug wrap placeholder (marks role=placeholder + shapeType=mug-wrap)
    const addMugWrapPlaceholder = () => {
        if (!canvas) return;
        const cW = canvas.width;
        const cH = canvas.height;

        // Custom Smile Path for placeholders
        const w = cW * 0.9;
        const h = cH * 0.6;
        const mugPathStr = createMugSmilePath(w, h, 25);

        const wrap = new fabric.Path(mugPathStr, {
            fill: 'rgba(135, 206, 250, 0.18)',
            stroke: '#38bdf8',
            strokeWidth: 3,
            strokeDashArray: [14, 7],
            originX: 'center',
            originY: 'center',
            left: cW / 2,
            top: cH / 2,
            transparentCorners: false,
            cornerColor: '#38bdf8',
            cornerStyle: 'circle',
            shapeType: 'mug-wrap',
            role: 'placeholder',
            id: 'mug_wrap_area_' + Date.now()
        });

        canvas.add(wrap);
        canvas.setActiveObject(wrap);
        setWrapType('mug');
        canvas.renderAll();
        toast.success('Professional Mug Smile Area added! Photo will curve perfectly.');
    };

    // Helper to create a wave path string
    // Width: 400, Height: 100, Waves: 2, Amplitude: 20
    const createWavePath = (w, h, waves = 2, amplitude = 25) => {
        let path = `M 0 ${h / 2} `;
        const waveWidth = w / waves;
        for (let i = 0; i < waves; i++) {
            const x = i * waveWidth;
            path += `Q ${x + waveWidth / 4} ${h / 2 - amplitude} ${x + waveWidth / 2} ${h / 2} `;
            path += `T ${x + waveWidth} ${h / 2} `;
        }
        path += `V ${h} H 0 Z`; // Close the bottom
        return path;
    };

    // Helper to add a faint mug outline to help admin position the wrap
    const addMugBodyHelper = () => {
        if (!canvas) return;
        const cW = canvas.width;
        const cH = canvas.height;
        const w = 360;
        const h = 220;
        const curve = 25;
        const left = (cW - w) / 2;
        const top = (cH - h) / 2;

        // Create a group for the mug outline
        const rim = new fabric.Ellipse({
            left: cW / 2, top: top + curve, rx: w / 2, ry: curve,
            fill: 'transparent', stroke: '#e5e7eb', strokeWidth: 2, originX: 'center', originY: 'center'
        });
        const body = new fabric.Path(`M ${left} ${top + curve} L ${left} ${top + h} Q ${cW / 2} ${top + h + curve * 1.5} ${left + w} ${top + h} L ${left + w} ${top + curve}`, {
            fill: '#f9fafb', stroke: '#e5e7eb', strokeWidth: 2, opacity: 0.5
        });
        const handle = new fabric.Path(`M ${left + w - 5} ${top + 40} Q ${left + w + 50} ${top + h / 2} ${left + w - 5} ${top + h - 40}`, {
            fill: 'transparent', stroke: '#e5e7eb', strokeWidth: 12, strokeCap: 'round', opacity: 0.5
        });

        const mugGroup = new fabric.Group([body, rim, handle], {
            left: cW / 2, top: cH / 2, originX: 'center', originY: 'center',
            selectable: true, id: 'mug_helper_body', role: 'helper'
        });

        canvas.add(mugGroup);
        canvas.sendToBack(mugGroup);
        canvas.renderAll();
        toast.info('Mug Outline added! Use it to position your photo area.');
    };

    // Helper to create the authentic "Mug Smile" curve path
    const createMugSmilePath = (w, h, curve = 25) => {
        // M top-left, Q control-point(center-lower), end(top-right)
        // L side-right-bottom, Q control-point(center-lower), end(bottom-left)
        return `M 0 ${curve} Q ${w / 2} ${curve * 2.5} ${w} ${curve} L ${w} ${h} Q ${w / 2} ${h + curve * 1.5} 0 ${h} Z`;
    };

    // Helper function to create star points
    const createStarPoints = (points, outerRadius, innerRadius) => {
        const step = Math.PI / points;
        const starPoints = [];

        for (let i = 0; i < 2 * points; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * step - Math.PI / 2;
            starPoints.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            });
        }

        return starPoints;
    };

    // --- CUSTOM SHAPE DRAWING LOGIC ---
    const startCustomShape = () => {
        if (!canvas) return;
        setIsDrawingMode(true);
        setDrawPoints([]);
        canvas.discardActiveObject();
        canvas.renderAll();
        toast('Click to add corners. Press Enter or Double-Click to finish. Esc to cancel.', {
            icon: '✏️',
            duration: 5000
        });
    };

    const cancelDrawing = () => {
        const objectsToRemove = canvas.getObjects().filter(obj =>
            obj.id === 'draw_dot' || obj.id === 'draw_line' || obj.id === 'temp_move_line'
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));
        setIsDrawingMode(false);
        setDrawPoints([]);
        canvas.renderAll();
    };

    const finishDrawing = () => {
        const pts = drawPointsRef.current;
        if (pts.length < 3) {
            cancelDrawing();
            return;
        }

        // Calculate bounding box to center points
        let minX = pts[0].x, minY = pts[0].y, maxX = pts[0].x, maxY = pts[0].y;
        pts.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const centerX = minX + (maxX - minX) / 2;
        const centerY = minY + (maxY - minY) / 2;

        // Remove temp drawing objects first
        const objectsToRemove = canvas.getObjects().filter(obj =>
            obj.id === 'draw_dot' || obj.id === 'draw_line' || obj.id === 'temp_move_line'
        );
        objectsToRemove.forEach(obj => canvas.remove(obj));

        if (useSmoothCurve) {
            // Build smooth curve that PASSES THROUGH every selected point (control points computed so curve goes through pts)
            const n = pts.length;
            const rel = pts.map(p => ({ x: p.x - centerX, y: p.y - centerY }));
            let d = `M ${rel[0].x} ${rel[0].y}`;
            for (let i = 0; i < n; i++) {
                const prev = rel[(i - 1 + n) % n];
                const curr = rel[i];
                const next = rel[(i + 1) % n];
                // Control so curve from curr to next is smooth and passes through curr and next
                const ctrlX = curr.x + (next.x - prev.x) / 4;
                const ctrlY = curr.y + (next.y - prev.y) / 4;
                const endX = next.x;
                const endY = next.y;
                d += ` Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
            }
            d += ' Z';

            const path = new fabric.Path(d, {
                left: centerX,
                top: centerY,
                fill: 'rgba(255, 228, 225, 0.6)',
                stroke: '#333',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center',
                shapeType: 'custom',
                transparentCorners: false,
                cornerColor: '#3498db',
                cornerStyle: 'circle',
                id: 'custom_shape_' + Date.now(),
                objectCaching: false
            });
            // Store points (relative to center) and curveControls for manual curve on any edge (top/bottom etc.)
            const relativePoints = pts.map(p => ({ x: p.x - centerX, y: p.y - centerY }));
            path.set('customPoints', relativePoints);
            path.customPoints = relativePoints;
            path.set('curveControls', new Array(pts.length).fill(null));
            path.curveControls = new Array(pts.length).fill(null);
            canvas.add(path);
            canvas.setActiveObject(path);
            toast.success('Rounded curve shape created! Mark as placeholder for photo.');
        } else {
            // Angled polygon
            const normalizedPoints = pts.map(p => ({
                x: p.x - centerX,
                y: p.y - centerY
            }));
            const polygon = new fabric.Polygon(normalizedPoints, {
                left: centerX,
                top: centerY,
                fill: 'rgba(255, 228, 225, 0.6)',
                stroke: '#333',
                strokeWidth: 2,
                shapeType: 'custom',
                originX: 'center',
                originY: 'center',
                transparentCorners: false,
                cornerColor: '#3498db',
                cornerStyle: 'circle',
                id: 'custom_shape_' + Date.now(),
                objectCaching: false
            });
            canvas.add(polygon);
            canvas.setActiveObject(polygon);
            toast.success('Shape bani – exactly aapke selected points par. Edit Points se kisi bhi point se stretch karein.');
        }

        setIsDrawingMode(false);
        setDrawPoints([]);
        drawPointsRef.current = [];
        canvas.renderAll();
    };

    // Simple parser for path d string (M, Q, L, Z) when fabric.util.parsePath not available
    const parsePathDSimple = (d) => {
        const parts = d.trim().replace(/\s+/g, ' ').split(/(?=[MQZL])/);
        const out = [];
        for (const p of parts) {
            const cmd = p.charAt(0);
            const nums = p.slice(1).trim().split(/\s+/).map(Number);
            if (cmd === 'M' && nums.length >= 2) out.push(['M', nums[0], nums[1]]);
            else if (cmd === 'Q' && nums.length >= 4) out.push(['Q', nums[0], nums[1], nums[2], nums[3]]);
            else if (cmd === 'L' && nums.length >= 2) out.push(['L', nums[0], nums[1]]);
            else if (cmd === 'Z') out.push(['Z']);
        }
        return out.length ? out : null;
    };

    // After updating path data, keep shape at same position (avoid jump when curving from top/other side). Call with oldCenter = path.getCenterPoint() *before* setting new path.
    const preservePathCenter = (pathObj, oldCenter) => {
        if (!pathObj || pathObj.type !== 'path' || !oldCenter) return;
        try {
            pathObj.setCoords();
            const newCenter = pathObj.getCenterPoint();
            if (!newCenter) return;
            const dx = oldCenter.x - newCenter.x, dy = oldCenter.y - newCenter.y;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                pathObj.set({ left: pathObj.left + dx, top: pathObj.top + dy });
                pathObj.setCoords();
            }
        } catch (e) { console.warn('preservePathCenter', e); }
    };

    // Build path d string. curveControls[i] = manual curve for segment i→i+1; straightEdges = use L when no curve.
    const buildPathDFromPoints = (customPoints, curveControls, straightEdges) => {
        if (!customPoints || customPoints.length < 3) return null;
        const n = customPoints.length;
        let d = `M ${customPoints[0].x} ${customPoints[0].y}`;
        for (let i = 0; i < n; i++) {
            const prev = customPoints[(i - 1 + n) % n];
            const curr = customPoints[i];
            const next = customPoints[(i + 1) % n];
            const ctrl = curveControls && curveControls[i];
            if (ctrl) {
                d += ` Q ${ctrl.x} ${ctrl.y} ${next.x} ${next.y}`;
            } else if (straightEdges) {
                d += ` L ${next.x} ${next.y}`;
            } else {
                const ctrlX = curr.x + (next.x - prev.x) / 4;
                const ctrlY = curr.y + (next.y - prev.y) / 4;
                d += ` Q ${ctrlX} ${ctrlY} ${next.x} ${next.y}`;
            }
        }
        d += ' Z';
        return d;
    };

    // Get editable points from Path (customPoints or extract from path.path for old templates)
    const getPathEditablePoints = (pathObj) => {
        let pts = pathObj.get('customPoints') || pathObj.customPoints;
        if (pts && pts.length >= 3) return pts;
        const pathData = pathObj.path;
        if (!pathData || !Array.isArray(pathData)) return null;
        pts = [];
        for (let i = 0; i < pathData.length; i++) {
            const cmd = pathData[i];
            if (cmd[0] === 'M' && cmd.length >= 3) pts.push({ x: cmd[1], y: cmd[2] });
            else if ((cmd[0] === 'Q' || cmd[0] === 'q') && cmd.length >= 5) pts.push({ x: cmd[3], y: cmd[4] });
            else if ((cmd[0] === 'L' || cmd[0] === 'l') && cmd.length >= 3) pts.push({ x: cmd[1], y: cmd[2] });
        }
        if (pts.length >= 3) {
            pathObj.set('customPoints', pts);
            pathObj.customPoints = pts;
            return pts;
        }
        return null;
    };

    // Create draggable point handles for polygon or path (corners + mid-edge for polygon so "upper middle" etc. stretch)
    const createPointHandles = (obj) => {
        const handles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
        handles.forEach(h => canvas.remove(h));
        if (obj.type === 'polygon') {
            const points = obj.get('points');
            const transform = obj.calcTransformMatrix();
            // Corner handles (red)
            points.forEach((p, index) => {
                const canvasPt = fabric.util.transformPoint(p, transform);
                const dot = new fabric.Circle({
                    left: canvasPt.x, top: canvasPt.y, radius: 8,
                    fill: '#ff4757', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'point_handle', pointIndex: index, shapeRef: obj, shapeType: 'polygon',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                dot.on('moving', (options) => {
                    const d = options.target;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(d.left, d.top), invMatrix);
                    const newPoints = [...obj.points];
                    newPoints[index] = { x: localPt.x, y: localPt.y };
                    obj.set({ points: newPoints });
                    canvas.requestRenderAll();
                });
                canvas.add(dot);
            });
            // Mid-edge handles (light blue) – drag = manual CURVE on that edge (convert to Path with curved segment)
            const n = points.length;
            for (let i = 0; i < n; i++) {
                const a = points[i];
                const b = points[(i + 1) % n];
                const midLocal = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                const canvasMid = fabric.util.transformPoint(midLocal, transform);
                const midDot = new fabric.Circle({
                    left: canvasMid.x, top: canvasMid.y, radius: 7,
                    fill: '#3498db', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'mid_point_handle', segmentIndex: i, shapeRef: obj, shapeType: 'polygon',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                midDot.on('mouse:up', (options) => {
                    const target = options.target;
                    if (!canvas.getObjects().includes(obj)) return;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(target.left, target.top), invMatrix);
                    const polyPoints = obj.get('points').map(p => ({ x: p.x, y: p.y }));
                    const curveCtrls = new Array(n).fill(null);
                    curveCtrls[i] = { x: localPt.x, y: localPt.y };
                    const d = buildPathDFromPoints(polyPoints, curveCtrls, true);
                    if (!d) return;
                    try {
                        const oldHandles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
                        oldHandles.forEach(h => canvas.remove(h));
                        const path = new fabric.Path(d, {
                            left: obj.left,
                            top: obj.top,
                            originX: 'center',
                            originY: 'center',
                            fill: obj.fill || 'rgba(255, 228, 225, 0.6)',
                            stroke: obj.stroke || '#333',
                            strokeWidth: obj.strokeWidth || 2,
                            shapeType: obj.shapeType || 'custom',
                            role: obj.role,
                            id: obj.id || 'path_from_poly_' + Date.now(),
                            angle: obj.angle || 0,
                            objectCaching: false
                        });
                        path.set('customPoints', polyPoints);
                        path.customPoints = polyPoints;
                        path.set('curveControls', curveCtrls);
                        path.curveControls = curveCtrls;
                        path.set('straightEdges', true);
                        path.straightEdges = true;
                        path.dirty = true;
                        canvas.remove(obj);
                        canvas.add(path);
                        path.setCoords();
                        setSelectedObject(path);
                        editingShapeRef.current = path;
                        createPointHandles(path);
                        canvas.requestRenderAll();
                        toast.success('Curve bana di! Ab kisi bhi point ko drag karke curve badal sakte hain.');
                    } catch (e) {
                        console.warn('Polygon to Path', e);
                    }
                });
                canvas.add(midDot);
            }
        } else if (obj.type === 'path') {
            const pts = obj.get('customPoints') || obj.customPoints || getPathEditablePoints(obj);
            if (!pts || pts.length < 3) return;
            const transform = obj.calcTransformMatrix();
            pts.forEach((p, index) => {
                const canvasPt = fabric.util.transformPoint(new fabric.Point(p.x, p.y), transform);
                const dot = new fabric.Circle({
                    left: canvasPt.x, top: canvasPt.y, radius: 8,
                    fill: '#ff4757', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'point_handle', pointIndex: index, shapeRef: obj, shapeType: 'path',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                dot.on('moving', (options) => {
                    const target = options.target;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(target.left, target.top), invMatrix);
                    const newPoints = [...(obj.get('customPoints') || obj.customPoints || pts)];
                    newPoints[index] = { x: localPt.x, y: localPt.y };
                    obj.set('customPoints', newPoints);
                    obj.customPoints = newPoints;
                    const curveCtrls = obj.get('curveControls') || obj.curveControls;
                    const straight = obj.get('straightEdges') || false;
                    const d = buildPathDFromPoints(newPoints, curveCtrls, straight);
                    if (d) {
                        try {
                            const oldCenter = obj.getCenterPoint();
                            const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                            if (parsed) {
                                obj.set('path', parsed);
                                if (obj.path !== undefined) obj.path = parsed;
                                obj.dirty = true;
                            }
                            obj.setCoords();
                            preservePathCenter(obj, oldCenter);
                        } catch (e) { console.warn('Path update', e); }
                    }
                    canvas.requestRenderAll();
                });
                canvas.add(dot);
            });
            // Mid-edge handles for path (light blue) – drag = manual CURVE on that edge (no new point, smooth curve)
            const curveCtrls = obj.get('curveControls') || obj.curveControls;
            if (!curveCtrls || curveCtrls.length !== pts.length) {
                const arr = new Array(pts.length).fill(null);
                obj.set('curveControls', arr);
                obj.curveControls = arr;
            }
            const ctrls = obj.get('curveControls') || obj.curveControls;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const midLocal = ctrls[i] ? ctrls[i] : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                const canvasMid = fabric.util.transformPoint(new fabric.Point(midLocal.x, midLocal.y), transform);
                const midDot = new fabric.Circle({
                    left: canvasMid.x, top: canvasMid.y, radius: 7,
                    fill: '#3498db', stroke: 'white', strokeWidth: 2,
                    originX: 'center', originY: 'center',
                    hasBorders: false, hasControls: false,
                    id: 'mid_point_handle', segmentIndex: i, shapeRef: obj, shapeType: 'path',
                    hoverCursor: 'move', selectable: true, evented: true
                });
                midDot.on('moving', (options) => {
                    const target = options.target;
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    const localPt = fabric.util.transformPoint(new fabric.Point(target.left, target.top), invMatrix);
                    const curveControlsCopy = [...(obj.get('curveControls') || obj.curveControls || ctrls)];
                    curveControlsCopy[i] = { x: localPt.x, y: localPt.y };
                    obj.set('curveControls', curveControlsCopy);
                    obj.curveControls = curveControlsCopy;
                    const currentPts = obj.get('customPoints') || obj.customPoints || pts;
                    const straight = obj.get('straightEdges') || false;
                    const d = buildPathDFromPoints(currentPts, curveControlsCopy, straight);
                    if (d) {
                        try {
                            const oldCenter = obj.getCenterPoint();
                            const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                            if (parsed) {
                                obj.set('path', parsed);
                                if (obj.path !== undefined) obj.path = parsed;
                                obj.dirty = true;
                            }
                            obj.setCoords();
                            preservePathCenter(obj, oldCenter);
                        } catch (e) { console.warn('Path update', e); }
                        canvas.requestRenderAll();
                    }
                });
                midDot.on('mouse:up', () => {
                    createPointHandles(obj);
                    canvas.requestRenderAll();
                });
                canvas.add(midDot);
            }
        }
        canvas.requestRenderAll();
    };

    // Convert Fabric Rect to Polygon (4 points) so we can edit points / stretch from any edge
    const rectToPolygon = (rect) => {
        const w = (rect.width * (rect.scaleX || 1)) / 2;
        const h = (rect.height * (rect.scaleY || 1)) / 2;
        const points = [
            { x: -w, y: -h },
            { x: w, y: -h },
            { x: w, y: h },
            { x: -w, y: h }
        ];
        const poly = new fabric.Polygon(points, {
            left: rect.left,
            top: rect.top,
            originX: 'center',
            originY: 'center',
            fill: rect.fill || 'rgba(255, 228, 225, 0.6)',
            stroke: rect.stroke || '#333',
            strokeWidth: rect.strokeWidth || 2,
            shapeType: rect.shapeType || 'rect',
            role: rect.role,
            id: rect.id || 'poly_from_rect_' + Date.now()
        });
        if (rect.angle) poly.set('angle', rect.angle);
        return poly;
    };

    // Edit shape points: Polygon, Path, or Rect (Rect is converted to Polygon so every point can stretch).
    const editShapePoints = () => {
        let obj = selectedObject;
        if (!obj) return;
        if (obj.type === 'rect') {
            const poly = rectToPolygon(obj);
            canvas.remove(obj);
            canvas.add(poly);
            poly.setCoords();
            canvas.setActiveObject(poly);
            setSelectedObject(poly);
            obj = poly;
        }
        if (obj.type !== 'polygon' && obj.type !== 'path') return;

        setIsEditingPoints(!isEditingPoints);

        if (!isEditingPoints) {
            obj.set({ selectable: false, evented: true, opacity: 0.6 }); // evented: true so line pe click/drag se curve ban sake
            editingShapeRef.current = obj;
            canvas.discardActiveObject();
            if (obj.type === 'path') {
                const pts = getPathEditablePoints(obj);
                if (!pts || pts.length < 3) {
                    toast.error('Is path me edit ke liye points nahi mile. Naya free-draw shape bana kar try karein.');
                    obj.set({ selectable: true, evented: true, opacity: 1 });
                    setIsEditingPoints(false);
                    return;
                }
            }
            createPointHandles(obj);
            toast('Line ko bhi drag karein: kisi line pe click karke upar/neeche/left/right kheenchien – curve ban jayega (screenshot jaisa). Red/blue point bhi drag kar sakte hain.', { icon: '🎯', duration: 6000 });
        } else {
            const handles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
            handles.forEach(h => canvas.remove(h));
            if (segmentOverlayRef.current && canvas.getObjects().includes(segmentOverlayRef.current)) {
                canvas.remove(segmentOverlayRef.current);
            }
            segmentOverlayRef.current = null;
            hoveredSegmentRef.current = -1;
            canvas.defaultCursor = 'default';
            obj.set({ selectable: true, evented: true, opacity: 1 });
            obj.setCoords();
            editingShapeRef.current = null;
            canvas.requestRenderAll();
        }
    };

    // Double-click on a line segment to add a new point (stretch from middle)
    const addPointOnSegment = (pointer) => {
        const obj = editingShapeRef.current;
        if (!obj || !canvas) return;
        const threshold = 20;

        if (obj.type === 'polygon') {
            const points = obj.get('points');
            const transform = obj.calcTransformMatrix();
            const canvasPts = points.map(p => fabric.util.transformPoint(p, transform));
            let bestDist = threshold;
            let insertIndex = -1;
            let newLocal = null;
            for (let i = 0; i < canvasPts.length; i++) {
                const a = canvasPts[i];
                const b = canvasPts[(i + 1) % canvasPts.length];
                const d = distToSegment(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
                if (d < bestDist) {
                    bestDist = d;
                    insertIndex = i + 1;
                    const t = Math.max(0, Math.min(1, ((pointer.x - a.x) * (b.x - a.x) + (pointer.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2)));
                    const midX = a.x + t * (b.x - a.x);
                    const midY = a.y + t * (b.y - a.y);
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    newLocal = fabric.util.transformPoint(new fabric.Point(midX, midY), invMatrix);
                }
            }
            if (insertIndex >= 0 && newLocal) {
                const newPoints = [...obj.points];
                newPoints.splice(insertIndex, 0, { x: newLocal.x, y: newLocal.y });
                obj.set({ points: newPoints });
                createPointHandles(obj);
                toast('Naya point add ho gaya. Ab ise stretch kar sakte hain.');
            }
        } else if (obj.type === 'path') {
            const pts = obj.get('customPoints') || obj.customPoints;
            if (!pts || pts.length < 3) return;
            const transform = obj.calcTransformMatrix();
            const canvasPts = pts.map(p => fabric.util.transformPoint(new fabric.Point(p.x, p.y), transform));
            let bestDist = threshold;
            let insertIndex = -1;
            let newLocal = null;
            for (let i = 0; i < canvasPts.length; i++) {
                const a = canvasPts[i];
                const b = canvasPts[(i + 1) % canvasPts.length];
                const d = distToSegment(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
                if (d < bestDist) {
                    bestDist = d;
                    insertIndex = i + 1;
                    const t = Math.max(0, Math.min(1, ((pointer.x - a.x) * (b.x - a.x) + (pointer.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2)));
                    const midX = a.x + t * (b.x - a.x);
                    const midY = a.y + t * (b.y - a.y);
                    const invMatrix = fabric.util.invertTransform(obj.calcTransformMatrix());
                    newLocal = fabric.util.transformPoint(new fabric.Point(midX, midY), invMatrix);
                }
            }
            if (insertIndex >= 0 && newLocal) {
                const newPoints = [...pts];
                newPoints.splice(insertIndex, 0, { x: newLocal.x, y: newLocal.y });
                obj.set('customPoints', newPoints);
                obj.customPoints = newPoints;
                const d = buildPathDFromPoints(newPoints);
                if (d) {
                    try {
                        const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                        if (parsed) obj.set('path', parsed);
                        obj.setCoords();
                    } catch (e) { console.warn(e); }
                }
                createPointHandles(obj);
                toast('Naya point add ho gaya. Ab ise stretch kar sakte hain.');
            }
        }
    };

    function distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
        const projX = x1 + t * dx, projY = y1 + t * dy;
        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    }
    addPointOnSegmentRef.current = addPointOnSegment;

    // When editing points, double-click on a line segment to add a new point (stretch from middle)
    useEffect(() => {
        if (!canvas || !isEditingPoints) return;
        const handleDblclick = (opt) => {
            if (opt.target && (opt.target.id === 'point_handle' || opt.target.id === 'mid_point_handle')) return;
            const pointer = canvas.getPointer(opt.e);
            addPointOnSegmentRef.current(pointer);
        };
        canvas.on('mouse:dblclick', handleDblclick);
        return () => { canvas.off('mouse:dblclick', handleDblclick); };
    }, [canvas, isEditingPoints]);

    // Drag line to curve (screenshot behaviour): line pe click karke upar/neeche/left/right kheenchien to curve ban jaye
    useEffect(() => {
        if (!canvas || !isEditingPoints) return;
        const getCanvasPoints = (shape) => {
            const transform = shape.calcTransformMatrix();
            if (shape.type === 'path') {
                const pts = shape.get('customPoints') || shape.customPoints || getPathEditablePoints(shape);
                return (pts || []).map(p => fabric.util.transformPoint(new fabric.Point(p.x, p.y), transform));
            }
            if (shape.type === 'polygon') {
                return (shape.get('points') || []).map(p => fabric.util.transformPoint(p, transform));
            }
            return [];
        };
        const findSegmentAt = (shape, pointer) => {
            const pts = getCanvasPoints(shape);
            if (pts.length < 2) return -1;
            let best = 25, idx = -1;
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                const b = pts[(i + 1) % pts.length];
                const d = distToSegment(pointer.x, pointer.y, a.x, a.y, b.x, b.y);
                if (d < best) { best = d; idx = i; }
            }
            return idx;
        };
        const removeSegmentOverlay = () => {
            if (segmentOverlayRef.current && canvas.getObjects().includes(segmentOverlayRef.current)) {
                canvas.remove(segmentOverlayRef.current);
            }
            segmentOverlayRef.current = null;
        };
        const drawSegmentOverlay = (shape, segIndex, color, isCurve = false, controlPt = null) => {
            removeSegmentOverlay();
            const pts = getCanvasPoints(shape);
            if (segIndex < 0 || segIndex >= pts.length) return;
            const a = pts[segIndex];
            const b = pts[(segIndex + 1) % pts.length];
            let obj;
            if (isCurve && controlPt) {
                const transform = shape.calcTransformMatrix();
                const c = fabric.util.transformPoint(new fabric.Point(controlPt.x, controlPt.y), transform);
                const d = `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
                obj = new fabric.Path(d, { stroke: color, strokeWidth: 5, fill: 'transparent', selectable: false, evented: false, id: 'segment_highlight' });
            } else {
                obj = new fabric.Line([a.x, a.y, b.x, b.y], { stroke: color, strokeWidth: 5, selectable: false, evented: false, id: 'segment_highlight' });
            }
            canvas.add(obj);
            segmentOverlayRef.current = obj;
        };
        const handleMouseDown = (opt) => {
            if (bendingSegmentRef.current !== null) return;
            if (opt.target && (opt.target.id === 'point_handle' || opt.target.id === 'mid_point_handle')) return;
            const shape = editingShapeRef.current;
            if (!shape || opt.target !== shape) return;
            const pointer = canvas.getPointer(opt.e);
            const seg = findSegmentAt(shape, pointer);
            if (seg < 0) return;
            const invMatrix = fabric.util.invertTransform(shape.calcTransformMatrix());
            const localPt = fabric.util.transformPoint(new fabric.Point(pointer.x, pointer.y), invMatrix);
            if (shape.type === 'polygon') {
                const polyPoints = shape.get('points').map(p => ({ x: p.x, y: p.y }));
                const curveCtrls = new Array(polyPoints.length).fill(null);
                curveCtrls[seg] = { x: localPt.x, y: localPt.y };
                const d = buildPathDFromPoints(polyPoints, curveCtrls, true);
                if (!d) return;
                try {
                    const oldHandles = canvas.getObjects().filter(o => o.id === 'point_handle' || o.id === 'mid_point_handle');
                    oldHandles.forEach(h => canvas.remove(h));
                    const path = new fabric.Path(d, {
                        left: shape.left, top: shape.top, originX: 'center', originY: 'center',
                        fill: shape.fill || 'rgba(255, 228, 225, 0.6)', stroke: shape.stroke || '#333', strokeWidth: shape.strokeWidth || 2,
                        shapeType: shape.shapeType || 'custom', role: shape.role, id: shape.id || 'path_from_poly_' + Date.now(), angle: shape.angle || 0, objectCaching: false
                    });
                    path.set('customPoints', polyPoints);
                    path.customPoints = polyPoints;
                    path.set('curveControls', curveCtrls);
                    path.curveControls = curveCtrls;
                    path.set('straightEdges', true);
                    path.straightEdges = true;
                    path.dirty = true;
                    canvas.remove(shape);
                    canvas.add(path);
                    path.setCoords();
                    setSelectedObject(path);
                    editingShapeRef.current = path;
                    bendingSegmentRef.current = seg;
                    canvas.defaultCursor = 'ns-resize'; // stretch icon jab line move ho
                    createPointHandles(path);
                    canvas.requestRenderAll();
                } catch (e) { console.warn('Polygon to path on line drag', e); return; }
            } else {
                let ctrls = shape.get('curveControls') || shape.curveControls;
                if (!ctrls || ctrls.length !== (shape.get('customPoints') || shape.customPoints || []).length) {
                    ctrls = new Array((shape.get('customPoints') || shape.customPoints || []).length).fill(null);
                    shape.set('curveControls', ctrls);
                    shape.curveControls = ctrls;
                }
                const curveControlsCopy = [...ctrls];
                curveControlsCopy[seg] = { x: localPt.x, y: localPt.y };
                shape.set('curveControls', curveControlsCopy);
                shape.curveControls = curveControlsCopy;
                const pts = shape.get('customPoints') || shape.customPoints || [];
                const straight = shape.get('straightEdges') || false;
                const d = buildPathDFromPoints(pts, curveControlsCopy, straight);
                if (d) {
                    try {
                        const oldCenter = shape.getCenterPoint();
                        const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                        if (parsed) { shape.set('path', parsed); if (shape.path !== undefined) shape.path = parsed; shape.dirty = true; }
                        shape.setCoords();
                        preservePathCenter(shape, oldCenter);
                    } catch (e) { console.warn('Path update', e); }
                }
                bendingSegmentRef.current = seg;
                canvas.defaultCursor = 'ns-resize'; // stretch icon jab line move ho
                canvas.requestRenderAll();
            }
        };
        const handleMouseMove = (opt) => {
            const shape = editingShapeRef.current;
            const pointer = canvas.getPointer(opt.e);

            if (bendingSegmentRef.current !== null) {
                if (!shape || shape.type !== 'path') return;
                canvas.defaultCursor = 'ns-resize';
                const invMatrix = fabric.util.invertTransform(shape.calcTransformMatrix());
                const localPt = fabric.util.transformPoint(new fabric.Point(pointer.x, pointer.y), invMatrix);
                const seg = bendingSegmentRef.current;
                const curveControlsCopy = [...(shape.get('curveControls') || shape.curveControls || [])];
                curveControlsCopy[seg] = { x: localPt.x, y: localPt.y };
                shape.set('curveControls', curveControlsCopy);
                shape.curveControls = curveControlsCopy;
                const pts = shape.get('customPoints') || shape.customPoints || [];
                const straight = shape.get('straightEdges') || false;
                const d = buildPathDFromPoints(pts, curveControlsCopy, straight);
                if (d) {
                    try {
                        const oldCenter = shape.getCenterPoint();
                        const parsed = typeof fabric.util.parsePath === 'function' ? fabric.util.parsePath(d) : parsePathDSimple(d);
                        if (parsed) { shape.set('path', parsed); if (shape.path !== undefined) shape.path = parsed; shape.dirty = true; }
                        shape.setCoords();
                        preservePathCenter(shape, oldCenter);
                    } catch (e) { console.warn('Path update', e); }
                }
                drawSegmentOverlay(shape, seg, 'rgba(255, 152, 0, 0.95)', true, curveControlsCopy[seg]);
                canvas.requestRenderAll();
                return;
            }

            if (!shape) {
                removeSegmentOverlay();
                hoveredSegmentRef.current = -1;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
                return;
            }
            const seg = findSegmentAt(shape, pointer);
            if (seg >= 0) {
                if (seg !== hoveredSegmentRef.current) {
                    drawSegmentOverlay(shape, seg, 'rgba(33, 150, 243, 0.95)', false);
                    hoveredSegmentRef.current = seg;
                }
                canvas.defaultCursor = 'ns-resize';
            } else {
                if (hoveredSegmentRef.current >= 0) {
                    removeSegmentOverlay();
                    hoveredSegmentRef.current = -1;
                }
                canvas.defaultCursor = 'default';
            }
            canvas.requestRenderAll();
        };
        const handleMouseUp = () => {
            if (bendingSegmentRef.current !== null) {
                bendingSegmentRef.current = null;
                const shape = editingShapeRef.current;
                if (shape && shape.type === 'path') createPointHandles(shape);
                removeSegmentOverlay();
                hoveredSegmentRef.current = -1;
                canvas.defaultCursor = 'default';
                canvas.requestRenderAll();
            }
        };
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);
        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [canvas, isEditingPoints]);

    // --- END CUSTOM SHAPE LOGIC ---

    // Add Text
    const addText = () => {
        if (!canvas) return;

        const text = new fabric.IText('Your Text', {
            left: canvas.width / 2,
            top: canvas.height / 2,
            fontFamily: 'Arial',
            fill: '#000000',
            fontSize: 40,
            originX: 'center',
            originY: 'center'
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    };

    // Add Placeholder Area
    const addPlaceholder = () => {
        if (!canvas) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const rect = new fabric.Rect({
            left: centerX,
            top: centerY,
            width: 200,
            height: 250,
            fill: 'rgba(99, 102, 241, 0.1)',
            stroke: '#6366f1',
            strokeWidth: 2,
            strokeDashArray: [8, 4],
            originX: 'center',
            originY: 'center',
            role: 'placeholder',
            shapeType: 'rect',
            id: 'placeholder_' + Date.now()
        });

        canvas.add(rect);
        canvas.setActiveObject(rect);
        canvas.renderAll();
    };

    // Upload Graphic/Clipart
    const handleGraphicUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (f) => {
            const localUrl = f.target.result;
            const img = await fabric.FabricImage.fromURL(localUrl);

            img.scaleToWidth(150);
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center'
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();

            // Note: If graphics also need server-side persistence independent of canvas settings, 
            // you could add axios upload here. Currently, Fabric's toJSON handles the dataUrl or URL.
        };
        reader.readAsDataURL(file);
    };

    // Layer Controls
    const bringToFront = () => {
        if (!selectedObject) return;
        canvas.bringObjectToFront(selectedObject);
        canvas.renderAll();
    };

    const sendToBack = () => {
        if (!selectedObject) return;
        canvas.sendObjectToBack(selectedObject);
        canvas.renderAll();
    };

    const deleteObject = () => {
        if (!selectedObject) return;

        // If it's the background image, clear state too
        if (selectedObject.id === 'background_image') {
            setBackgroundImageUrl('');
        }

        canvas.remove(selectedObject);
        setSelectedObject(null);
        canvas.renderAll();
    };

    // Set selected object as background
    const setAsBackground = () => {
        if (!selectedObject) return;

        // Try to get URL
        const url = selectedObject.src ||
            (selectedObject.getSrc && selectedObject.getSrc()) ||
            (selectedObject._element && selectedObject._element.src);

        if (!url) return toast.error("Could not determine image source");

        // Confirm if it's a data URL
        if (url.startsWith('data:')) {
            toast.error("Please wait for background sync or upload via the 'Background' tab for persistent Cloudinary storage.");
            // We can still proceed if the user insists, but state won't have the Cloudinary URL yet
        }

        // Set as background
        selectedObject.set({
            id: 'background_image',
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true
        });
        selectedObject.id = 'background_image';

        canvas.sendObjectToBack(selectedObject);
        setBackgroundImageUrl(url);
        canvas.renderAll();
        setSelectedObject(null);
        toast.success("Object set as background image!");
    };

    // Object Property Updates
    const updateProperty = (prop, value) => {
        if (!selectedObject) return;

        // Use set for Fabric internal state
        selectedObject.set(prop, value);

        // Explicitly set on instance as well for serialization safety in Fabric 6
        const criticalProps = ['role', 'id', 'locked', 'shapeType', 'selectable', 'evented'];
        if (criticalProps.includes(prop)) {
            selectedObject[prop] = value;
        }

        // Update local object properties state for UI reactivity
        setObjProps(prev => ({
            ...prev,
            width: Math.round(selectedObject.getScaledWidth()),
            height: Math.round(selectedObject.getScaledHeight()),
            angle: Math.round(selectedObject.angle || 0),
            fill: selectedObject.fill || '#000000',
            fontSize: selectedObject.fontSize || 40,
            fontFamily: selectedObject.fontFamily || 'Arial',
            locked: selectedObject.locked || false,
            role: selectedObject.role || null,
            [prop]: value
        }));

        canvas.renderAll();
    };

    // Save Template
    const saveTemplate = async () => {
        if (!name) return alert('Please enter a template name');

        // Find background image on canvas if state is somehow out of sync
        let finalBgUrl = backgroundImageUrl;
        if (!finalBgUrl && canvas) {
            const bgObj = canvas.getObjects().find(obj => obj.id === 'background_image' || obj.role === 'background');
            if (bgObj) {
                // VERY ROBUST FALLBACK FOR FABRIC 6
                finalBgUrl = bgObj.src ||
                    (bgObj.getSrc && bgObj.getSrc()) ||
                    (bgObj._element && bgObj._element.src) ||
                    (bgObj.toObject && bgObj.toObject(['src']).src);
            }
        }

        if (!finalBgUrl) {
            return alert('Please upload a background image using the "Background" tab.\n\nNote: If you uploaded it as a graphic, select the image and click "📷 Set as Background" in the property panel.');
        }
        if (!canvas) return;

        try {
            console.log('--- PRE-SAVE CHECK ---');
            const allObjs = canvas.getObjects();
            console.log('Total Objects:', allObjs.length);
            allObjs.forEach((o, i) => console.log(`Object ${i}:`, o.type, 'Role:', o.role));

            // 1. Temporarily hide design-only elements for a clean preview
            const placeholders = allObjs.filter(obj => obj.role === 'placeholder');
            console.log('Detected Placeholders:', placeholders.length);

            if (placeholders.length === 0) {
                console.warn('WARNING: No placeholders detected! Masking will NOT work.');
            }

            placeholders.forEach(ph => ph.set('visible', false));
            canvas.discardActiveObject(); // Deselect everything
            canvas.renderAll();

            // Generate preview image
            const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.5 });

            // 2. Restore visibility for continued editing
            placeholders.forEach(ph => ph.set('visible', true));
            canvas.renderAll();

            setIsSaving(true);
            setUploadProgress(0);

            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], 'preview.png', { type: 'image/png' });

            // Upload preview to Cloudinary
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await axios.post(`${API_BASE}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const previewImageUrl = uploadRes.data.url;

            // Extract coordinates correctly accounting for scaling/centering/angle
            // For saving, we use the first placeholder as the primary print area
            const primaryPlaceholder = placeholders[0];
            const printArea = primaryPlaceholder ? {
                x: primaryPlaceholder.left - (primaryPlaceholder.getScaledWidth() / 2),
                y: primaryPlaceholder.top - (primaryPlaceholder.getScaledHeight() / 2),
                width: primaryPlaceholder.getScaledWidth(),
                height: primaryPlaceholder.getScaledHeight(),
                angle: primaryPlaceholder.angle || 0
            } : { x: 100, y: 200, width: 250, height: 200 };

            // Save template data (category = selected dropdown value so template shows under correct category)
            // CRITICAL: Before toJSON, force-set shapeType on all placeholders so it serializes correctly.
            // Fabric.js only serializes custom props if they appear in the custom prop list AND are set via .set()
            const allPlaceholders = canvas.getObjects().filter(o => o.role === 'placeholder');
            allPlaceholders.forEach(ph => {
                // Auto-detect shapeType if missing
                if (!ph.shapeType) {
                    let autoType = 'rect';
                    if (ph.type === 'circle') autoType = 'circle';
                    else if (ph.type === 'triangle') autoType = 'triangle';
                    else if (ph.type === 'polygon') {
                        autoType = (ph.points && ph.points.length === 10) ? 'star' : 'polygon';
                    }
                    else if (ph.type === 'path') autoType = 'heart';
                    else if (ph.type === 'rect') autoType = ph.rx ? 'rounded' : 'rect';
                    ph.set('shapeType', autoType);
                    ph.shapeType = autoType;
                }
                // Ensure ID is set
                if (!ph.id) {
                    const newId = 'placeholder_' + Date.now() + '_' + Math.random().toString(36).slice(2);
                    ph.set('id', newId);
                    ph.id = newId;
                }
            });

            const templateData = {
                name,
                category: category || (categories[0]?.name ?? ''),
                basePrice: price,
                packingCharges: packingCharges || 0,   // ✅ NEW
                shippingCharges: shippingCharges || 0, // ✅ NEW
                previewImage: previewImageUrl,
                demoImageUrl: demoImageUrl || undefined,
                backgroundImageUrl: finalBgUrl,
                printArea: printArea,
                variantNo: variantNo,
                productSize: productSize,
                printSize: printSize,
                moq: moq,
                wrapType: wrapType || 'none',
                canvasSettings: canvas.toJSON(['role', 'locked', 'shapeType', 'id', 'selectable', 'hoverCursor', 'customPoints', 'curveControls', 'straightEdges'])
            };


            console.log('SAVING TEMPLATE JSON:', JSON.stringify(templateData.canvasSettings, null, 2));

            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            };

            if (isEdit) {
                await axios.put(`${API_BASE}/templates/${id}`, templateData, config);
                toast.success('Template Updated Successfully!');
            } else {
                await axios.post(`${API_BASE}/templates`, templateData, config);
                toast.success('Template Saved Successfully!');
            }

            navigate('/admin');

        } catch (error) {
            console.error('SAVE ERROR:', error);
            const errMsg = error.response?.data?.message || error.message;
            toast.error(`Error saving template: ${errMsg}`);
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#F8FAFC]">
            {/* Top Toolbar - More Premium Header */}
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        title="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">
                            {isEdit ? 'Edit Template' : 'Template Designer'}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider font-mono">
                            {isEdit ? `ID: ${id}` : 'Create New Design Pattern'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        onClick={() => navigate('/admin')}
                        disabled={isSaving}
                    >
                        <FaTimes className="text-xs" /> Cancel
                    </button>

                    <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

                    <button
                        className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 active:scale-95 transition-all font-bold text-sm ${(isSaving || isUploadingBg) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={saveTemplate}
                        disabled={isSaving || isUploadingBg}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                <span>Saving {uploadProgress}%</span>
                            </div>
                        ) : isUploadingBg ? (
                            <div className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                <span>Uploading Background...</span>
                            </div>
                        ) : (
                            <>
                                <FaSave className="text-sm" />
                                <span>{isEdit ? 'Update Template' : 'Save Template'}</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar - Refined Design */}
                <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-5 space-y-6">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <FaCog className="text-sm" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-700">Template Base Info</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Template Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-3 rounded-xl text-sm transition-all placeholder:text-slate-300 font-medium"
                                            placeholder="Enter design name..."
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
                                            <select
                                                className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-3 rounded-xl text-sm transition-all font-medium appearance-none"
                                                value={category}
                                                onChange={e => setCategory(e.target.value)}
                                            >
                                                {categories.length > 0 ? (
                                                    categories.map(cat => (
                                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                                    ))
                                                ) : (
                                                    <option value="">{category ? category : 'Loading...'}</option>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Base Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-3 pl-7 rounded-xl text-sm transition-all font-bold"
                                                    placeholder="0"
                                                    value={price}
                                                    onChange={e => setPrice(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Packing & Shipping Charges ─────────────────────── */}
                                    <div className="mt-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest m-0">💰 Charges (Set by Admin)</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Packing Charges (per unit)</label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={packingCharges === 0}
                                                            onChange={(e) => setPackingCharges(e.target.checked ? 0 : 10)}
                                                            className="w-3.5 h-3.5 rounded accent-indigo-600"
                                                        />
                                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Free</span>
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={packingCharges === 0}
                                                        className={`w-full border-0 focus:ring-2 focus:ring-indigo-500 p-3 pl-7 rounded-xl text-sm transition-all font-bold ${packingCharges === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-50'}`}
                                                        placeholder="0"
                                                        value={packingCharges}
                                                        onChange={e => setPackingCharges(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shipping Charges (flat)</label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={shippingCharges === 0}
                                                            onChange={(e) => setShippingCharges(e.target.checked ? 0 : 40)}
                                                            className="w-3.5 h-3.5 rounded accent-indigo-600"
                                                        />
                                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Free</span>
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={shippingCharges === 0}
                                                        className={`w-full border-0 focus:ring-2 focus:ring-indigo-500 p-3 pl-7 rounded-xl text-sm transition-all font-bold ${shippingCharges === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-50'}`}
                                                        placeholder="0"
                                                        value={shippingCharges}
                                                        onChange={e => setShippingCharges(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-indigo-400 mt-3 font-medium text-center">Final Price = (Base + Packing) × Qty + Shipping</p>
                                    </div>

                                    <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FaMagic className="text-4xl text-amber-600" />
                                        </div>
                                        <h4 className="font-bold text-xs text-amber-800 mb-1 flex items-center gap-2">
                                            <FaEye className="text-sm" /> Smart Demo Preview
                                        </h4>
                                        <p className="text-[10px] text-amber-700/80 leading-relaxed mb-3">
                                            Upload a sample photo (e.g. customer's face) to see how it looks inside the template areas.
                                        </p>

                                        {!demoImageUrl ? (
                                            <button
                                                type="button"
                                                className="w-full bg-white text-amber-600 py-2.5 rounded-xl border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                                                onClick={() => demoImageInputRef.current?.click()}
                                            >
                                                <FaCloudUploadAlt /> Choose Sample
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-white/60 p-2 rounded-xl border border-amber-200/50">
                                                <div className="relative h-12 w-12 rounded-lg overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                                    <img src={demoImageUrl} alt="Demo" className="h-full w-full object-cover" />
                                                    <button
                                                        type="button"
                                                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600"
                                                        onClick={() => setDemoImageUrl('')}
                                                    >
                                                        <FaTimes className="text-[8px]" />
                                                    </button>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-amber-900 truncate">Sample attached</p>
                                                    <p className="text-[9px] text-amber-600">Visible in dashoard</p>
                                                </div>
                                            </div>
                                        )}
                                        <input type="file" ref={demoImageInputRef} hidden accept="image/*" onChange={handleDemoImageUpload} />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-200 text-slate-700 rounded-lg">
                                        <FaLayerGroup className="text-sm" />
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-700">Product Specs</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Variant No</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-100 focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl text-xs transition-all font-bold"
                                            placeholder="1.1"
                                            value={variantNo}
                                            onChange={e => setVariantNo(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">MOQ</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-100 focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl text-xs transition-all font-bold text-center"
                                            value={moq}
                                            onChange={e => setMoq(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Product Size</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-100 focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl text-xs transition-all font-medium"
                                            placeholder="e.g., 11 Oz / 750 ML"
                                            value={productSize}
                                            onChange={e => setProductSize(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Print Area</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white border border-slate-100 focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl text-xs transition-all font-medium"
                                            placeholder="e.g., 19.6 x 9 cm"
                                            value={printSize}
                                            onChange={e => setPrintSize(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Tool Tabs - Modern Segmented Control */}
                            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
                                {[
                                    { id: 'background', icon: FaImage, label: 'Bg' },
                                    { id: 'shapes', icon: FaShapes, label: 'Shape' },
                                    { id: 'text', icon: FaFont, label: 'Text' },
                                    { id: 'elements', icon: FaCubes, label: 'Icons' },
                                    { id: 'mug', icon: FaCoffee, label: '3D' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <tab.icon className={`text-sm mb-1 ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`} />
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-[200px] bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                                {activeTab === 'background' && (
                                    <div className="space-y-4">
                                        <button
                                            className="w-full bg-white border-2 border-dashed border-slate-200 text-slate-500 p-8 rounded-2xl hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-3 group"
                                            onClick={() => bgImageInputRef.current.click()}
                                        >
                                            <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors">
                                                <FaCloudUploadAlt className="text-2xl" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">Select Product Image</span>
                                        </button>
                                        <input type="file" ref={bgImageInputRef} hidden onChange={handleBackgroundUpload} accept="image/*" />
                                        {backgroundImageUrl && (
                                            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 animate-fadeIn transition-all">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Background Ready</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'shapes' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'rect', label: 'Box', icon: '⬜' },
                                                { id: 'rounded', label: 'Round', icon: '🔲' },
                                                { id: 'circle', label: 'Circle', icon: '⚫' },
                                                { id: 'triangle', label: 'Delta', icon: '🔺' },
                                                { id: 'star', label: 'Hero', icon: '⭐' },
                                                { id: 'heart', label: 'Love', icon: '❤️' }
                                            ].map(s => (
                                                <button
                                                    key={s.id}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-indigo-200 hover:scale-[1.02] transition-all text-xs font-bold flex flex-col items-center gap-1"
                                                    onClick={() => addShape(s.id)}
                                                >
                                                    <span className="text-lg">{s.icon}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{s.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="h-[1px] bg-slate-200 my-1"></div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                className="p-3 bg-sky-50 border border-sky-100 hover:bg-sky-100 rounded-xl text-xs font-bold text-sky-700 flex flex-col items-center gap-1"
                                                onClick={() => addShape('mug-wrap')}
                                            >
                                                <span className="text-lg">☕</span>
                                                <span className="text-[10px] uppercase">Mug Wrap</span>
                                            </button>
                                            <button
                                                className="p-3 bg-purple-50 border border-purple-100 hover:bg-purple-100 rounded-xl text-xs font-bold text-purple-700 flex flex-col items-center gap-1"
                                                onClick={() => addShape('wave')}
                                            >
                                                <span className="text-lg">🌊</span>
                                                <span className="text-[10px] uppercase">Flow Wave</span>
                                            </button>
                                        </div>

                                        <button
                                            className="w-full p-4 bg-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-100 transition-all font-bold text-xs flex items-center justify-center gap-2 group"
                                            onClick={startCustomShape}
                                        >
                                            <FaEdit className="group-hover:rotate-12 transition-transform" />
                                            <span>DRAW CUSTOM SHAPE</span>
                                        </button>

                                        <label className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                checked={useSmoothCurve}
                                                onChange={(e) => setUseSmoothCurve(e.target.checked)}
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider leading-tight">Apply Smooth Curves</span>
                                        </label>
                                    </div>
                                )}

                                {activeTab === 'text' && (
                                    <div className="space-y-4">
                                        <button
                                            className="w-full bg-indigo-500 text-white p-4 rounded-2xl hover:bg-indigo-600 shadow-lg shadow-indigo-100 transition-all font-bold text-sm flex items-center justify-center gap-3 group"
                                            onClick={addText}
                                        >
                                            <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                                <FaFont className="text-white" />
                                            </div>
                                            <span>INSERT NEW TEXT</span>
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center font-medium font-serif italic">"Design is thinking made visual"</p>
                                    </div>
                                )}

                                {activeTab === 'elements' && (
                                    <div className="space-y-3">
                                        <button
                                            className="w-full bg-white border border-slate-200 p-4 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 shadow-sm transition-all flex items-center gap-3 group"
                                            onClick={addPlaceholder}
                                        >
                                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                                                <FaImage />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-bold text-slate-800 tracking-tight">Photo Area</p>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Drag to place holder</p>
                                            </div>
                                        </button>

                                        <button
                                            className="w-full bg-white border border-slate-200 p-4 rounded-xl hover:bg-pink-50 hover:border-pink-200 shadow-sm transition-all flex items-center gap-3 group"
                                            onClick={() => graphicInputRef.current.click()}
                                        >
                                            <div className="p-2 bg-pink-50 text-pink-500 rounded-lg group-hover:scale-110 transition-transform">
                                                <FaPlus />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-bold text-slate-800 tracking-tight">Upload Asset</p>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-tighter">PNG or SVG elements</p>
                                            </div>
                                        </button>
                                        <input type="file" ref={graphicInputRef} hidden onChange={handleGraphicUpload} accept="image/*" />
                                    </div>
                                )}

                                {activeTab === 'mug' && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group">
                                            <div className="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                                <FaCoffee className="text-7xl text-white" />
                                            </div>
                                            <h3 className="text-[9px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-3">Live Engine</h3>
                                            <button
                                                className="w-full bg-white text-indigo-700 p-3 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all text-xs font-black shadow-md flex items-center justify-center gap-2"
                                                onClick={addMugWrapPlaceholder}
                                            >
                                                <FaMagic /> START AUTO-WRAP
                                            </button>
                                        </div>

                                        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Preview Mode</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-white border-0 focus:ring-2 focus:ring-indigo-500 p-3 rounded-xl text-xs font-bold text-slate-700 appearance-none shadow-sm"
                                                    value={wrapType}
                                                    onChange={e => setWrapType(e.target.value)}
                                                >
                                                    <option value="none">Flat Preview</option>
                                                    <option value="mug">☕ 3D Mug Model</option>
                                                    <option value="bottle">🫙 Sipper Bottle</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                                                    <FaArrowDown className="text-[8px]" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            className="w-full py-3 px-2 border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-1"
                                            onClick={addMugBodyHelper}
                                        >
                                            <FaLayerGroup /> Add Reference Template
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Layer Controls & Properties */}
                            {/* Property Inspector - Premium Design */}
                            {selectedObject && (
                                <div className="pt-6 border-t border-slate-100 space-y-6 animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transform</h3>
                                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
                                            {selectedObject.type.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Width (px)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-2.5 rounded-xl text-xs font-bold transition-all"
                                                value={objProps.width}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const ratio = val / selectedObject.getScaledWidth();
                                                    updateProperty('scaleX', selectedObject.scaleX * ratio);
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Height (px)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-2.5 rounded-xl text-xs font-bold transition-all"
                                                value={objProps.height}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    const ratio = val / selectedObject.getScaledHeight();
                                                    updateProperty('scaleY', selectedObject.scaleY * ratio);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Appearance</label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-slate-400">Main Color</label>
                                                <div className="relative h-10 w-full group">
                                                    <input
                                                        type="color"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        value={objProps.fill && typeof objProps.fill === 'string' ? objProps.fill : '#000000'}
                                                        onChange={(e) => updateProperty('fill', e.target.value)}
                                                    />
                                                    <div
                                                        className="w-full h-full rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center transition-transform group-hover:scale-105"
                                                        style={{ backgroundColor: objProps.fill && typeof objProps.fill === 'string' ? objProps.fill : '#000000' }}
                                                    >
                                                        <span className="text-[9px] font-mono text-white mix-blend-difference opacity-50">HEX</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-slate-400">Opacity ({Math.round((objProps.opacity || 1) * 100)}%)</label>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1"
                                                    step="0.05"
                                                    className="w-full accent-indigo-600"
                                                    value={objProps.opacity || 1}
                                                    onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                        <div className="space-y-4 pt-2">
                                            <div className="h-[1px] bg-slate-100"></div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Typography</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-1 space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Size</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl text-xs font-black"
                                                        value={objProps.fontSize}
                                                        onChange={(e) => updateProperty('fontSize', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Font Family</label>
                                                    <select
                                                        className="w-full bg-slate-50 border-0 focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl text-xs font-bold"
                                                        value={objProps.fontFamily}
                                                        onChange={(e) => updateProperty('fontFamily', e.target.value)}
                                                    >
                                                        {fonts.map(font => (
                                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 transition-all hover:bg-indigo-50 group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id="isPlaceholder"
                                                    className="w-5 h-5 rounded-lg border-2 border-indigo-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                    checked={objProps.role === 'placeholder'}
                                                    onChange={(e) => {
                                                        const isPlaceholder = e.target.checked;
                                                        updateProperty('role', isPlaceholder ? 'placeholder' : null);

                                                        if (isPlaceholder) {
                                                            if (!selectedObject.shapeType) {
                                                                let autoType = 'rect';
                                                                if (selectedObject.type === 'circle') autoType = 'circle';
                                                                else if (selectedObject.type === 'triangle') autoType = 'triangle';
                                                                else if (selectedObject.type === 'polygon') {
                                                                    autoType = (selectedObject.points && selectedObject.points.length === 10) ? 'star' : 'polygon';
                                                                }
                                                                else if (selectedObject.type === 'path') autoType = 'heart';
                                                                else if (selectedObject.type === 'rect') autoType = selectedObject.rx ? 'rounded' : 'rect';
                                                                selectedObject.set('shapeType', autoType);
                                                                selectedObject.shapeType = autoType;
                                                            }
                                                            if (!selectedObject.id || selectedObject.id === '') {
                                                                const newId = 'placeholder_' + Date.now();
                                                                selectedObject.set('id', newId);
                                                                selectedObject.id = newId;
                                                            }
                                                            updateProperty('fill', 'rgba(99, 102, 241, 0.1)');
                                                            updateProperty('stroke', '#6366f1');
                                                            updateProperty('strokeWidth', 2);
                                                            updateProperty('strokeDashArray', [8, 4]);
                                                            updateProperty('locked', false);
                                                        } else {
                                                            updateProperty('stroke', '#333');
                                                            updateProperty('strokeWidth', 1);
                                                            updateProperty('strokeDashArray', null);
                                                            updateProperty('fill', '#e2e8f0');
                                                        }
                                                    }}
                                                />
                                                <FaImage className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] pointer-events-none transition-opacity ${objProps.role === 'placeholder' ? 'opacity-100 text-white' : 'opacity-0'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor="isPlaceholder" className="text-[11px] font-black text-indigo-900 cursor-pointer block leading-none mb-1">
                                                    Interaction Area
                                                </label>
                                                <span className="text-[9px] text-indigo-400 font-medium uppercase tracking-tight italic">Click to upload enabled</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${objProps.locked ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                                onClick={() => updateProperty('locked', !objProps.locked)}
                                            >
                                                {objProps.locked ? <FaLock className="text-sm mb-1" /> : <FaUnlock className="text-sm mb-1" />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">{objProps.locked ? 'Locked' : 'Unlocked'}</span>
                                            </button>
                                            <button
                                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${objProps.snapToGrid ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                                onClick={() => updateProperty('snapToGrid', !objProps.snapToGrid)}
                                            >
                                                <FaMagic className="text-sm mb-1" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Snap-10px</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {(selectedObject.type === 'polygon' || selectedObject.type === 'path' || selectedObject.type === 'rect') && (
                                                <button
                                                    className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isEditingPoints ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-black'}`}
                                                    onClick={editShapePoints}
                                                >
                                                    {isEditingPoints ? '✓ Save Points' : '🎯 Shape Edit'}
                                                </button>
                                            )}
                                            {isDrawingMode && (
                                                <button className="py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all font-mono" onClick={cancelDrawing}>
                                                    CANCEL DRAW
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-[10px] font-bold flex items-center justify-center gap-1" onClick={bringToFront}>
                                                <FaArrowUp /> UP
                                            </button>
                                            <button className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-[10px] font-bold flex items-center justify-center gap-1" onClick={sendToBack}>
                                                <FaArrowDown /> DOWN
                                            </button>
                                            <button className="w-12 h-10 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center group" onClick={deleteObject}>
                                                <FaTrash className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>

                                        {(selectedObject.type === 'image' || selectedObject.type === 'fabric.Image') && selectedObject.id !== 'background_image' && (
                                            <button
                                                className="w-full mt-2 p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                                                onClick={setAsBackground}
                                            >
                                                <FaImage /> Use as base background
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Center - Interactive Canvas Viewport */}
                <main className="flex-1 flex flex-col items-center justify-center bg-slate-100/50 p-6 md:p-12 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                    <div className="relative z-10 animate-fadeIn">
                        <div className="bg-white p-1 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200/50 flex">
                            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
                                <canvas ref={canvasRef} />
                            </div>
                        </div>

                        {/* Floating Canvas Controls */}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/50">
                            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fabric v6.x Active</span>
                            </div>
                            <div className="flex gap-4">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Resolution: {canvas?.width}x{canvas?.height}</p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar - Dynamic Layers Panel */}
                <aside className="hidden xl:flex w-72 bg-white border-l border-slate-200 flex-col shadow-2xl z-20">
                    <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <FaLayerGroup className="text-indigo-500 text-sm" />
                            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-widest">Active Layers</h3>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[9px] font-black">
                            {canvas?.getObjects().length || 0}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {canvas?.getObjects().length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="p-6 bg-slate-100 rounded-full text-slate-300">
                                    <FaShapes className="text-4xl" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Canvas is empty.<br />Start adding shapes.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {canvas?.getObjects().slice().reverse().map((obj, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${selectedObject === obj ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                                        onClick={() => {
                                            canvas.setActiveObject(obj);
                                            canvas.renderAll();
                                            setSelectedObject(obj);
                                        }}
                                    >
                                        <div className="h-10 w-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                                            {obj.type === 'i-text' || obj.type === 'text' ? <FaFont className="text-sm" /> :
                                                obj.type === 'image' ? <FaImage className="text-sm" /> : <FaShapes className="text-sm" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate capitalize">{obj.role === 'placeholder' ? 'Photo Area' : obj.type}</p>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-tighter">Layer #{canvas?.getObjects().length - idx}</p>
                                        </div>
                                        {obj.locked && <FaLock className="text-[9px] text-amber-500" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <FaMagic className="text-emerald-500 text-xs" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Shortcuts</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-[8px] font-bold text-slate-400">
                                <span>DEL</span>
                                <span className="text-slate-200">DELETE</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-[8px] font-bold text-slate-400">
                                <span>ESC</span>
                                <span className="text-slate-200">CANCEL</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CreateTemplate;


