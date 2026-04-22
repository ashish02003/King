import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * Same SVG path as admin CreateTemplate.createMugSmilePath (local pixel coords 0..w, 0..h).
 * Must match admin so fabric clip and photographic preview align.
 */
function createMugSmilePath(w, h, curve = 35) {
    const c = Math.min(Math.max(Number(curve) || 35, 4), h * 0.42);
    return `M 0 ${c} Q ${w / 2} ${c * 2.5} ${w} ${c} L ${w} ${h} Q ${w / 2} ${h + c * 1.5} 0 ${h} Z`;
}

/**
 * MugWrapPreview - Supports both procedural 3D-like warping
 * and high-quality photographic mockups (mockupViews).
 */
const MugWrapPreview = ({ photoUrl, wrapType = 'mug', mockupViews = [], slotAssets = {}, placeholderShapeBySide = {} }) => {
    const wrapCanvasRef = useRef(null);
    const [rendered, setRendered] = useState(false);
    const [currentViewIndex, setCurrentViewIndex] = useState(0);

    // Default procedural views (Canvas-drawn mug)
    const DEFAULT_VIEWS = [
        { label: 'Front View', offsetRatio: 0.5, type: 'procedural' },
        { label: 'Left View', offsetRatio: 0.25, type: 'procedural' },
        { label: 'Right View', offsetRatio: 0.75, type: 'procedural' }
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

    // If admin provided mockups, prefer those views only
    const ALL_VIEWS = orderedMockupViews.length > 0
        ? orderedMockupViews.map((mv) => ({
            ...mv,
            label: mv.viewName || `${mv.side || 'center'} view`,
            type: 'photographic',
            offsetRatio: mv.side === 'left' ? 0.25 : (mv.side === 'right' ? 0.75 : 0.5)
        }))
        : DEFAULT_VIEWS.map(v => ({ ...v, wrapType }));
    const activeViewForCanvas = ALL_VIEWS[currentViewIndex] || ALL_VIEWS[0];
    const isPhotographicView = activeViewForCanvas?.type === 'photographic';
    // Match admin mockup workspace proportions (400x600) for photographic mapping.
    const canvasWidth = 400;
    const canvasHeight = isPhotographicView ? 650 : 380;

    const getViewSlot = (view) => {
        if (view?.side) return view.side;
        const label = (view?.label || '').toLowerCase();
        if (label.includes('left')) return 'left';
        if (label.includes('right')) return 'right';
        return 'center';
    };

    /** Align with admin CreateTemplate shape names (rect, triangle, star, wave, etc.) */
    const normalizeShapeType = (st) => {
        if (!st) return 'rectangle';
        const s = String(st).toLowerCase();
        if (s === 'rect') return 'rectangle';
        return s;
    };

    const applyShapeClip = (ctx, shapeType, w, h, customPath = null, curveValue = 35) => {
        const kind = normalizeShapeType(shapeType);
        // mug-wrap / wave: always rebuild path in THIS box (saved mockup customPath is often full-canvas scale → wrong clip = rectangle)
        if (kind === 'mug-wrap' || kind === 'wave') {
            const c = kind === 'wave' ? (curveValue || 35) * 0.88 : (curveValue || 35);
            try {
                ctx.clip(new Path2D(createMugSmilePath(w, h, c)));
                return true;
            } catch (e) {
                console.warn('Mug wrap Path2D clip failed', e);
            }
        }
        if (customPath && kind !== 'mug-wrap' && kind !== 'wave') {
            try {
                const p2d = new Path2D(customPath);
                ctx.clip(p2d);
                return true;
            } catch (e) {
                console.warn('Path2D failed, falling back to basic shape', e);
            }
        }
        ctx.beginPath();
        if (kind === 'circle' || kind === 'ellipse') {
            ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (kind === 'rounded') {
            const radius = Math.min(18, w / 6, h / 6);
            ctx.moveTo(radius, 0);
            ctx.lineTo(w - radius, 0);
            ctx.quadraticCurveTo(w, 0, w, radius);
            ctx.lineTo(w, h - radius);
            ctx.quadraticCurveTo(w, h, w - radius, h);
            ctx.lineTo(radius, h);
            ctx.quadraticCurveTo(0, h, 0, h - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
        } else if (kind === 'triangle') {
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.clip();
            return false;
        } else if (kind === 'star') {
            const spikes = 5;
            const cx = w / 2;
            const cy = h / 2;
            const outerR = Math.min(w, h) / 2;
            const innerR = outerR * 0.42;
            let rot = -Math.PI / 2;
            for (let i = 0; i < spikes * 2; i++) {
                const r = i % 2 === 0 ? outerR : innerR;
                const x = cx + Math.cos(rot) * r;
                const y = cy + Math.sin(rot) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                rot += Math.PI / spikes;
            }
            ctx.closePath();
            ctx.clip();
            return false;
        } else if (kind === 'heart') {
            const cx = w / 2;
            const cy = h / 2;
            const sx = w / 2;
            const sy = h / 2;
            ctx.moveTo(cx, cy + sy * 0.9);
            ctx.bezierCurveTo(cx + sx * 1.1, cy + sy * 0.35, cx + sx * 0.9, cy - sy * 0.55, cx, cy - sy * 0.15);
            ctx.bezierCurveTo(cx - sx * 0.9, cy - sy * 0.55, cx - sx * 1.1, cy + sy * 0.35, cx, cy + sy * 0.9);
        } else if (kind === 'polygon' || kind === 'path' || kind === 'custom') {
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(0, 0, w, h, Math.min(w, h) * 0.08);
            } else {
                ctx.rect(0, 0, w, h);
            }
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
        // Fallback logic: If no specific side asset exists, use the main photoUrl (exported design).
        // This ensures "Single Photo" mode correctly populates left/right mockups.
        const selectedImageUrl = slot.imageUrl || photoUrl;
        const selectedText = slot.text || '';
        const selectedTransform = slot.transform || null;
        const slotShapeType = normalizeShapeType(slot.shapeType);

        const getDrawBox = (img, boxW, boxH, transform) => {
            const iw = img.width || 1;
            const ih = img.height || 1;
            const baseScale = Math.max(boxW / iw, boxH / ih);
            const zoom = Math.max(0.5, Math.min(4, Number(transform?.zoom) || 1));
            const scale = baseScale * zoom;
            const dw = iw * scale;
            const dh = ih * scale;
            const rawDx = (boxW - dw) / 2 + (Number(transform?.offsetX) || 0) * boxW;
            const rawDy = (boxH - dh) / 2 + (Number(transform?.offsetY) || 0) * boxH;
            const dx = Math.min(0, Math.max(boxW - dw, rawDx));
            const dy = Math.min(0, Math.max(boxH - dh, rawDy));
            return { dx, dy, dw, dh, iw, ih };
        };

        const drawCoverImage = (img, boxW, boxH) => {
            const iw = img.width || 1;
            const ih = img.height || 1;
            const scale = Math.max(boxW / iw, boxH / ih);
            const dw = iw * scale;
            const dh = ih * scale;
            const dx = (boxW - dw) / 2;
            const dy = (boxH - dh) / 2;
            ctx.drawImage(img, dx, dy, dw, dh);
        };

        const drawBackgroundWithTransform = (img, boxW, boxH, bgTransform = null) => {
            const iw = img.width || 1;
            const ih = img.height || 1;
            const baseScale = Math.min(boxW / iw, boxH / ih);
            const zoom = Math.max(0.8, Math.min(2.5, Number(bgTransform?.zoom) || 1));
            const scale = baseScale * zoom;
            const dw = iw * scale;
            const dh = ih * scale;
            const rawDx = (boxW - dw) / 2 + (Number(bgTransform?.offsetX) || 0) * boxW * 0.24;
            const rawDy = (boxH - dh) / 2 + (Number(bgTransform?.offsetY) || 0) * boxH * 0.24;

            // Allow centering when image is smaller than box, but restrict to edges when zoomed in
            const dx = (dw <= boxW) ? rawDx : Math.min(0, Math.max(boxW - dw, rawDx));
            const dy = (dh <= boxH) ? rawDy : Math.min(0, Math.max(boxH - dh, rawDy));

            ctx.drawImage(img, dx, dy, dw, dh);
        };

        const renderWithImage = (designImg) => {
            if (activeView.type === 'photographic') {
                // ─── OPTION A: PHOTOGRAPHIC MOCKUP ──────────────────────────────
                const bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                bgImg.onload = () => {
                    // 1. Draw Mockup Reality
                    drawBackgroundWithTransform(bgImg, W, H, activeView.bgTransform);

                    const p = activeView.placement;
                    const destX = (p.x / 100) * W;
                    const destY = (p.y / 100) * H;
                    const destW = (p.width / 100) * W;
                    const destH = (p.height / 100) * H;
                    const shapeType = normalizeShapeType(
                        activeView.shapeType
                        || slotShapeType
                        || placeholderShapeBySide[activeSlotKey]
                        || ((wrapType === 'mug' || wrapType === 'bottle') ? 'mug-wrap' : 'rectangle')
                    );
                    const placementCurve = (p.curve !== undefined && p.curve !== null && !Number.isNaN(Number(p.curve)))
                        ? Number(p.curve)
                        : 35;

                    ctx.save();
                    ctx.translate(destX, destY);

                    if (p.angle) {
                        ctx.translate(destW / 2, destH / 2);
                        ctx.rotate((p.angle * Math.PI) / 180);
                        ctx.translate(-destW / 2, -destH / 2);
                    }

                    applyShapeClip(ctx, shapeType, destW, destH, activeView.customPath, placementCurve);

                    const isWrapShape = shapeType === 'mug-wrap' || shapeType === 'wave';
                    const effectiveCurve = isWrapShape ? placementCurve : (Number(p.curve) || 0);

                    if (effectiveCurve > 0 && designImg && isWrapShape) {
                        const strips = Math.ceil(destW);
                        for (let i = 0; i < strips; i++) {
                            const progress = i / strips;
                            const smile = Math.sin(progress * Math.PI);
                            const yOff = (effectiveCurve / 2) * smile;
                            const sX = Math.floor(progress * designImg.width);
                            const sW = Math.max(1, Math.ceil(designImg.width / strips));
                            try {
                                ctx.drawImage(
                                    designImg,
                                    sX, 0, sW, designImg.height,
                                    i, yOff, 1, destH
                                );
                            } catch (e) { /* ignore */ }
                        }
                    } else if (designImg) {
                        const { dx, dy, dw, dh } = getDrawBox(designImg, destW, destH, selectedTransform);
                        ctx.drawImage(designImg, dx, dy, dw, dh);
                    }

                    if (selectedText) {
                        ctx.fillStyle = '#111827';
                        ctx.font = 'bold 22px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const words = selectedText.split(' ');
                        const lines = [];
                        let line = '';
                        const maxW = destW * 0.8;
                        words.forEach((w) => {
                            const t = line ? `${line} ${w}` : w;
                            if (ctx.measureText(t).width > maxW && line) {
                                lines.push(line);
                                line = w;
                            } else {
                                line = t;
                            }
                        });
                        if (line) lines.push(line);
                        const lineH = 26;
                        const startY = (destH / 2) - ((lines.length - 1) * lineH / 2);
                        lines.forEach((l, i) => ctx.fillText(l, destW / 2, startY + i * lineH));
                    }

                    if (!designImg && !selectedText) {
                        ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`No ${activeSlotKey} content`, destW / 2, destH / 2);
                    }

                    ctx.restore();

                    if (activeView.overlayUrl) {
                        const overlay = new Image();
                        overlay.crossOrigin = 'anonymous';
                        overlay.onload = () => {
                            ctx.globalCompositeOperation = 'multiply';
                            ctx.drawImage(overlay, 0, 0, W, H);
                            ctx.globalCompositeOperation = 'source-over';
                            setRendered(true);
                        };
                        overlay.src = activeView.overlayUrl;
                    } else {
                        ctx.save();
                        ctx.globalCompositeOperation = 'multiply';
                        ctx.fillStyle = 'rgba(0,0,0,0.05)';
                        ctx.fillRect(destX, destY, destW, destH);
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.restore();
                        setRendered(true);
                    }
                };
                bgImg.src = activeView.backgroundUrl;

            } else {
                // ─── OPTION B: PROCEDURAL CANVAS MUG ─────────────────────────────
                // Existing logic for procedural mug drawing
                let mugWidth = W * 0.7;
                let mugHeight = H * 0.75;
                let mugX = (W - mugWidth) / 2;
                let mugY = (H - mugHeight) / 2 + 20;
                let curveDepth = 28;

                if (wrapType === 'bottle') {
                    mugWidth = W * 0.5; mugHeight = H * 0.85; curveDepth = 15;
                } else if (wrapType === 'phone') {
                    mugWidth = W * 0.55; mugHeight = H * 0.85; curveDepth = 8;
                }

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, W, H);

                if (wrapType === 'mug') {
                    ctx.save(); ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 18; ctx.lineCap = 'round';
                    ctx.beginPath();
                    const handleRad = mugHeight * 0.25;
                    ctx.arc(mugX + mugWidth - 5, mugY + mugHeight / 2, handleRad, -Math.PI / 2.2, Math.PI / 2.2);
                    ctx.stroke(); ctx.restore();
                }

                const slotCenterRatio = activeSlotKey === 'left' ? 0.25 : (activeSlotKey === 'right' ? 0.75 : 0.5);
                const slotW = mugWidth * 0.36;
                const slotX = mugX + mugWidth * slotCenterRatio - slotW / 2;
                const slotY = mugY + mugHeight * 0.16;
                const slotH = mugHeight * 0.68;

                if (designImg) {
                    const clipKind = normalizeShapeType(
                        slotShapeType
                        || placeholderShapeBySide[activeSlotKey]
                        || ((wrapType === 'mug' || wrapType === 'bottle') ? 'mug-wrap' : 'rectangle')
                    );
                    ctx.save();
                    ctx.translate(slotX, slotY);
                    applyShapeClip(ctx, clipKind, slotW, slotH, null, 35);

                    const iw = designImg.width;
                    const ih = designImg.height;
                    const { dx, dy, dw, dh } = getDrawBox(designImg, slotW, slotH, selectedTransform);
                    if (clipKind === 'mug-wrap' || clipKind === 'wave') {
                        const strips = Math.max(12, Math.ceil(slotW));
                        for (let i = 0; i < strips; i++) {
                            const progress = i / strips;
                            const smile = Math.sin(progress * Math.PI);
                            const yOff = (curveDepth * 0.35) * smile;
                            const sX = Math.floor(progress * iw);
                            const sW = Math.max(1, Math.ceil(iw / strips));
                            const sliceW = dw / strips;
                            try {
                                ctx.drawImage(designImg, sX, 0, sW, ih, dx + i * sliceW, dy + yOff, sliceW + 0.5, dh);
                            } catch (e) { /* ignore */ }
                        }
                    } else {
                        ctx.drawImage(designImg, dx, dy, dw, dh);
                    }
                    ctx.restore();
                }

                if (selectedText) {
                    const textClipKind = normalizeShapeType(
                        slotShapeType
                        || placeholderShapeBySide[activeSlotKey]
                        || 'rounded'
                    );
                    ctx.save();
                    applyShapeClip(ctx, textClipKind, slotX, slotY, slotW, slotH);
                    ctx.fillStyle = '#111827';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const maxW = slotW * 0.82;
                    const words = selectedText.split(' ');
                    const lines = [];
                    let line = '';
                    words.forEach((w) => {
                        const t = line ? `${line} ${w}` : w;
                        if (ctx.measureText(t).width > maxW && line) {
                            lines.push(line);
                            line = w;
                        } else {
                            line = t;
                        }
                    });
                    if (line) lines.push(line);
                    const lineH = 22;
                    const startY = slotY + slotH / 2 - ((lines.length - 1) * lineH / 2);
                    lines.forEach((l, i) => ctx.fillText(l, slotX + slotW / 2, startY + i * lineH));
                    ctx.restore();
                }

                // Shading
                const shading = ctx.createLinearGradient(mugX, 0, mugX + mugWidth, 0);
                shading.addColorStop(0, 'rgba(0,0,0,0.1)'); shading.addColorStop(0.5, 'rgba(0,0,0,0)'); shading.addColorStop(1, 'rgba(0,0,0,0.15)');
                ctx.fillStyle = shading; ctx.fillRect(mugX, mugY, mugWidth, mugHeight + curveDepth);

                setRendered(true);
            }
        };

        ctx.clearRect(0, 0, W, H);
        if (selectedImageUrl) {
            const designImg = new Image();
            designImg.crossOrigin = 'anonymous';
            designImg.onload = () => renderWithImage(designImg);
            designImg.onerror = () => renderWithImage(null);
            designImg.src = selectedImageUrl;
        } else {
            renderWithImage(null);
        }
    }, [photoUrl, wrapType, currentViewIndex, mockupViews, slotAssets, placeholderShapeBySide]);

    const handlePrev = () => setCurrentViewIndex(p => p === 0 ? ALL_VIEWS.length - 1 : p - 1);
    const handleNext = () => setCurrentViewIndex(p => p === ALL_VIEWS.length - 1 ? 0 : p + 1);

    useEffect(() => {
        if (currentViewIndex >= ALL_VIEWS.length) {
            setCurrentViewIndex(0);
        }
    }, [ALL_VIEWS.length, currentViewIndex]);

    return (
        <div className="w-full flex flex-col items-center animate-fade-in-up bg-white rounded-[2rem] border border-gray-100 p-6 relative shadow-sm">
            <div className="relative flex items-center justify-center w-full">
                <button onClick={handlePrev} className="absolute left-2 z-10 w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all">
                    <FaChevronLeft />
                </button>
                <div className="relative group">
                    <canvas ref={wrapCanvasRef} width={canvasWidth} height={canvasHeight} className="max-w-full h-auto rounded-xl" />
                    {!rendered && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}
                </div>
                <button onClick={handleNext} className="absolute right-2 z-10 w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all">
                    <FaChevronRight />
                </button>
            </div>
            <div className="flex gap-2 mt-4">
                {ALL_VIEWS.map((v, i) => (
                    <button key={i} onClick={() => setCurrentViewIndex(i)} className={`w-2 h-2 rounded-full ${i === currentViewIndex ? 'bg-indigo-600 w-4' : 'bg-gray-200'} transition-all`} />
                ))}
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-wider">
                {ALL_VIEWS[currentViewIndex].label}
            </p>
        </div>
    );
};

export default MugWrapPreview;
