import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function createMugSmilePath(w, h, curve = 35) {
    const c = Math.min(Math.max(Number(curve) || 35, 4), h * 0.42);
    return `M 0 ${c} Q ${w / 2} ${c * 2.5} ${w} ${c} L ${w} ${h} Q ${w / 2} ${h + c * 1.5} 0 ${h} Z`;
}

const MugWrapPreview = ({ photoUrl, wrapType = 'mug', mockupViews = [], slotAssets = {}, placeholderShapeBySide = {} }) => {
    const wrapCanvasRef = useRef(null);
    const [rendered, setRendered] = useState(false);
    const [currentViewIndex, setCurrentViewIndex] = useState(0);

    const DEFAULT_VIEWS = [
        { label: 'Front Perspective', offsetRatio: 0.5, type: 'procedural' },
        { label: 'Left Profile', offsetRatio: 0.25, type: 'procedural' },
        { label: 'Right Profile', offsetRatio: 0.75, type: 'procedural' }
    ];

    const orderedMockupViews = [...(mockupViews || [])]
        .map((mv) => ({
            ...mv,
            side: mv.side || mv.angleFocus || 'center'
        }))
        .sort((a, b) => {
            const order = { center: 0, left: 1, right: 2 };
            return (order[a.side] ?? 99) - (order[b.side] ?? 99);
        });

    const ALL_VIEWS = orderedMockupViews.length > 0
        ? orderedMockupViews.map((mv) => ({
            ...mv,
            label: mv.viewName || `${mv.side || 'center'} perspective`,
            type: 'photographic',
            offsetRatio: mv.side === 'left' ? 0.25 : (mv.side === 'right' ? 0.75 : 0.5)
        }))
        : DEFAULT_VIEWS.map(v => ({ ...v, wrapType }));

    const activeViewForCanvas = ALL_VIEWS[currentViewIndex] || ALL_VIEWS[0];
    const isPhotographicView = activeViewForCanvas?.type === 'photographic';
    const canvasWidth = 400;
    const canvasHeight = isPhotographicView ? 650 : 380;

    const getViewSlot = (view) => {
        if (view?.side) return view.side;
        const label = (view?.label || '').toLowerCase();
        if (label.includes('left')) return 'left';
        if (label.includes('right')) return 'right';
        return 'center';
    };

    const normalizeShapeType = (st) => {
        if (!st) return 'rectangle';
        const s = String(st).toLowerCase();
        if (s === 'rect') return 'rectangle';
        return s;
    };

    const applyShapeClip = (ctx, shapeType, w, h, customPath = null, curveValue = 35) => {
        const kind = normalizeShapeType(shapeType);
        if (kind === 'mug-wrap' || kind === 'wave') {
            const c = kind === 'wave' ? (curveValue || 35) * 0.88 : (curveValue || 35);
            try {
                ctx.clip(new Path2D(createMugSmilePath(w, h, c)));
                return true;
            } catch (e) { console.warn(e); }
        }
        if (customPath && kind !== 'mug-wrap' && kind !== 'wave') {
            try {
                ctx.clip(new Path2D(customPath));
                return true;
            } catch (e) { console.warn(e); }
        }
        ctx.beginPath();
        if (kind === 'circle' || kind === 'ellipse') {
            ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (kind === 'rounded') {
            const radius = Math.min(18, w / 6, h / 6);
            ctx.moveTo(radius, 0); ctx.lineTo(w - radius, 0); ctx.quadraticCurveTo(w, 0, w, radius);
            ctx.lineTo(w, h - radius); ctx.quadraticCurveTo(w, h, w - radius, h);
            ctx.lineTo(radius, h); ctx.quadraticCurveTo(0, h, 0, h - radius);
            ctx.lineTo(0, radius); ctx.quadraticCurveTo(0, 0, radius, 0);
        } else if (kind === 'heart') {
            const cx = w / 2; const cy = h / 2; const sx = w / 2; const sy = h / 2;
            ctx.moveTo(cx, cy + sy * 0.9);
            ctx.bezierCurveTo(cx + sx * 1.1, cy + sy * 0.35, cx + sx * 0.9, cy - sy * 0.55, cx, cy - sy * 0.15);
            ctx.bezierCurveTo(cx - sx * 0.9, cy - sy * 0.55, cx - sx * 1.1, cy + sy * 0.35, cx, cy + sy * 0.9);
        } else {
            ctx.rect(0, 0, w, h);
        }
        ctx.closePath();
        ctx.clip();
        return false;
    };

    useEffect(() => {
        if (!photoUrl && !slotAssets?.left?.imageUrl && !slotAssets?.center?.imageUrl && !slotAssets?.right?.imageUrl) return;
        if (!wrapCanvasRef.current) return;
        setRendered(false);

        const canvas = wrapCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const activeView = ALL_VIEWS[currentViewIndex];
        const activeSlotKey = getViewSlot(activeView);
        const slot = slotAssets?.[activeSlotKey] || {};
        const selectedImageUrl = slot.imageUrl || photoUrl;
        const selectedText = slot.text || '';
        const selectedTransform = slot.transform || null;
        const slotShapeType = normalizeShapeType(slot.shapeType);

        const getDrawBox = (img, boxW, boxH, transform) => {
            const iw = img.width || 1; const ih = img.height || 1;
            const baseScale = Math.max(boxW / iw, boxH / ih);
            const zoom = Math.max(0.5, Math.min(4, Number(transform?.zoom) || 1));
            const scale = baseScale * zoom;
            const dw = iw * scale; const dh = ih * scale;
            const rawDx = (boxW - dw) / 2 + (Number(transform?.offsetX) || 0) * boxW;
            const rawDy = (boxH - dh) / 2 + (Number(transform?.offsetY) || 0) * boxH;
            const dx = Math.min(0, Math.max(boxW - dw, rawDx));
            const dy = Math.min(0, Math.max(boxH - dh, rawDy));
            return { dx, dy, dw, dh };
        };

        const drawBackground = (img, boxW, boxH, bgTransform = null) => {
            const iw = img.width || 1; const ih = img.height || 1;
            const baseScale = Math.min(boxW / iw, boxH / ih);
            const zoom = Math.max(0.8, Math.min(2.5, Number(bgTransform?.zoom) || 1));
            const scale = baseScale * zoom;
            const dw = iw * scale; const dh = ih * scale;
            const dx = (boxW - dw) / 2 + (Number(bgTransform?.offsetX) || 0) * boxW * 0.24;
            const dy = (boxH - dh) / 2 + (Number(bgTransform?.offsetY) || 0) * boxH * 0.24;
            ctx.drawImage(img, dx, dy, dw, dh);
        };

        const renderWithImage = (designImg) => {
            if (activeView.type === 'photographic') {
                const bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                bgImg.onload = () => {
                    drawBackground(bgImg, W, H, activeView.bgTransform);
                    const p = activeView.placement;
                    const destX = (p.x / 100) * W; const destY = (p.y / 100) * H;
                    const destW = (p.width / 100) * W; const destH = (p.height / 100) * H;
                    const shapeType = normalizeShapeType(activeView.shapeType || slotShapeType || placeholderShapeBySide[activeSlotKey] || ((wrapType === 'mug' || wrapType === 'bottle') ? 'mug-wrap' : 'rectangle'));
                    const placementCurve = Number(p.curve) || 35;

                    ctx.save();
                    ctx.translate(destX, destY);
                    if (p.angle) { ctx.translate(destW / 2, destH / 2); ctx.rotate((p.angle * Math.PI) / 180); ctx.translate(-destW / 2, -destH / 2); }
                    applyShapeClip(ctx, shapeType, destW, destH, activeView.customPath, placementCurve);

                    const isWrapShape = shapeType === 'mug-wrap' || shapeType === 'wave';
                    const effectiveCurve = isWrapShape ? placementCurve : 0;

                    if (effectiveCurve > 0 && designImg && isWrapShape) {
                        const strips = Math.ceil(destW);
                        for (let i = 0; i < strips; i++) {
                            const progress = i / strips;
                            const smile = Math.sin(progress * Math.PI);
                            const yOff = (effectiveCurve / 2) * smile;
                            const sX = Math.floor(progress * designImg.width);
                            const sW = Math.max(1, Math.ceil(designImg.width / strips));
                            try { ctx.drawImage(designImg, sX, 0, sW, designImg.height, i, yOff, 1, destH); } catch (e) {}
                        }
                    } else if (designImg) {
                        const { dx, dy, dw, dh } = getDrawBox(designImg, destW, destH, selectedTransform);
                        ctx.drawImage(designImg, dx, dy, dw, dh);
                    }
                    ctx.restore();

                    if (activeView.overlayUrl) {
                        const overlay = new Image(); overlay.crossOrigin = 'anonymous';
                        overlay.onload = () => { ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(overlay, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; setRendered(true); };
                        overlay.src = activeView.overlayUrl;
                    } else { setRendered(true); }
                };
                bgImg.src = activeView.backgroundUrl;
            } else {
                ctx.fillStyle = '#1A1333';
                ctx.fillRect(0, 0, W, H);
                setRendered(true);
            }
        };

        ctx.clearRect(0, 0, W, H);
        if (selectedImageUrl) {
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => renderWithImage(img);
            img.onerror = () => renderWithImage(null);
            img.src = selectedImageUrl;
        } else { renderWithImage(null); }
    }, [photoUrl, wrapType, currentViewIndex, mockupViews, slotAssets, placeholderShapeBySide]);

    const handlePrev = () => setCurrentViewIndex(p => p === 0 ? ALL_VIEWS.length - 1 : p - 1);
    const handleNext = () => setCurrentViewIndex(p => p === ALL_VIEWS.length - 1 ? 0 : p + 1);

    return (
        <div className="w-full flex flex-col items-center luxury-card p-6 relative">
            <div className="relative flex items-center justify-center w-full">
                <button onClick={handlePrev} className="absolute left-2 z-10 w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white hover:text-gold hover:scale-110 transition-all">
                    <FaChevronLeft />
                </button>
                <div className="relative group">
                    <canvas ref={wrapCanvasRef} width={canvasWidth} height={canvasHeight} className="max-w-full h-auto rounded-luxury shadow-2xl" />
                    {!rendered && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary-dark/80 backdrop-blur-sm z-10 rounded-luxury">
                            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
                <button onClick={handleNext} className="absolute right-2 z-10 w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white hover:text-gold hover:scale-110 transition-all">
                    <FaChevronRight />
                </button>
            </div>
            <div className="flex gap-2 mt-6">
                {ALL_VIEWS.map((v, i) => (
                    <button key={i} onClick={() => setCurrentViewIndex(i)} className={`w-1.5 h-1.5 rounded-full ${i === currentViewIndex ? 'bg-gold w-4' : 'bg-white/10'} transition-all duration-500`} />
                ))}
            </div>
            <p className="text-[10px] font-bold text-accent-soft mt-4 uppercase tracking-[0.3em] italic">
                {ALL_VIEWS[currentViewIndex].label}
            </p>
        </div>
    );
};

export default MugWrapPreview;
