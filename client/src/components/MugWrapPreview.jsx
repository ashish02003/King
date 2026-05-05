import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function createMugSmilePath(w, h, curve = 35) {
    const c = Math.min(Math.max(Number(curve) || 35, 4), h * 0.42);
    // Perfect cylinder bounding match: 
    // Top sides at y=0, dipping to y=c in middle.
    // Bottom sides at y=h-c, dipping to y=h in middle.
    return `M 0 0 Q ${w / 2} ${c * 2} ${w} 0 L ${w} ${h - c} Q ${w / 2} ${h + c} 0 ${h - c} Z`;
}

<<<<<<< HEAD
const MugWrapPreview = ({ photoUrl, wrapType = 'mug', mockupViews = [], slotAssets = {}, placeholderShapeBySide = {} }) => {
=======
/**
 * MugWrapPreview - Supports both procedural 3D-like warping
 * and high-quality photographic mockups (mockupViews).
 */
const MugWrapPreview = ({ photoUrl, templateBgUrl, wrapType = 'mug', mockupViews = [], slotAssets = {}, placeholderShapeBySide = {}, printSizeMm = null }) => {
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
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

<<<<<<< HEAD
    const ALL_VIEWS = orderedMockupViews.length > 0
        ? orderedMockupViews.map((mv) => ({
=======
    let effectiveMockupViews = orderedMockupViews;

    // Auto-fallback: if admin uploaded `backgroundImageUrl` but didn't setup mockups, synthesize one
    if (effectiveMockupViews.length === 0 && templateBgUrl) {
        effectiveMockupViews = [{
            viewName: 'Front View',
            side: 'center',
            backgroundUrl: templateBgUrl,
            placement: { x: 20, y: 15, width: 60, height: 70, curve: 0 },
            shapeType: (wrapType === 'mug' || wrapType === 'bottle' || wrapType === 'planter') ? 'mug-wrap' : 'rectangle'
        }];
    }

    const hasSameBackgrounds = effectiveMockupViews.length > 0 && effectiveMockupViews.every(m => m.backgroundUrl === effectiveMockupViews[0].backgroundUrl);

    // If admin provided mockups (or fallback generated), compute views
    const ALL_VIEWS = effectiveMockupViews.length > 0
        ? effectiveMockupViews.map((mv) => ({
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
            ...mv,
            label: mv.viewName || `${mv.side || 'center'} perspective`,
            type: 'photographic',
            offsetRatio: mv.side === 'left' ? 0.25 : (mv.side === 'right' ? 0.75 : 0.5),
            flipBg: mv.side === 'right' && (wrapType === 'mug' || wrapType === 'bottle' || wrapType === 'planter') && hasSameBackgrounds
        }))
        : DEFAULT_VIEWS.map(v => ({ ...v, wrapType }));

    const activeViewForCanvas = ALL_VIEWS[currentViewIndex] || ALL_VIEWS[0];
    const isPhotographicView = activeViewForCanvas?.type === 'photographic';
<<<<<<< HEAD
    const canvasWidth = 400;
    const canvasHeight = isPhotographicView ? 650 : 380;
=======

    // --- Dynamic canvas dimensions from printSizeMm ---
    // For photographic views: use fixed 400-wide display, but height derived from print ratio
    // For procedural: also respect print ratio so mug body looks correct
    const PREVIEW_CANVAS_W = 400;
    const printRatio = (printSizeMm && printSizeMm.widthMm && printSizeMm.heightMm)
        ? printSizeMm.widthMm / printSizeMm.heightMm
        : (wrapType === 'bottle' ? 0.6 : (wrapType === 'planter' ? 1.2 : 2.1)); // sensible defaults
    const canvasWidth = PREVIEW_CANVAS_W;
    // For the preview panel we want a portrait-ish canvas that shows the product well.
    // Keep the PRINT ratio for the design strip, but add padding for the product shape.
    // A 30% height bonus gives room for handle/product body around the design area.
    const canvasHeight = isPhotographicView ? 650 : Math.round(PREVIEW_CANVAS_W / printRatio * 1.3);
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584

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
<<<<<<< HEAD
            const dw = iw * scale; const dh = ih * scale;
            const dx = (boxW - dw) / 2 + (Number(bgTransform?.offsetX) || 0) * boxW * 0.24;
            const dy = (boxH - dh) / 2 + (Number(bgTransform?.offsetY) || 0) * boxH * 0.24;
            ctx.drawImage(img, dx, dy, dw, dh);
=======
            const dw = iw * scale;
            const dh = ih * scale;
            const rawDx = (boxW - dw) / 2 + (Number(bgTransform?.offsetX) || 0) * boxW * 0.24;
            const rawDy = (boxH - dh) / 2 + (Number(bgTransform?.offsetY) || 0) * boxH * 0.24;

            // Allow centering when image is smaller than box, but restrict to edges when zoomed in
            const dx = (dw <= boxW) ? rawDx : Math.min(0, Math.max(boxW - dw, rawDx));
            const dy = (dh <= boxH) ? rawDy : Math.min(0, Math.max(boxH - dh, rawDy));

            const isWrapProduct = wrapType === 'mug' || wrapType === 'bottle' || wrapType === 'planter';
            const hideHandleTrigger = activeView.side === 'center' && isWrapProduct && hasSameBackgrounds;

            if (hideHandleTrigger) {
                const p = activeView.placement || { x: 25, width: 50 };
                const destX = (p.x / 100) * boxW;
                const destW = (p.width / 100) * boxW;
                const cupCenter = destX + destW / 2;

                const isHandleLeft = cupCenter > (boxW / 2) - 5;

                // 1. Draw the safe, HANDLE-FREE side of the cup
                ctx.save();
                ctx.beginPath();
                if (isHandleLeft) {
                    ctx.rect(cupCenter, 0, boxW - cupCenter, boxH); // Safe side is Right
                } else {
                    ctx.rect(0, 0, cupCenter, boxH); // Safe side is Left
                }
                ctx.clip();
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();

                // 2. Draw the safe side AGAIN, but MIRRORED onto the hazardous handle side to erase it!
                ctx.save();
                ctx.beginPath();
                if (isHandleLeft) {
                    ctx.rect(0, 0, cupCenter, boxH); // Hazard side is Left
                } else {
                    ctx.rect(cupCenter, 0, boxW - cupCenter, boxH); // Hazard side is Right
                }
                ctx.clip();
                ctx.translate(cupCenter * 2, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();

            } else {
                ctx.save();
                if (activeView.flipBg) {
                    ctx.translate(boxW, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(img, dx, dy, dw, dh);
                ctx.restore();
            }
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
        };

        const renderWithImage = (designImg) => {
            if (activeView.type === 'photographic') {
                const bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                bgImg.onload = () => {
                    drawBackground(bgImg, W, H, activeView.bgTransform);
                    const p = activeView.placement;
<<<<<<< HEAD
                    const destX = (p.x / 100) * W; const destY = (p.y / 100) * H;
                    const destW = (p.width / 100) * W; const destH = (p.height / 100) * H;
                    const shapeType = normalizeShapeType(activeView.shapeType || slotShapeType || placeholderShapeBySide[activeSlotKey] || ((wrapType === 'mug' || wrapType === 'bottle') ? 'mug-wrap' : 'rectangle'));
                    const placementCurve = Number(p.curve) || 35;
=======

                    let shapeType = normalizeShapeType(
                        activeView.shapeType
                        || slotShapeType
                        || placeholderShapeBySide[activeSlotKey]
                        || 'rectangle'
                    );

                    const isWrapProduct = wrapType === 'mug' || wrapType === 'bottle' || wrapType === 'planter';
                    if (isWrapProduct && shapeType === 'rectangle') {
                        shapeType = 'mug-wrap';
                    }

                    let placementCurve = (p.curve !== undefined && p.curve !== null && !Number.isNaN(Number(p.curve)))
                        ? Number(p.curve)
                        : 0;

                    if (isWrapProduct && placementCurve === 0) {
                        placementCurve = 25; // Apply authentic curve to unconfigured mockups
                    }
                    let destX = (p.x / 100) * W;
                    let destY = (p.y / 100) * H;
                    const destW = (p.width / 100) * W;
                    let destH = (p.height / 100) * H;

                    // The system will now strictly follow the admin's generated placement box
                    // The admin MUST draw the box to exact bounds in the Mockup Editor Tab!

                    if (activeView.flipBg) {
                        destX = W - destX - destW; // Symmetrically mirror the placement position!
                    }
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584

                    ctx.save();
                    ctx.translate(destX, destY);
                    if (p.angle) { ctx.translate(destW / 2, destH / 2); ctx.rotate((p.angle * Math.PI) / 180); ctx.translate(-destW / 2, -destH / 2); }
                    applyShapeClip(ctx, shapeType, destW, destH, activeView.customPath, placementCurve);

                    const isWrapShape = shapeType === 'mug-wrap' || shapeType === 'wave';
                    const effectiveCurve = isWrapShape ? placementCurve : 0;

                    if (effectiveCurve > 0 && designImg && isWrapShape) {
                        const strips = Math.ceil(destW);
                        // A wrap design is a full cylinder (~3.14x the visible front width).
                        // So from any angle, you see roughly 1/3 to 38% of it.
                        const isWideWrap = (designImg.width / designImg.height) > 1.5;
                        const fov = isWideWrap ? 0.38 : 1.0;
                        const viewCenter = designImg.width * (activeView.offsetRatio || 0.5);
                        const viewWidth = designImg.width * fov;
                        const startX = viewCenter - viewWidth / 2;

                        for (let i = 0; i < strips; i++) {
                            const progress = i / strips;
                            const smile = Math.sin(progress * Math.PI);
<<<<<<< HEAD
                            const yOff = (effectiveCurve / 2) * smile;
                            const sX = Math.floor(progress * designImg.width);
                            const sW = Math.max(1, Math.ceil(designImg.width / strips));
                            try { ctx.drawImage(designImg, sX, 0, sW, designImg.height, i, yOff, 1, destH); } catch (e) {}
=======
                            // Top edge starts at 0, dips to `effectiveCurve`
                            const yOff = effectiveCurve * smile;

                            let sX = Math.floor(startX + (progress * viewWidth));
                            if (sX < 0) sX = 0;
                            if (sX > designImg.width - 1) sX = designImg.width - 1;

                            const sW = Math.max(1, Math.ceil(viewWidth / strips));

                            try {
                                ctx.drawImage(
                                    designImg,
                                    sX, 0, sW, designImg.height,
                                    i, yOff, 1, destH - effectiveCurve
                                );
                            } catch (e) { /* ignore */ }
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
                        }
                    } else if (designImg) {
                        // If flat, crop it properly if it's a wide wrap
                        const isWideWrap = (designImg.width / designImg.height) > 1.5;
                        const fov = isWideWrap ? 0.38 : 1.0;
                        const viewCenter = designImg.width * (activeView.offsetRatio || 0.5);
                        const viewWidth = designImg.width * fov;
                        let startX = viewCenter - viewWidth / 2;
                        if (startX < 0) startX = 0;
                        if (startX + viewWidth > designImg.width) startX = designImg.width - viewWidth;

                        try {
                            ctx.drawImage(
                                designImg,
                                startX, 0, viewWidth, designImg.height,
                                0, 0, destW, destH
                            );
                        } catch (e) { }
                    }
                    ctx.restore();

                    if (activeView.overlayUrl) {
<<<<<<< HEAD
                        const overlay = new Image(); overlay.crossOrigin = 'anonymous';
                        overlay.onload = () => { ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(overlay, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; setRendered(true); };
=======
                        const overlay = new Image();
                        overlay.crossOrigin = 'anonymous';
                        overlay.onload = () => {
                            ctx.save();
                            if (activeView.flipBg) {
                                ctx.translate(W, 0);
                                ctx.scale(-1, 1);
                            }
                            ctx.globalCompositeOperation = 'multiply';
                            ctx.drawImage(overlay, 0, 0, W, H);
                            ctx.restore();
                            setRendered(true);
                        };
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
                        overlay.src = activeView.overlayUrl;
                    } else { setRendered(true); }
                };
                bgImg.src = activeView.backgroundUrl;
            } else {
<<<<<<< HEAD
                ctx.fillStyle = '#1A1333';
                ctx.fillRect(0, 0, W, H);
=======
                // ─── OPTION B: PROCEDURAL CANVAS MUG ─────────────────────────────
                // The design strip MUST match the print area ratio (not arbitrary percentages)
                ctx.fillStyle = '#f8f8f8';
                ctx.fillRect(0, 0, W, H);

                let mugBodyPct = 0.82; // how much of canvas width the mug body occupies
                let curveDepth = 25; // Authentic curve

                if (wrapType === 'bottle') {
                    mugBodyPct = 0.5; curveDepth = 15;
                } else if (wrapType === 'planter') {
                    mugBodyPct = 0.72; curveDepth = 20;
                } else if (wrapType === 'phone') {
                    mugBodyPct = 0.52; curveDepth = 8;
                }

                const fov = 0.38;
                let mugWidth = W * mugBodyPct;
                let mugHeight = printRatio ? (mugWidth / (printRatio * fov)) : (H * 0.82);

                if (mugHeight > H * 0.9) {
                    mugHeight = H * 0.9;
                    if (printRatio) {
                        mugWidth = mugHeight * (printRatio * fov);
                    }
                }

                const mugX = (W - mugWidth) / 2;
                const mugY = (H - mugHeight) / 2 + 10;

                // --- Draw handle for mugs ---
                if (wrapType === 'mug') {
                    ctx.save(); ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 16; ctx.lineCap = 'round';
                    ctx.beginPath();
                    const handleRad = Math.min(mugHeight * 0.22, 60);
                    ctx.arc(mugX + mugWidth + 4, mugY + mugHeight / 2, handleRad, -Math.PI / 2.4, Math.PI / 2.4);
                    ctx.stroke(); ctx.restore();
                }

                // --- Draw explicitly visible Mug Body ---
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.shadowBlur = 15;
                ctx.translate(mugX, mugY);

                let bodyPathStr;
                if (wrapType === 'mug' || wrapType === 'bottle' || wrapType === 'planter') {
                    bodyPathStr = createMugSmilePath(mugWidth, mugHeight, curveDepth);
                } else {
                    bodyPathStr = `M 0 0 L ${mugWidth} 0 L ${mugWidth} ${mugHeight} L 0 ${mugHeight} Z`;
                }

                try {
                    ctx.fill(new Path2D(bodyPathStr));
                } catch (e) {
                    ctx.fillRect(0, 0, mugWidth, mugHeight);
                }
                ctx.restore();

                // --- Design strip: use FULL mug width and FULL height ---
                const designStripW = mugWidth;
                const designStripH = mugHeight;
                const designStripX = mugX;
                const designStripY = mugY;

                // For multi-slot (left/center/right), show just that 1/3 slice
                const slotCenterRatio = activeSlotKey === 'left' ? 0.25 : (activeSlotKey === 'right' ? 0.75 : 0.5);
                const slotW = designStripW;
                const slotX = designStripX;
                const slotY = designStripY;
                const slotH = designStripH;

                if (designImg) {
                    const clipKind = normalizeShapeType(
                        slotShapeType
                        || placeholderShapeBySide[activeSlotKey]
                        || ((wrapType === 'mug' || wrapType === 'bottle' || wrapType === 'planter') ? 'mug-wrap' : 'rectangle')
                    );
                    ctx.save();
                    ctx.translate(slotX, slotY);
                    applyShapeClip(ctx, clipKind, slotW, slotH, null, 35);

                    const iw = designImg.width;
                    const ih = designImg.height;

                    const isWideWrap = (iw / ih) > 1.5;
                    const fov = isWideWrap ? 0.38 : 1.0;
                    const viewCenter = iw * (activeView.offsetRatio || 0.5);
                    const viewWidth = iw * fov;
                    let startX = viewCenter - viewWidth / 2;

                    const { dx, dy, dw, dh } = getDrawBox({ width: viewWidth, height: ih }, slotW, slotH, selectedTransform);

                    if (clipKind === 'mug-wrap' || clipKind === 'wave') {
                        const strips = Math.max(12, Math.ceil(slotW));
                        for (let i = 0; i < strips; i++) {
                            const progress = i / strips;
                            const smile = Math.sin(progress * Math.PI);
                            const yOff = curveDepth * smile;

                            let sX = Math.floor(startX + (progress * viewWidth));
                            if (sX < 0) sX = 0;
                            if (sX > iw - 1) sX = iw - 1;

                            const sW = Math.max(1, Math.ceil(viewWidth / strips));
                            const sliceW = dw / strips;
                            try {
                                ctx.drawImage(designImg, sX, 0, sW, ih, dx + i * sliceW, dy + yOff, sliceW + 0.5, dh - curveDepth);
                            } catch (e) { /* ignore */ }
                        }
                    } else {
                        if (startX < 0) startX = 0;
                        if (startX + viewWidth > iw) startX = iw - viewWidth;
                        try {
                            ctx.drawImage(designImg, startX, 0, viewWidth, ih, 0, 0, slotW, slotH);
                        } catch (e) { }
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

                // Mug body outline / shading
                ctx.save();
                const mugBodyGrad = ctx.createLinearGradient(mugX, 0, mugX + mugWidth, 0);
                mugBodyGrad.addColorStop(0, 'rgba(0,0,0,0.12)');
                mugBodyGrad.addColorStop(0.45, 'rgba(255,255,255,0.08)');
                mugBodyGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
                ctx.fillStyle = mugBodyGrad;
                ctx.fillRect(mugX, mugY, mugWidth, mugHeight);
                ctx.restore();

                // Draw a subtle border around the mug body
                ctx.save();
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(mugX, mugY, mugWidth, mugHeight);
                ctx.restore();

>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
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
<<<<<<< HEAD
            <p className="text-[10px] font-bold text-accent-soft mt-4 uppercase tracking-[0.3em] italic">
                {ALL_VIEWS[currentViewIndex].label}
=======
            <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-wider">
                {ALL_VIEWS[currentViewIndex]?.label || 'VIEW'}
>>>>>>> fbc385fd47be61ea9fe8f8eb72a01af65bcbe584
            </p>
        </div>
    );
};

export default MugWrapPreview;
