import { useEffect, useRef, useState } from 'react';



const MugWrapPreview = ({ photoUrl, wrapType = 'mug', mugImgUrl }) => {
    const wrapCanvasRef = useRef(null);
    const [rendered, setRendered] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!photoUrl || !wrapCanvasRef.current) return;
        setRendered(false);
        setError(null);

        const canvas = wrapCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;

        const photo = new Image();
        photo.crossOrigin = 'anonymous';
        photo.onload = () => {
            ctx.clearRect(0, 0, W, H);

            // ─── GEOMETRY CONFIGURATION ──────────────────────────────────────────
            // Adjust dimensions based on wrapType
            let mugWidth = W * 0.7;
            let mugHeight = H * 0.75;
            let mugX = (W - mugWidth) / 2;
            let mugY = (H - mugHeight) / 2 + 20;
            let curveDepth = 28;

            if (wrapType === 'bottle') {
                mugWidth = W * 0.5;    // Thinner
                mugHeight = H * 0.85;  // Taller
                mugX = (W - mugWidth) / 2;
                mugY = (H - mugHeight) / 2 + 10;
                curveDepth = 15;       // Less curve
            } else if (wrapType === 'phone') {
                mugWidth = W * 0.55;
                mugHeight = H * 0.85;
                mugX = (W - mugWidth) / 2;
                mugY = (H - mugHeight) / 2 + 10;
                curveDepth = 8;        // Almost flat
            }

            // ─── DRAW MUG/BOTTLE BODY (Structure) ───────────────────────────────────────

            // 1. Handle (Only for mugs)
            if (wrapType === 'mug') {
                ctx.save();
                ctx.strokeStyle = '#e5e7eb'; // Light gray handle
                ctx.lineWidth = 18;
                ctx.lineCap = 'round';
                ctx.beginPath();
                const handleCenterY = mugY + mugHeight / 2;
                const handleRad = mugHeight * 0.25;
                // Arc for handle on the right side
                ctx.arc(mugX + mugWidth - 5, handleCenterY, handleRad, -Math.PI / 2.2, Math.PI / 2.2);
                ctx.stroke();
                // Handle shadow/highlight details
                ctx.strokeStyle = '#f3f4f6';
                ctx.lineWidth = 8;
                ctx.stroke();
                ctx.restore();
            }

            // ─── DRAW WRAPPED PHOTO ──────────────────────────────────────────────
            // We draw the photo slice by slice to achieve the cylindrical "smile" warp.

            const strips = mugWidth; // 1 pixel width per strip

            // To prevent aliasing at edges, we can clip to the mug shape first if needed,
            // but the slice math usually handles it well.

            for (let i = 0; i < strips; i++) {
                // Normalized coordinate x from -1 to 1 across the mug face
                // actually we map 0 to 1 for just the texture mapping
                const progress = i / strips; // 0 to 1

                // Calculate the "t" parameter for cylinder projection (-1 to +1)
                // However, linear mapping looks fine for simple mug previews.
                // For true cylinder, x_screen = sin(theta). We'll stick to a simpler
                // quadratic curve displacement for the "Smile".

                // X position on canvas
                const destX = mugX + i;

                // Elliptical Curve Offset (The "Smile")
                // Formula: y = depth * sqrt(1 - x^2) for ellipse, or simplified parabola
                // Using sine for smooth arc: sin(0..PI) goes 0->1->0. 
                // We want 0->1->0 for curve? No, we want Smile: High->Low->High.
                // Center (progress 0.5) should have MAX displacement (Lowest Y).

                // Let's use a Parabola/Sine approximation for the smile.
                // Center (0.5) -> Offset = curveDepth
                // Edges (0, 1) -> Offset = 0
                // Wait, visually: Center Y is LOWEST (Top edge curves down).
                // Sides Y is HIGHEST. 

                const smileFactor = Math.sin(progress * Math.PI); // 0 at edges, 1 at center
                const yOffset = curveDepth * smileFactor;

                // Source X: map canvas X to photo X
                // Adding slight non-linearity for cylinder effect (sides compressed)
                // theta goes from -PI/2 to PI/2
                const theta = (progress - 0.5) * Math.PI * 0.8; // visible range
                // srcX based on angle? For simple preview, linear is often cleaner for users
                // but let's do a slight adjustment for realism.
                const srcX = Math.floor(progress * photo.width);
                const srcW = Math.ceil(photo.width / strips);

                // Dest Y positions
                // Top edge: curved down
                const destYTop = mugY + yOffset;
                // Bottom edge: also curved down (parallel curve)
                const destYBottom = mugY + mugHeight + yOffset;
                const destH = destYBottom - destYTop;

                // Draw Slice
                try {
                    ctx.drawImage(
                        photo,
                        srcX, 0, Math.max(1, srcW), photo.height,
                        destX, destYTop, 1, destH
                    );
                } catch (e) { /* ignore rounding errors */ }
            }

            // ─── LIGHTING & OVERLAYS ─────────────────────────────────────────────

            // 1. Shading (Cylinder effect) - Darker at sides
            const shading = ctx.createLinearGradient(mugX, 0, mugX + mugWidth, 0);
            shading.addColorStop(0, 'rgba(0,0,0,0.15)');   // Left shadow
            shading.addColorStop(0.15, 'rgba(0,0,0,0.02)');
            shading.addColorStop(0.35, 'rgba(255,255,255,0.1)'); // Highlight
            shading.addColorStop(0.5, 'rgba(0,0,0,0)');    // Center clear
            shading.addColorStop(0.85, 'rgba(0,0,0,0.02)');
            shading.addColorStop(1, 'rgba(0,0,0,0.2)');    // Right shadow

            ctx.fillStyle = shading;
            // Complex clip to follow the curved top/bottom?
            // For simplicity in Canvas 2D without path tracing every slice:
            // We'll mask the whole mug area.

            // Construct the path of the mug face for clipping shadows/highlights
            ctx.beginPath();
            // Trace top curve
            for (let i = 0; i <= strips; i += 5) {
                const progress = i / strips;
                const smile = Math.sin(progress * Math.PI);
                ctx.lineTo(mugX + i, mugY + curveDepth * smile);
            }
            // Trace bottom curve (reverse)
            for (let i = strips; i >= 0; i -= 5) {
                const progress = i / strips;
                const smile = Math.sin(progress * Math.PI);
                ctx.lineTo(mugX + i, mugY + mugHeight + curveDepth * smile);
            }
            ctx.closePath();

            ctx.save();
            ctx.clip();
            ctx.fillRect(mugX, mugY, mugWidth, mugHeight + curveDepth);
            ctx.restore();

            // 2. Clear Glossy Shine (distinctive ceramic look)
            ctx.save();
            ctx.clip(); // use same clip path
            const shine = ctx.createLinearGradient(mugX, 0, mugX + mugWidth, 0);
            shine.addColorStop(0.2, 'rgba(255,255,255,0)');
            shine.addColorStop(0.25, 'rgba(255,255,255,0.4)'); // Strong highlight line
            shine.addColorStop(0.3, 'rgba(255,255,255,0)');
            ctx.fillStyle = shine;
            ctx.fillRect(mugX, mugY, mugWidth, mugHeight + curveDepth);
            ctx.restore();

            // ─── ROP & BOTTOM RIMS ───────────────────────────────────────────────
            // White ceramic rings to define the shape clearly

            // NOTE: The previous slice loop drew the image "down" from the top line.
            // But real mugs have a thickness. We can draw the top rim *above* the image area.
            // The top rim is an ellipse. 

            // Top Rim Ellipse
            // Center of ellipse is slightly above the image top-center
            const rimCenterY = mugY + curveDepth; // Approximate visual center of rim
            const rimHeight = curveDepth * 2;     // Ellipse height

            // Mask out the part of the image that might peek above the "back" of the rim?
            // Actually, with the "Smile" curve, we are seeing the front face. 
            // The top rim opening is visible.

            ctx.beginPath();
            // Draw ellipse for the cavity
            ctx.ellipse(mugX + mugWidth / 2, mugY + curveDepth, mugWidth / 2, curveDepth, 0, 0, Math.PI * 2);

            // Rim Gradients
            const rimGrad = ctx.createLinearGradient(mugX, mugY, mugX + mugWidth, mugY);
            rimGrad.addColorStop(0, '#ddd');
            rimGrad.addColorStop(0.5, '#fff');
            rimGrad.addColorStop(1, '#ddd');

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Interior of the mug (the hole)
            ctx.fillStyle = '#f3f4f6'; // Light grey interior
            ctx.fill();

            // Inner shadow of the mug hole
            const innerGrad = ctx.createRadialGradient(mugX + mugWidth / 2, mugY + curveDepth, mugWidth / 5, mugX + mugWidth / 2, mugY + curveDepth, mugWidth / 2);
            innerGrad.addColorStop(0, '#fff');
            innerGrad.addColorStop(1, '#d1d5db');
            ctx.fillStyle = innerGrad;
            ctx.fill();

            setRendered(true);
        };

        photo.src = photoUrl;
    }, [photoUrl, wrapType]);

    const config = {
        mug: { icon: '☕', label: '3D Mug Preview', desc: 'The actual print will wrap around the mug exactly as shown.' },
        bottle: { icon: '🫙', label: '3D Bottle Preview', desc: 'Realistic cylindrical preview of your bottle design.' },
        phone: { icon: '📱', label: '3D Case Preview', desc: 'Realistic mockup of how the design wraps around the case edge.' }
    }[wrapType] || { icon: '✨', label: '3D Preview', desc: 'Realistic 3D mockup of your custom design.' };

    return (
        <div className="mt-6 flex flex-col items-center animate-fade-in-up">
            <h3 className="text-gray-700 font-bold mb-2 flex items-center gap-2">
                {config.icon} {config.label}
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Live</span>
            </h3>
            <div className="relative group">
                <canvas
                    ref={wrapCanvasRef}
                    width={400}
                    height={380}
                    className="rounded-xl shadow-lg border border-gray-100 bg-white"
                />
                {!rendered && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center max-w-[280px]">
                {config.desc}
            </p>
        </div>
    );
};

export default MugWrapPreview;
