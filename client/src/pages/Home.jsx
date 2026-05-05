import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE } from '../utils/api';
import { FaChevronRight, FaQuoteLeft, FaShieldAlt, FaGem, FaTruck, FaBoxOpen, FaKey, FaCoffee, FaTshirt, FaWineBottle } from 'react-icons/fa';
import heroShowcase from '../assets/righthero.png';
import curatedBottle from '../assets/curated_bottle.png';
import curatedKeychain from '../assets/curated_keychain.png';
import curatedMug from '../assets/curated_mug.png';
import curatedTshirt from '../assets/curated_tshirt.png';
import bestseller1 from '../assets/bestseller_1.png';
import bestseller2 from '../assets/bestseller_2.png';
import bestseller3 from '../assets/bestseller_3.png';
import bestseller4 from '../assets/bestseller_4.png';

import luxuryBottle from '../assets/luxury_bottle.png';
import luxuryMug from '../assets/luxury_mug.png';
import luxuryTshirt from '../assets/luxury_tshirt.png';
import luxuryKeychain from '../assets/luxury_keychain.png';
import luxuryFrame from '../assets/luxury_frame.png';

const Home = () => {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, categoriesRes] = await Promise.all([
                    axios.get(`${API_BASE}/templates`),
                    axios.get(`${API_BASE}/categories`)
                ]);
                setTemplates(templatesRes.data);
                setCategories(categoriesRes.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const renderPopularSection = (title, keywords, bgStyle, imageOverride) => {
        const categoryTemplates = templates.filter(t => {
            const cat = (t.category || '').toLowerCase();
            const name = (t.name || '').toLowerCase();
            return keywords.some(k => cat.includes(k) || name.includes(k));
        }).slice(0, 4);

        if (categoryTemplates.length === 0) return null;

        return (
            <section key={title} className={`py-24 md:py-32 ${bgStyle} relative`}>
                {bgStyle === 'bg-primary-dark' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.04]"></div>}
                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col items-center text-center mb-16 space-y-4">
                        <span className="text-gold text-[10px] font-semibold uppercase tracking-[0.4em]">Popular</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-white">
                            {title} <span className="text-gold">Collection</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-[1px] bg-gold/40"></div>
                            <div className="w-1.5 h-1.5 rotate-45 bg-gold/60"></div>
                            <div className="w-8 h-[1px] bg-gold/40"></div>
                        </div>
                        <Link to={`/category/${title}`} className="text-white/40 hover:text-gold text-xs uppercase tracking-[0.2em] transition-colors mt-4 flex items-center gap-2">
                            View All {title}s <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {categoryTemplates.map((template) => (
                            <Link
                                key={template._id}
                                to={`/product/${template._id}`}
                                className="group relative flex flex-col rounded-[1.25rem] bg-[#1A1333] border border-[#2a214a] overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:border-gold/50 hover:shadow-glow"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden w-full bg-[#1A1333]">
                                    <img
                                        src={imageOverride || template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                        alt={template.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1333] via-[#1A1333]/20 to-transparent"></div>
                                    
                                    <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center text-gold/60 group-hover:border-gold group-hover:text-gold transition-colors duration-300 backdrop-blur-sm bg-primary-dark/50 z-10">
                                        <FaGem size={12} />
                                    </div>
                                </div>
                                
                                <div className="p-6 pt-2 pb-7 relative z-10 bg-[#1A1333] flex flex-col flex-grow">
                                    <h3 className="text-[1.35rem] font-serif text-white mb-1 truncate">{template.name}</h3>
                                    <p className="text-gold font-serif text-xl mb-5 flex-grow">₹{Math.round((template.basePrice || 0) * (1 + (template.gst || 0) / 100))}</p>
                                    <span className="text-gold text-[10px] font-semibold uppercase tracking-[0.2em] group-hover:tracking-[0.25em] transition-all duration-300 flex items-center gap-2 mt-auto">
                                        View Product <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        );
    };

    return (
        <div className="bg-primary-dark min-h-screen overflow-hidden">

            {/* ═══════════════════════════════════════════════════════
                HERO — Matching reference: image bleeds right, no cards
            ═══════════════════════════════════════════════════════ */}
            <section className="relative min-h-[100vh] overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F0B1F] via-[#12102A] to-[#1A1333]"></div>

                {/* Subtle purple ambient light on right */}
                <div className="absolute top-[20%] right-[5%] w-[600px] h-[500px] bg-[#2a1a5e]/20 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-0 right-[15%] w-[400px] h-[300px] bg-[#3d2477]/10 rounded-full blur-[120px]"></div>

                {/* ── Hero Product Image — positioned absolutely, bleeds right ── */}
                <div className="absolute right-0 bottom-16 top-[16%] w-[60%] lg:w-[65%] hidden md:flex items-end justify-center pointer-events-none">
                    <img
                        src={heroShowcase}
                        alt="Premium photo frames, personalized bottles, mugs, t-shirts and custom products"
                        className="w-full max-h-[95%] object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                    />
                </div>

                {/* ── Text Content ── */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-0 min-h-[100vh] flex items-center">
                    <div className="w-full lg:w-[46%] py-32 -mt-6 space-y-8 lg:-ml-8">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 animate-fadeIn">
                            <span className="inline-flex items-center gap-2 bg-gold/[0.12] border border-gold/25 rounded-full px-4 py-2">
                                <span className="text-gold text-sm">✦</span>
                                <span className="text-[11px] font-bold text-gold uppercase tracking-[0.18em]">New Arrival</span>
                            </span>
                            <span className="text-[11px] font-medium text-white/40 uppercase tracking-[0.12em]">Premium Photo Frames & More</span>
                        </div>

                        {/* Main heading */}
                        <h1
                            className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.4rem] font-serif text-white leading-[1.05] tracking-[-0.02em] animate-fadeIn"
                            style={{ animationDelay: '0.1s' }}
                        >
                            Preserve Your
                            <br />
                            Moments
                            <br />
                            <span className="text-gold italic" style={{ fontStyle: 'italic' }}>in Style.</span>
                        </h1>

                        {/* Subtext */}
                        <p
                            className="text-white/45 text-[16px] md:text-[18px] leading-[1.7] max-w-[460px] animate-fadeIn"
                            style={{ animationDelay: '0.2s' }}
                        >
                            Premium quality photo frames, personalized bottles,
                            custom printed t-shirts and more –
                            crafted to turn your memories into timeless keepsakes.
                        </p>

                        {/* CTA */}
                        <div
                            className="flex flex-wrap gap-3 pt-1 animate-fadeIn"
                            style={{ animationDelay: '0.3s' }}
                        >
                            <Link
                                to="/#designs"
                                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-gold-dark via-gold to-gold-light text-primary-dark font-bold py-3 px-7 rounded-lg text-xs uppercase tracking-[0.15em] hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 group"
                            >
                                Explore Collection
                                <FaChevronRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <Link
                                to="/#designs"
                                className="inline-flex items-center gap-2 border border-white/20 text-white/80 font-bold py-3 px-7 rounded-lg text-xs uppercase tracking-[0.15em] hover:border-white/40 hover:text-white transition-all duration-300"
                            >
                                View Designs
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile hero image (shows below text on small screens) */}
                <div className="md:hidden relative w-full px-4 -mt-4 pb-8">
                    <img
                        src={heroShowcase}
                        alt="Product showcase"
                        className="w-full object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                    />
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                TRUST BAR — 4 horizontal icons
            ═══════════════════════════════════════════ */}
            <section className="border-t border-b border-white/[0.06] bg-[#0d0a1a]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
                        {[
                            { icon: <FaShieldAlt />, title: 'Premium Quality', desc: 'Finest materials & long lasting' },
                            { icon: <FaGem />, title: 'Personalized For You', desc: 'Made uniquely for your memories' },
                            { icon: <FaTruck />, title: 'Fast Delivery', desc: 'Pan India delivery' },
                            { icon: <FaBoxOpen />, title: 'Secure Packaging', desc: 'Safe, secure & damage free' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3.5 md:justify-center">
                                <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center text-gold flex-shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-white text-[11px] font-bold uppercase tracking-[0.08em]">{item.title}</p>
                                    <p className="text-white/30 text-[10px] mt-0.5 leading-tight">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                COLLECTIONS / CATEGORIES
            ═══════════════════════════════════════════ */}
            <section id="designs" className="py-24 md:py-32 relative">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex flex-col items-center text-center mb-16 space-y-4">
                        <span className="text-gold text-[10px] font-semibold uppercase tracking-[0.4em]">Our Collections</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-white">
                            Curated <span className="text-gold">Designs</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-[1px] bg-gold/40"></div>
                            <div className="w-1.5 h-1.5 rotate-45 bg-gold/60"></div>
                            <div className="w-8 h-[1px] bg-gold/40"></div>
                        </div>
                        <p className="text-white/40 text-sm max-w-md mx-auto mt-4 font-light">
                            Premium personalized products, crafted to make every moment memorable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { id: 'bottle', title: 'Bottle', desc: 'Premium customized bottles', image: curatedBottle, icon: <FaWineBottle />, link: '/category/Bottles' },
                            { id: 'keychains', title: 'Keychains', desc: 'Unique keychains for every personality', image: curatedKeychain, icon: <FaKey />, link: '/category/Keychains' },
                            { id: 'mug', title: 'Mug', desc: 'Sip in style with our custom mugs', image: curatedMug, icon: <FaCoffee />, link: '/category/Mugs' },
                            { id: 'tshirt', title: 'Tshirt', desc: 'Wear your moments with pride', image: curatedTshirt, icon: <FaTshirt />, link: '/category/T-Shirts' }
                        ].map((item, index) => (
                            <Link
                                key={index}
                                to={item.link}
                                className="group relative flex flex-col rounded-[1.25rem] bg-[#1A1333] border border-[#2a214a] overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:border-gold/50 hover:shadow-glow"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[4/5] overflow-hidden w-full bg-[#1A1333]">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Gradient Overlay for Text Readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1333] via-[#1A1333]/20 to-transparent"></div>
                                    
                                    {/* Floating Icon */}
                                    <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center text-gold/60 group-hover:border-gold group-hover:text-gold transition-colors duration-300 backdrop-blur-sm bg-primary-dark/50 z-10">
                                        {item.icon}
                                    </div>
                                </div>
                                
                                {/* Text Content */}
                                <div className="p-6 pt-2 pb-7 relative z-10 bg-[#1A1333] flex flex-col flex-grow">
                                    <h3 className="text-[1.35rem] font-serif text-white mb-1">{item.title}</h3>
                                    <p className="text-white/40 text-[12px] leading-relaxed mb-5 flex-grow">{item.desc}</p>
                                    <span className="text-gold text-[10px] font-semibold uppercase tracking-[0.2em] group-hover:tracking-[0.25em] transition-all duration-300 flex items-center gap-2 mt-auto">
                                        Explore <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                POPULAR SECTIONS (CATEGORIES)
            ═══════════════════════════════════════════ */}
            {renderPopularSection('Bottle', ['bottle', 'sipper'], 'bg-primary/30', luxuryBottle)}
            {renderPopularSection('Mug', ['mug', 'cup'], 'bg-primary-dark', luxuryMug)}
            {renderPopularSection('T-Shirt', ['tshirt', 't-shirt', 'shirt'], 'bg-primary/30', luxuryTshirt)}
            {renderPopularSection('Keychain', ['keychain', 'key'], 'bg-primary-dark', luxuryKeychain)}
            {renderPopularSection('Frame', ['frame', 'photo'], 'bg-primary/30', luxuryFrame)}

            {/* ═══════════════════════════════════════════
                TESTIMONIALS
            ═══════════════════════════════════════════ */}
            <section className="py-24 md:py-32 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.04]"></div>
                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col items-center text-center mb-16 space-y-4">
                        <span className="text-gold text-[10px] font-semibold uppercase tracking-[0.4em]">Testimonials</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-white">
                            What Our <span className="text-gold">Customers Say</span>
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-[1px] bg-gold/40"></div>
                            <div className="w-1.5 h-1.5 rotate-45 bg-gold/60"></div>
                            <div className="w-8 h-[1px] bg-gold/40"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                        {[
                            { name: "Priya Sharma", text: "The craftsmanship is unparalleled. It's not just a product, it's a memory preserved forever." },
                            { name: "Rahul Verma", text: "Perfectly minimal, exceptionally premium. My go-to for personalized gifts." },
                            { name: "Ananya Patel", text: "Stunning quality that captures every detail beautifully. Highly recommended!" }
                        ].map((rev, i) => (
                            <div key={i} className="group relative space-y-6 text-center md:text-left p-8 rounded-[1.25rem] bg-[#1A1333] border border-[#2a214a] transition-all duration-300 hover:scale-[1.03] hover:border-gold/50 hover:shadow-glow overflow-hidden">
                                {/* Subtle background glow on hover */}
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold/10 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                <FaQuoteLeft className="text-gold/30 text-4xl mx-auto md:mx-0 group-hover:text-gold/60 transition-colors duration-300" />
                                <p className="text-white/60 text-base leading-relaxed font-light italic relative z-10 group-hover:text-white/80 transition-colors duration-300">"{rev.text}"</p>
                                <div className="flex items-center justify-center md:justify-start gap-3 mt-6">
                                    <div className="w-8 h-[1px] bg-gold/40 group-hover:w-12 group-hover:bg-gold transition-all duration-300"></div>
                                    <p className="text-white font-serif text-lg group-hover:text-gold transition-colors duration-300">{rev.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════ */}
            <footer className="py-20 bg-[#0A0713] border-t border-[#2a214a] relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-2 space-y-6">
                            <h2 className="text-3xl font-serif text-white tracking-tight">Mimitiinaa<span className="text-gold">.</span></h2>
                            <p className="text-white/40 max-w-sm leading-relaxed text-sm font-light">
                                Curating premium personalized products for your most cherished memories.
                                Handcrafted with passion, delivered with care.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">Navigation</h3>
                            <ul className="space-y-4">
                                {['Home', 'Designs'].map(item => (
                                    <li key={item}><Link to={item === 'Home' ? '/' : '/#designs'} className="text-sm text-white/40 hover:text-gold transition-colors inline-flex items-center gap-2 group"><span className="w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-3"></span>{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">Connect</h3>
                            <ul className="space-y-4">
                                {['Instagram', 'Twitter', 'Facebook'].map(item => (
                                    <li key={item}><a href="#" className="text-sm text-white/40 hover:text-gold transition-colors inline-flex items-center gap-2 group"><span className="w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-3"></span>{item}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-[#2a214a] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-white/30 text-xs font-light tracking-wide">
                            © {new Date().getFullYear()} Mimitiinaa. All Rights Reserved.
                        </p>
                        <div className="flex gap-8 text-xs font-light tracking-wide">
                            <a href="#" className="text-white/30 hover:text-gold transition-colors">Privacy</a>
                            <a href="#" className="text-white/30 hover:text-gold transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
