import { useRef, useState } from 'react';

/**
 * MugCustomizerPanel
 * ──────────────────
 * Renders BELOW the canvas for Mug / Cup / Bottle categories.
 * Gives the user 4 customization modes:
 *  1. photoBothSides  – one photo applied to both front & back
 *  2. photoAndText    – front photo + back text
 *  3. wrapPhotos      – 1, 2 or 3 photos tiled around the wrap
 *  4. background      – pick a solid background colour
 *
 * Props
 * ─────
 * mode            : string  – current active mode key
 * onModeChange    : fn(mode) – called when user picks a mode
 * frontPhoto      : string | null  – data-url / cloudinary url of front photo
 * backPhoto       : string | null
 * wrapPhotos      : string[]       – up to 3 items
 * backText        : string
 * bgColor         : string  – hex value
 * onFrontPhoto    : fn(file)
 * onBackPhoto     : fn(file)
 * onWrapPhoto     : fn(index, file)
 * onBackTextChange: fn(str)
 * onBgColorChange : fn(hex)
 */
const MugCustomizerPanel = ({
    mode,
    onModeChange,
    frontPhoto,
    backPhoto,
    wrapPhotos = [],
    backText,
    bgColor,
    onFrontPhoto,
    onBackPhoto,
    onWrapPhoto,
    onBackTextChange,
    onBgColorChange,
}) => {
    const frontRef = useRef(null);
    const backRef = useRef(null);
    const wrapRefs = [useRef(null), useRef(null), useRef(null)];

    const MODES = [
        {
            key: 'photoBothSides',
            icon: '🔄',
            label: 'Photo Both Sides',
            desc: 'Same photo on front & back',
        },
        {
            key: 'photoAndText',
            icon: '📝',
            label: 'Photo + Text',
            desc: 'Photo on front, text on back',
        },
        {
            key: 'wrapPhotos',
            icon: '🖼️',
            label: 'Wrap 1–3 Photos',
            desc: 'Tile 1, 2 or 3 photos around',
        },
        {
            key: 'background',
            icon: '🎨',
            label: 'Background Color',
            desc: 'Solid colour behind your design',
        },
    ];

    const handleFile = (inputRef, callback) => {
        const file = inputRef.current?.files?.[0];
        if (!file) return;
        callback(file);
        inputRef.current.value = '';
    };

    // ── Shared UploadBox sub-component ──────────────────────────────────────
    const UploadBox = ({ label, previewUrl, inputRef, onPick, accent = '#563C8C' }) => (
        <div className="flex flex-col gap-2">
            <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: accent }}
            >
                {label}
            </span>
            <div
                onClick={() => inputRef.current?.click()}
                className="relative cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed transition-all hover:scale-[1.02] active:scale-100"
                style={{
                    borderColor: previewUrl ? 'transparent' : '#A189CC',
                    background: previewUrl ? 'transparent' : 'rgba(86,60,140,0.04)',
                    minHeight: 110,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt={label}
                            className="w-full h-full object-cover rounded-2xl"
                            style={{ maxHeight: 130 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 rounded-2xl">
                            <span className="text-white text-xs font-black">Change Photo</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4 px-3 text-center">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ background: 'rgba(86,60,140,0.08)' }}
                        >
                            📸
                        </div>
                        <span className="text-[11px] font-bold text-purple-400">
                            Tap to upload
                        </span>
                        <span className="text-[9px] text-gray-400">JPG, PNG, WEBP</span>
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={() => handleFile(inputRef, onPick)}
            />
        </div>
    );

    return (
        <div
            className="w-full rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #fdfbff 0%, #f3eeff 100%)',
                border: '1.5px solid rgba(86,60,140,0.12)',
                boxShadow: '0 8px 32px rgba(86,60,140,0.08)',
            }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="px-5 pt-5 pb-3"
                style={{ borderBottom: '1px solid rgba(86,60,140,0.08)' }}
            >
                <p
                    className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
                    style={{ color: '#563C8C' }}
                >
                    Customization Mode
                </p>
                <p className="text-[11px] text-gray-400 font-medium">
                    Choose how you want to personalise this product
                </p>
            </div>

            {/* ── Mode Buttons ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 p-4">
                {MODES.map((m) => {
                    const active = mode === m.key;
                    return (
                        <button
                            key={m.key}
                            onClick={() => onModeChange(m.key)}
                            className="flex flex-col items-start gap-1 p-3 rounded-2xl text-left transition-all active:scale-95"
                            style={{
                                background: active
                                    ? 'linear-gradient(135deg, #563C8C, #7B54BC)'
                                    : 'rgba(255,255,255,0.9)',
                                border: active
                                    ? '1.5px solid #563C8C'
                                    : '1.5px solid rgba(86,60,140,0.12)',
                                boxShadow: active
                                    ? '0 4px 16px rgba(86,60,140,0.25)'
                                    : '0 2px 8px rgba(0,0,0,0.04)',
                                color: active ? '#fff' : '#563C8C',
                            }}
                        >
                            <span className="text-lg leading-none">{m.icon}</span>
                            <span
                                className="text-[11px] font-black leading-tight"
                                style={{ color: active ? '#fff' : '#30174D' }}
                            >
                                {m.label}
                            </span>
                            <span
                                className="text-[9px] font-medium leading-tight"
                                style={{ color: active ? 'rgba(255,255,255,0.75)' : '#9b7bc7' }}
                            >
                                {m.desc}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ══ Mode Content ════════════════════════════════════════════════ */}
            <div
                className="px-4 pb-5"
                style={{ borderTop: '1px solid rgba(86,60,140,0.06)' }}
            >
                {/* ── Mode 1: Photo Both Sides ─── */}
                {mode === 'photoBothSides' && (
                    <div className="pt-4 space-y-3">
                        <UploadBox
                            label="Front & Back Photo (same image)"
                            previewUrl={frontPhoto}
                            inputRef={frontRef}
                            onPick={onFrontPhoto}
                        />
                        <p className="text-[10px] text-purple-400 font-medium text-center pb-1">
                            This photo will be printed on <strong>both sides</strong> of the product.
                        </p>
                    </div>
                )}

                {/* ── Mode 2: Photo + Text ─── */}
                {mode === 'photoAndText' && (
                    <div className="pt-4 space-y-4">
                        <UploadBox
                            label="Front Side – Photo"
                            previewUrl={frontPhoto}
                            inputRef={frontRef}
                            onPick={onFrontPhoto}
                        />
                        <div className="flex flex-col gap-2">
                            <span
                                className="text-[10px] font-black uppercase tracking-widest"
                                style={{ color: '#563C8C' }}
                            >
                                Back Side – Text
                            </span>
                            <textarea
                                rows={3}
                                placeholder="Type your message for the back side…"
                                value={backText || ''}
                                onChange={(e) => onBackTextChange(e.target.value)}
                                className="w-full rounded-2xl p-3 text-sm font-medium resize-none focus:outline-none transition-all"
                                style={{
                                    border: '1.5px solid rgba(86,60,140,0.2)',
                                    background: 'rgba(255,255,255,0.9)',
                                    color: '#30174D',
                                    boxShadow: '0 2px 8px rgba(86,60,140,0.06)',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Mode 3: Wrap 1-3 Photos ─── */}
                {mode === 'wrapPhotos' && (
                    <div className="pt-4 space-y-3">
                        <p className="text-[10px] text-purple-400 font-medium pb-1">
                            Upload 1, 2, or 3 photos — they will be tiled around the product wrap.
                        </p>
                        {[0, 1, 2].map((i) => (
                            <UploadBox
                                key={i}
                                label={`Photo ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                                previewUrl={wrapPhotos[i] || null}
                                inputRef={wrapRefs[i]}
                                onPick={(file) => onWrapPhoto(i, file)}
                                accent={i === 0 ? '#563C8C' : '#9b7bc7'}
                            />
                        ))}
                    </div>
                )}

                {/* ── Mode 4: Background Color ─── */}
                {mode === 'background' && (
                    <div className="pt-4 space-y-4">
                        <p className="text-[10px] text-purple-400 font-medium pb-1">
                            Pick a background colour that will fill the product surface behind your design.
                        </p>

                        {/* Quick palette */}
                        <div className="grid grid-cols-6 gap-2">
                            {[
                                '#FFFFFF', '#000000', '#563C8C', '#ef4444',
                                '#3b82f6', '#22c55e', '#f59e0b', '#ec4899',
                                '#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316',
                            ].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => onBgColorChange(c)}
                                    className="w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 active:scale-95"
                                    style={{
                                        background: c,
                                        borderColor: bgColor === c ? '#563C8C' : 'rgba(0,0,0,0.08)',
                                        boxShadow: bgColor === c ? '0 0 0 3px rgba(86,60,140,0.3)' : 'none',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Custom colour picker */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(86,60,140,0.12)' }}>
                            <input
                                type="color"
                                value={bgColor || '#FFFFFF'}
                                onChange={(e) => onBgColorChange(e.target.value)}
                                className="w-12 h-10 rounded-xl cursor-pointer border-none outline-none"
                                style={{ padding: 2 }}
                            />
                            <div>
                                <p className="text-[11px] font-black text-purple-700">Custom Colour</p>
                                <p className="text-[9px] font-mono text-gray-400">{(bgColor || '#FFFFFF').toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MugCustomizerPanel;
