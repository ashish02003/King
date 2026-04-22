import { useEffect, useRef } from 'react';

/**
 * MugSidePreview
 * ──────────────
 * Renders one or more live preview "cards" based on the active
 * customization mode chosen in MugCustomizerPanel.
 *
 * Props
 * ─────
 * mode        : 'photoBothSides' | 'photoAndText' | 'wrapPhotos' | 'background'
 * frontPhoto  : string | null
 * backPhoto   : string | null   (used when mode=photoBothSides, same as frontPhoto)
 * wrapPhotos  : string[]
 * backText    : string
 * bgColor     : string   (hex)
 * wrapType    : 'mug' | 'bottle'
 * productName : string
 */
const MugSidePreview = ({
    mode,
    frontPhoto,
    backPhoto,
    wrapPhotos = [],
    backText = '',
    bgColor = '#ffffff',
    wrapType = 'mug',
    productName = '',
}) => {
    /* ─────────────────────────────────────────────────────────
       Helper: renders a cylindrical product side on a <canvas>
       ───────────────────────────────────────────────────────── */
    const CylinderCanvas = ({ photoUrl, color, text, label, size = 180 }) => {
        const ref = useRef(null);

        useEffect(() => {
            const canvas = ref.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;

            ctx.clearRect(0, 0, W, H);

            // Geometry
            const isBottle = wrapType === 'bottle';
            const mugW = isBottle ? W * 0.52 : W * 0.72;
            const mugH = isBottle ? H * 0.80 : H * 0.68;
            const mugX = (W - mugW) / 2;
            const mugY = (H - mugH) / 2 + (isBottle ? 5 : 14);
            const curve = isBottle ? 10 : 22;

            const drawBody = (fillFn) => {
                ctx.beginPath();
                for (let i = 0; i <= mugW; i += 4) {
                    const p = i / mugW;
                    const smile = Math.sin(p * Math.PI);
                    ctx.lineTo(mugX + i, mugY + curve * smile);
                }
                for (let i = mugW; i >= 0; i -= 4) {
                    const p = i / mugW;
                    const smile = Math.sin(p * Math.PI);
                    ctx.lineTo(mugX + i, mugY + mugH + curve * smile);
                }
                ctx.closePath();
                fillFn();
            };

            // 1. Background fill
            drawBody(() => {
                ctx.fillStyle = color || '#ffffff';
                ctx.fill();
            });

            // 2. Photo wrap (cylinder strip-by-strip)
            if (photoUrl) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    ctx.save();
                    drawBody(() => ctx.clip());

                    const strips = Math.ceil(mugW);
                    for (let i = 0; i < strips; i++) {
                        const p = i / strips;
                        const smile = Math.sin(p * Math.PI);
                        const destX = mugX + i;
                        const destYTop = mugY + curve * smile;
                        const destYBottom = mugY + mugH + curve * smile;
                        const srcX = Math.floor(p * img.width);
                        const srcW = Math.max(1, Math.ceil(img.width / strips));
                        ctx.drawImage(img, srcX, 0, srcW, img.height, destX, destYTop, 1, destYBottom - destYTop);
                    }

                    ctx.restore();
                    addOverlays();
                };
                img.src = photoUrl;
            } else if (text) {
                // 2b. Text side
                ctx.save();
                drawBody(() => ctx.clip());
                ctx.fillStyle = (color === '#000000' || color === '#000') ? '#ffffff' : '#30174D';
                ctx.font = `bold ${Math.max(10, Math.min(16, mugW / Math.max(text.length, 6)))}px 'Plus Jakarta Sans', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Word-wrap
                const words = text.split(' ');
                const lines = [];
                let line = '';
                const maxW = mugW * 0.8;
                words.forEach(w => {
                    const test = line + (line ? ' ' : '') + w;
                    if (ctx.measureText(test).width > maxW && line) {
                        lines.push(line);
                        line = w;
                    } else {
                        line = test;
                    }
                });
                if (line) lines.push(line);

                const lineH = 20;
                const startY = mugY + mugH / 2 - ((lines.length - 1) * lineH) / 2;
                lines.forEach((l, i) => {
                    ctx.fillText(l, mugX + mugW / 2, startY + i * lineH);
                });
                ctx.restore();
                addOverlays();
            } else {
                addOverlays();
            }

            function addOverlays() {
                // Shading gradient  
                const shade = ctx.createLinearGradient(mugX, 0, mugX + mugW, 0);
                shade.addColorStop(0, 'rgba(0,0,0,0.18)');
                shade.addColorStop(0.12, 'rgba(0,0,0,0.03)');
                shade.addColorStop(0.3, 'rgba(255,255,255,0.1)');
                shade.addColorStop(0.5, 'rgba(0,0,0,0)');
                shade.addColorStop(0.88, 'rgba(0,0,0,0.04)');
                shade.addColorStop(1, 'rgba(0,0,0,0.22)');

                ctx.save();
                drawBody(() => ctx.clip());
                ctx.fillStyle = shade;
                ctx.fillRect(mugX, mugY, mugW, mugH + curve);

                // Shine stripe
                const shine = ctx.createLinearGradient(mugX, 0, mugX + mugW, 0);
                shine.addColorStop(0.22, 'rgba(255,255,255,0)');
                shine.addColorStop(0.26, 'rgba(255,255,255,0.38)');
                shine.addColorStop(0.30, 'rgba(255,255,255,0)');
                ctx.fillStyle = shine;
                ctx.fillRect(mugX, mugY, mugW, mugH + curve);
                ctx.restore();

                // Handle (mug only)
                if (!isBottle) {
                    ctx.save();
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 14;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    const hy = mugY + mugH / 2;
                    const hr = mugH * 0.22;
                    ctx.arc(mugX + mugW - 4, hy, hr, -Math.PI / 2.2, Math.PI / 2.2);
                    ctx.stroke();
                    ctx.strokeStyle = '#f8fafc';
                    ctx.lineWidth = 6;
                    ctx.stroke();
                    ctx.restore();
                }

                // Top rim ellipse
                ctx.beginPath();
                ctx.ellipse(mugX + mugW / 2, mugY + curve, mugW / 2, curve, 0, 0, Math.PI * 2);
                const rimG = ctx.createLinearGradient(mugX, mugY, mugX + mugW, mugY);
                rimG.addColorStop(0, '#ddd');
                rimG.addColorStop(0.5, '#fff');
                rimG.addColorStop(1, '#ddd');
                ctx.strokeStyle = rimG;
                ctx.lineWidth = 3;
                ctx.stroke();
                const iG = ctx.createRadialGradient(mugX + mugW / 2, mugY + curve, mugW / 8, mugX + mugW / 2, mugY + curve, mugW / 2);
                iG.addColorStop(0, '#fff');
                iG.addColorStop(1, '#d1d5db');
                ctx.fillStyle = iG;
                ctx.fill();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [photoUrl, color, text, wrapType]);

        return (
            <div className="flex flex-col items-center gap-2">
                <span
                    className="text-[9px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full"
                    style={{ background: 'rgba(86,60,140,0.08)', color: '#563C8C' }}
                >
                    {label}
                </span>
                <canvas
                    ref={ref}
                    width={size}
                    height={Math.round(size * 0.95)}
                    className="rounded-2xl"
                    style={{
                        background: '#f8f5ff',
                        boxShadow: '0 8px 24px rgba(86,60,140,0.12)',
                        border: '1.5px solid rgba(86,60,140,0.1)',
                    }}
                />
            </div>
        );
    };

    /* ────────── Wrap Photos Canvas (tiled) ────────────────────── */
    const WrapCanvas = ({ photos, color }) => {
        const ref = useRef(null);

        useEffect(() => {
            const canvas = ref.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const isBottle = wrapType === 'bottle';
            const mugW = isBottle ? W * 0.52 : W * 0.72;
            const mugH = isBottle ? H * 0.80 : H * 0.68;
            const mugX = (W - mugW) / 2;
            const mugY = (H - mugH) / 2 + (isBottle ? 5 : 14);
            const curve = isBottle ? 10 : 22;

            const validPhotos = photos.filter(Boolean);
            const count = Math.max(1, validPhotos.length);

            const drawBodyPath = () => {
                ctx.beginPath();
                for (let i = 0; i <= mugW; i += 4) {
                    const p = i / mugW;
                    ctx.lineTo(mugX + i, mugY + curve * Math.sin(p * Math.PI));
                }
                for (let i = mugW; i >= 0; i -= 4) {
                    const p = i / mugW;
                    ctx.lineTo(mugX + i, mugY + mugH + curve * Math.sin(p * Math.PI));
                }
                ctx.closePath();
            };

            // Background
            ctx.save();
            drawBodyPath();
            ctx.fillStyle = color || '#ffffff';
            ctx.fill();
            ctx.restore();

            if (validPhotos.length === 0) {
                finalize();
                return;
            }

            let loaded = 0;
            const imgs = validPhotos.map(url => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    loaded++;
                    if (loaded === validPhotos.length) renderAll(imgs);
                };
                img.src = url;
                return img;
            });

            function renderAll(imgArr) {
                const sliceW = mugW / count;
                imgArr.forEach((img, idx) => {
                    const startX = mugX + idx * sliceW;
                    ctx.save();
                    drawBodyPath();
                    ctx.clip();

                    const strips = Math.ceil(sliceW);
                    for (let i = 0; i < strips; i++) {
                        const pLocal = i / strips;
                        const pGlobal = (idx * sliceW + i) / mugW;
                        const smile = Math.sin(pGlobal * Math.PI);
                        const destX = startX + i;
                        const destYTop = mugY + curve * smile;
                        const destH = mugH; // simplified for tiled
                        const srcX = Math.floor(pLocal * img.width);
                        const srcW = Math.max(1, Math.ceil(img.width / strips));
                        ctx.drawImage(img, srcX, 0, srcW, img.height, destX, destYTop, 1, destH);
                    }

                    // Divider line between tiles
                    if (idx > 0) {
                        const lineY0 = mugY + curve * Math.sin((idx / count) * Math.PI);
                        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(startX, lineY0);
                        ctx.lineTo(startX, lineY0 + mugH);
                        ctx.stroke();
                    }
                    ctx.restore();
                });
                finalize();
            }

            function finalize() {
                // Shading
                const shade = ctx.createLinearGradient(mugX, 0, mugX + mugW, 0);
                shade.addColorStop(0, 'rgba(0,0,0,0.18)');
                shade.addColorStop(0.15, 'rgba(0,0,0,0.02)');
                shade.addColorStop(0.5, 'rgba(0,0,0,0)');
                shade.addColorStop(0.85, 'rgba(0,0,0,0.03)');
                shade.addColorStop(1, 'rgba(0,0,0,0.22)');
                ctx.save();
                drawBodyPath();
                ctx.clip();
                ctx.fillStyle = shade;
                ctx.fillRect(mugX, mugY, mugW, mugH + curve);
                const shine = ctx.createLinearGradient(mugX, 0, mugX + mugW, 0);
                shine.addColorStop(0.22, 'rgba(255,255,255,0)');
                shine.addColorStop(0.26, 'rgba(255,255,255,0.36)');
                shine.addColorStop(0.3, 'rgba(255,255,255,0)');
                ctx.fillStyle = shine;
                ctx.fillRect(mugX, mugY, mugW, mugH + curve);
                ctx.restore();

                if (!isBottle) {
                    ctx.save();
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.lineWidth = 14;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(mugX + mugW - 4, mugY + mugH / 2, mugH * 0.22, -Math.PI / 2.2, Math.PI / 2.2);
                    ctx.stroke();
                    ctx.strokeStyle = '#f8fafc';
                    ctx.lineWidth = 6;
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.beginPath();
                ctx.ellipse(mugX + mugW / 2, mugY + curve, mugW / 2, curve, 0, 0, Math.PI * 2);
                const iG = ctx.createRadialGradient(mugX + mugW / 2, mugY + curve, mugW / 8, mugX + mugW / 2, mugY + curve, mugW / 2);
                iG.addColorStop(0, '#fff');
                iG.addColorStop(1, '#d1d5db');
                ctx.fillStyle = iG;
                ctx.fill();
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [photos, color, wrapType]);

        return (
            <div className="flex flex-col items-center gap-2 w-full">
                <span
                    className="text-[9px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full"
                    style={{ background: 'rgba(86,60,140,0.08)', color: '#563C8C' }}
                >
                    360° Wrap Preview
                </span>
                <canvas
                    ref={ref}
                    width={300}
                    height={285}
                    className="rounded-2xl w-full"
                    style={{
                        background: '#f8f5ff',
                        boxShadow: '0 8px 24px rgba(86,60,140,0.12)',
                        border: '1.5px solid rgba(86,60,140,0.1)',
                        maxWidth: 300,
                    }}
                />
                {photos.filter(Boolean).length === 0 && (
                    <p className="text-[10px] text-purple-300 text-center font-medium">
                        Upload at least one photo above to see the preview
                    </p>
                )}
            </div>
        );
    };

    /* ─────────────────── Background preview ─────────────────── */
    const BgPreview = ({ color }) => (
        <div className="flex flex-col items-center gap-2">
            <span
                className="text-[9px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full"
                style={{ background: 'rgba(86,60,140,0.08)', color: '#563C8C' }}
            >
                Background Preview
            </span>
            <CylinderCanvas
                photoUrl={null}
                color={color}
                text={null}
                label=""
                size={200}
            />
        </div>
    );

    const hasAnyContent =
        frontPhoto ||
        backPhoto ||
        wrapPhotos.some(Boolean) ||
        backText ||
        mode === 'background';

    if (!hasAnyContent) return null;

    return (
        <div
            className="w-full rounded-3xl overflow-hidden mt-3"
            style={{
                background: 'linear-gradient(135deg, #fdfbff 0%, #f3eeff 100%)',
                border: '1.5px solid rgba(86,60,140,0.12)',
                boxShadow: '0 8px 32px rgba(86,60,140,0.08)',
            }}
        >
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(86,60,140,0.08)' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#563C8C' }}>
                    Live Product Preview
                </p>
                <p className="text-[11px] text-gray-400 font-medium">
                    {productName} · {wrapType === 'bottle' ? 'Bottle' : 'Mug'} mock-up
                </p>
            </div>

            <div className="p-5">
                {/* photoBothSides */}
                {mode === 'photoBothSides' && frontPhoto && (
                    <div className="grid grid-cols-2 gap-4">
                        <CylinderCanvas photoUrl={frontPhoto} color={bgColor} label="Front Side" size={150} />
                        <CylinderCanvas photoUrl={frontPhoto} color={bgColor} label="Back Side" size={150} />
                    </div>
                )}

                {/* photoAndText */}
                {mode === 'photoAndText' && (
                    <div className="grid grid-cols-2 gap-4">
                        <CylinderCanvas photoUrl={frontPhoto} color={bgColor} label="Front Side" size={150} />
                        <CylinderCanvas photoUrl={null} color={bgColor} text={backText || 'Your text here'} label="Back Side" size={150} />
                    </div>
                )}

                {/* wrapPhotos */}
                {mode === 'wrapPhotos' && (
                    <div className="flex justify-center">
                        <WrapCanvas photos={wrapPhotos} color={bgColor} />
                    </div>
                )}

                {/* background */}
                {mode === 'background' && (
                    <div className="flex justify-center">
                        <BgPreview color={bgColor} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MugSidePreview;
