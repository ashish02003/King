// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { API_BASE } from '../utils/api';
// import { FaSearch, FaChevronRight, FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
// import CategoryCard from '../components/CategoryCard';


// const Home = () => {
//     const [templates, setTemplates] = useState([]);
//     const [categories, setCategories] = useState([]);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const [templatesRes, categoriesRes] = await Promise.all([
//                     axios.get(`${API_BASE}/templates`),
//                     axios.get(`${API_BASE}/categories`)
//                 ]);
//                 setTemplates(templatesRes.data);
//                 setCategories(categoriesRes.data);
//             } catch (error) {
//                 console.error(error);
//             }
//         };
//         fetchData();

//         // Refresh every 5 seconds to catch new categories/templates
//         const interval = setInterval(fetchData, 5000);
//         return () => clearInterval(interval);
//     }, []);

//     // Group templates by category
//     const templatesByCategory = categories.reduce((acc, category) => {
//         const categoryTemplates = templates.filter(t => t.category === category.name);
//         if (categoryTemplates.length > 0) {
//             acc[category.name] = categoryTemplates;
//         }
//         return acc;
//     }, {});

//     return (
//         <div className="bg-white min-h-screen selection:bg-blue-600 selection:text-white">
//             {/* 1. Hero Section - Refined Layout */}
//             <div className="bg-[#f8fafc] border-b border-slate-200">
//                 <div className="container mx-auto px-6 max-w-7xl">
//                     <div className="flex flex-col lg:flex-row items-start gap-12 pt-2 pb-16 md:pt-10 md:pb-24">
//                         {/* Text Content - Moved Up */}
//                         <div className="lg:w-[55%] flex flex-col items-start text-left lg:pt-2">
//                             <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-8">
//                                 <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
//                                 New Custom Designs Available
//                             </span>
//                             <h1 className="text-2xl md:text-5xl font-[900] text-slate-900 mb-4 tracking-tight leading-[1.1]">
//                                 Personalize Your <br />
//                                 <span className="text-blue-600">Everyday Gear</span>
//                             </h1>
//                             <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg mb-10 leading-relaxed">
//                                 Turn your photos and ideas into high-quality custom prints.
//                                 Trusted by thousands for premium personal gifting.
//                             </p>

//                             {/* Search Component */}
//                             <div className="w-full max-w-md relative">
//                                 <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
//                                     <div className="pl-4 text-slate-400">
//                                         <FaSearch size={14} />
//                                     </div>
//                                     <input
//                                         type="text"
//                                         placeholder="Find t-shirts, mugs, and more..."
//                                         className="w-full bg-transparent py-4 px-4 text-slate-700 font-medium outline-none text-sm"
//                                     />
//                                     <button className="bg-slate-900 text-white px-8 py-4 font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors">
//                                         Search
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Visual Element - Smaller Image Grid */}
//                         <div className="lg:w-[30%] grid grid-cols-2 gap-3 lg:ml-auto m-auto">
//                             <div className="space-y-2">
//                                 <div className="aspect-[4/5] bg-slate-200 rounded-3xl overflow-hidden shadow-sm relative group">
//                                     <img src="https://images.unsplash.com/photo-1574914629385-46448b767aec?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" alt="custom" />
//                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
//                                 </div>
//                                 <div className="aspect-square bg-blue-600 rounded-3xl flex items-center justify-center p-6 text-white">
//                                     <div className="text-center">
//                                         <div className="text-2xl font-black mb-0.5">100%</div>
//                                         <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">Quality</div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="space-y-3 pt-6">
//                                 <div className="aspect-square bg-white border border-slate-200 rounded-3xl flex items-center justify-center p-4 shadow-sm">
//                                     <div className="w-full h-full rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
//                                         <span className="text-3xl font-black text-slate-200 uppercase">Pro</span>
//                                     </div>
//                                 </div>
//                                 <div className="aspect-[4/5] bg-slate-200 rounded-3xl overflow-hidden shadow-sm relative group">
//                                     <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" alt="custom" />
//                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>



//             {/* 2. Popular Products Section - Instant Trust */}
//             <div className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
//                 <div className="flex flex-col items-center text-center mb-16">
//                     <span className="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Trending Now</span>
//                     <h2 className="text-3xl md:text-5xl font-[900] text-slate-900 tracking-tight">Our Most Loved Prints</h2>
//                     <div className="w-12 h-1 bg-slate-900 rounded-full mt-6"></div>

//                 </div>

//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
//                     {templates.slice(0, 4).map((product) => (
//                         <Link key={product._id} to={`/product/${product._id}`} className="group relative">
//                             <div className="aspect-square bg-[#f8fafc] rounded-3xl overflow-hidden border border-slate-100 group-hover:border-blue-500/20 transition-all duration-500 shadow-sm group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
//                                 <img
//                                     src={product.demoImageUrl || product.previewImage}
//                                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
//                                     alt={product.name}
//                                 />
//                                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
//                                     Best Seller
//                                 </div>
//                             </div>
//                             <div className="mt-5 text-center px-2">
//                                 <h3 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{product.name}</h3>
//                                 <p className="text-blue-600 font-black text-lg">₹{product.basePrice}</p>
//                             </div>
//                         </Link>
//                     ))}
//                 </div>
//             </div>


//             {/* 3. Collection Section - Grid of clean boxes */}
//             <div className="container mx-auto px-6 py-20 max-w-7xl border-t border-slate-100">
//                 <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 border-b border-slate-100 pb-6 uppercase tracking-widest">
//                     <h2 className="text-xs font-black text-slate-400">Shop Our Collections</h2>
//                     <Link to="/mobile-cases" className="text-[10px] font-black hover:text-blue-600 transition-colors">See all categories (8) &rarr;</Link>
//                 </div>

//                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//                     {categories.slice(0, 8).map((cat) => (
//                         <CategoryCard
//                             key={cat._id}
//                             title={cat.name}
//                             image={cat.image || 'https://via.placeholder.com/150'}
//                             link={`/category/${cat.name}`}
//                             bgClass="bg-[#ffffff]"
//                             className="hover:scale-[1.02] transition-transform"
//                         />
//                     ))}
//                 </div>
//             </div>


//             {/* 3. Products Sections - High visibility cards */}
//             <div className="bg-slate-50 py-24">
//                 <div className="container mx-auto px-6 max-w-7xl space-y-32">
//                     {Object.entries(templatesByCategory).map(([categoryName, categoryTemplates]) => (
//                         <div key={categoryName} className="relative">
//                             <div className="flex items-center gap-6 mb-12">
//                                 <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight shrink-0 italic-none">
//                                     {categoryName}
//                                 </h2>
//                                 <div className="h-[1px] bg-slate-200 w-full"></div>
//                                 <Link
//                                     to={`/category/${categoryName}`}
//                                     className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
//                                 >
//                                     Browse all
//                                 </Link>
//                             </div>

//                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
//                                 {categoryTemplates.slice(0, 6).map((template) => (
//                                     <Link
//                                         key={template._id}
//                                         to={`/product/${template._id}`}
//                                         className="group block"
//                                     >
//                                         <div className="aspect-square aspect-auto bg-white rounded-xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-slate-200 group-hover:border-blue-500/30 transition-all duration-300">
//                                             <img
//                                                 src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
//                                                 alt={template.name}
//                                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//                                                 onError={(e) => {
//                                                     e.target.onerror = null;
//                                                     e.target.src = 'https://placehold.co/400x400/f8fafc/6366f1?text=' + template.name.replace(' ', '+');
//                                                 }}
//                                             />
//                                         </div>

//                                         <div className="mt-4 px-1">
//                                             <h3 className="text-[12px] font-bold text-slate-800 tracking-tight leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
//                                                 {template.name}
//                                             </h3>
//                                             <div className="mt-1 flex items-center justify-between">
//                                                 <span className="text-[13px] font-black text-slate-900">
//                                                     ₹{template.basePrice + (template.packingCharges || 0)}
//                                                 </span>

//                                             </div>
//                                         </div>
//                                     </Link>
//                                 ))}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>






//             {/* 6. Testimonials Section - Before Footer */}
//             <div className="bg-[#0b1e3b] text-white py-8 overflow-hidden relative">
//                 <div className="absolute top-0 left-0 w-full h-full opacity-10">
//                     <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
//                     <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-500 rounded-full blur-[100px]"></div>
//                 </div>

//                 <div className="container mx-auto px-6 max-w-7xl relative z-10">
//                     <div className="flex flex-col items-center text-center mb-6">
//                         <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Customer Proof</span>
//                         <h2 className="text-2xl md:text-5xl font-[900] tracking-tight mb-2">Loved by 10,000+ Happy Creators</h2>
//                         <p className="text-blue-200/60 font-medium">Join our growing community of customized product lovers</p>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         {[
//                             { name: "Aman Gupta", text: "Quality of the mobile cover is insane! The print doesn't fade even after months.", rating: 5 },
//                             { name: "Priya Sharma", text: "The customized mug was the perfect gift for my parents. Highly recommended!", rating: 5 },
//                             { name: "Rahul Verma", text: "Best customer service and super fast delivery. The colors are very vibrant.", rating: 5 }
//                         ].map((rev, i) => (
//                             <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[40px] hover:bg-white/10 transition-all group">
//                                 <div className="flex gap-1 mb-4">
//                                     {[...Array(rev.rating)].map((_, i) => (
//                                         <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
//                                     ))}
//                                 </div>
//                                 <p className="text-blue-50/80 text-lg font-medium leading-relaxed mb-8 italic">"{rev.text}"</p>
//                                 <div className="flex items-center gap-4 border-t border-white/10 pt-6">
//                                     <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-[12px] font-black text-blue-400 uppercase ring-1 ring-blue-500/30">
//                                         {rev.name.charAt(0)}
//                                     </div>
//                                     <div>
//                                         <p className="text-white font-bold text-sm tracking-wide">{rev.name}</p>
//                                         <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Verified Buyer</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>{/* 4. Footer - Minimal Professional */}
//             <footer className="bg-white border-t border-slate-200 py-24">
//                 <div className="container mx-auto px-6 max-w-7xl">
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
//                         <div className="space-y-8">
//                             <div>
//                                 <h2 className="text-2xl font-[900] tracking-tighter text-slate-900">Mimitiinaa</h2>
//                                 <p className="text-slate-500 text-[13px] mt-4 leading-relaxed font-medium max-w-xs">
//                                     Quality custom products made for your special moments.
//                                     Expertly printed and delivered with care.
//                                 </p>
//                             </div>
//                             <div className="flex gap-4">
//                                 <a href="#" className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><FaTwitter size={14} /></a>
//                                 <a href="#" className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><FaInstagram size={14} /></a>
//                                 <a href="#" className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><FaWhatsapp size={14} /></a>
//                             </div>
//                         </div>

//                         <div>
//                             <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.2em] text-slate-400">Navigation</h3>
//                             <ul className="space-y-4 text-slate-900 text-[13px] font-bold">
//                                 <li><Link to="/" className="hover:text-blue-600 transition-colors">Home Page</Link></li>
//                                 <li><Link to="/about" className="hover:text-blue-600 transition-colors">Our Story</Link></li>
//                                 <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Support</Link></li>
//                                 <li><Link to="/profile" className="hover:text-blue-600 transition-colors">My Account</Link></li>
//                             </ul>
//                         </div>

//                         <div>
//                             <h3 className="text-[10px] font-black mb-8 uppercase tracking-[0.2em] text-slate-400">Connect</h3>
//                             <ul className="space-y-4 text-slate-900 text-[13px] font-bold">
//                                 <li className="flex items-center gap-3"><FaMapMarkerAlt size={12} className="text-blue-600" /> New Design HUB, India</li>
//                                 <li className="flex items-center gap-3"><FaPhoneAlt size={12} className="text-blue-600" /> +91 98765 43210</li>
//                                 <li className="flex items-center gap-3"><FaEnvelope size={12} className="text-blue-600" /> hello@mimitiinaa.com</li>
//                             </ul>
//                         </div>

//                         <div>
//                             <div className="bg-slate-900 p-8 rounded-3xl text-white">
//                                 <h3 className="text-sm font-black mb-2">Subscribe</h3>
//                                 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">Get special offers</p>
//                                 <div className="flex border-b border-slate-700 pb-2">
//                                     <input type="email" placeholder="Email" className="bg-transparent text-xs w-full outline-none" />
//                                     <button className="text-blue-500 font-black text-xs hover:text-white transition-colors">&rarr;</button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="pt-24 flex flex-col md:flex-row justify-between items-center gap-4">
//                         <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
//                             © {new Date().getFullYear()} Mimitiinaa. All rights reserved.
//                         </p>
//                         <div className="flex gap-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">
//                             <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
//                             <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
//                         </div>
//                     </div>
//                 </div>
//             </footer>
//         </div>
//     );
// };

// export default Home;






import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/api';
import { FaSearch, FaChevronRight, FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';
import CategoryCard from '../components/CategoryCard';

// Floating product icons for search section background animation
const FLOAT_ITEMS = [
    { emoji: '📸', size: 36, x: 5, y: 18, dur: 7, delay: 0 },
    { emoji: '👕', size: 30, x: 12, y: 62, dur: 9, delay: 1.2 },
    { emoji: '☕', size: 34, x: 20, y: 28, dur: 8, delay: 0.5 },
    { emoji: '📱', size: 28, x: 33, y: 72, dur: 11, delay: 2.1 },
    { emoji: '🧣', size: 26, x: 44, y: 18, dur: 10, delay: 0.8 },
    { emoji: '🖼️', size: 32, x: 55, y: 68, dur: 8, delay: 3.0 },
    { emoji: '🎒', size: 28, x: 65, y: 22, dur: 9, delay: 1.5 },
    { emoji: '🖊️', size: 24, x: 74, y: 58, dur: 7, delay: 2.4 },
    { emoji: '🧲', size: 30, x: 83, y: 32, dur: 10, delay: 0.3 },
    { emoji: '📓', size: 26, x: 91, y: 75, dur: 8, delay: 1.8 },
    { emoji: '🎁', size: 32, x: 97, y: 14, dur: 9, delay: 2.8 },
    { emoji: '🏷️', size: 22, x: 50, y: 48, dur: 12, delay: 0.6 },
];

const Home = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, categoriesRes] = await Promise.all([
                    axios.get(`${API_BASE}/templates`),
                    axios.get(`${API_BASE}/categories`)
                ]);
                const catsInStock = categoriesRes.data.filter(cat => cat.stock > 0);
                const inStockCatNames = catsInStock.map(c => c.name);

                setTemplates(templatesRes.data.filter(t => inStockCatNames.includes(t.category)));
                setCategories(catsInStock);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();

        // Refresh every 5 seconds to catch new categories/templates
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Scroll reveal
    useEffect(() => {
        const els = document.querySelectorAll('[data-sr]');
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const d = parseInt(e.target.dataset.delay || '0');
                    setTimeout(() => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'translateY(0) scale(1)';
                    }, d);
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.07 });
        els.forEach(el => io.observe(el));
        return () => io.disconnect();
    }, [templates, categories, showAllCategories]);

    // Group templates by category
    const templatesByCategory = categories.reduce((acc, category) => {
        const categoryTemplates = templates.filter(t => t.category === category.name);
        if (categoryTemplates.length > 0) {
            acc[category.name] = categoryTemplates;
        }
        return acc;
    }, {});

    return (
        <div className="bg-white min-h-screen w-full max-w-[100vw] overflow-x-hidden selection:bg-luxury-gold selection:text-white">



            {/* ─── Global Design Styles ──────────────────────────────────────── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,300;0,700;0,900;1,300;1,600;1,900&display=swap');

                html, body { 
                    width: 100% !important;
                    max-width: 100vw !important; 
                    overflow-x: clip !important; 
                    overscroll-behavior-x: none !important;
                    margin: 0;
                    padding: 0;
                    position: relative;
                }
                body { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .fraunces { font-family: 'Fraunces', Georgia, serif !important; }

                /* Hero text animations */
                @keyframes riseIn { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
                .rise   { animation: riseIn .85s cubic-bezier(.22,1,.36,1) both; }
                .rise-1 { animation-delay:.04s; }
                .rise-2 { animation-delay:.16s; }
                .rise-3 { animation-delay:.28s; }
                .rise-4 { animation-delay:.40s; }
                .rise-5 { animation-delay:.52s; }

                @keyframes floatAnim {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                .hero-float { animation: floatAnim 6s ease-in-out infinite; }
                
                @keyframes badgeFloat {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-10px, -10px); }
                }
                .badge-float { animation: badgeFloat 4s ease-in-out infinite; }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .text-shimmer {
                    background: linear-gradient(90deg, #30174D, #563C8C, #A189CC, #563C8C, #30174D);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s linear infinite;
                }

                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob { animation: blob 7s infinite; }

                /* Floating search bg icons */
                @keyframes floatUp {
                    0%,100% { transform:translateY(0) rotate(0deg);    opacity:.17; }
                    50%      { transform:translateY(-24px) rotate(6deg); opacity:.28; }
                }
                .fi {
                    position:absolute; pointer-events:none; user-select:none;
                    animation: floatUp var(--dur,8s) ease-in-out infinite;
                    animation-delay: var(--dly,0s);
                    filter: drop-shadow(0 3px 6px rgba(0,0,0,.08));
                }

                /* Marquee */
                @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
                .mq-track { animation:mq 28s linear infinite; display:flex; width:max-content; }
                .mq-track:hover { animation-play-state:paused; }

                /* Product card lift + zoom */
                .pc-card {
                    border-radius:24px; overflow:hidden; position:relative;
                    transition:transform .5s cubic-bezier(.22,1,.36,1), box-shadow .5s;
                    cursor:pointer;
                }
                .pc-card:hover { transform:translateY(-12px); box-shadow:0 30px 60px -12px rgba(0,0,0,0.18); }
                .pc-card img { transition:transform .65s cubic-bezier(.22,1,.36,1); display:block; width:100%; height:100%; object-fit:cover; }
                .pc-card:hover img { transform:scale(1.08); }
                .pc-card-overlay {
                    position:absolute; inset:0;
                    background:linear-gradient(transparent 35%, rgba(15,23,42,0.85) 100%);
                    opacity:0; transition:opacity .35s;
                    display:flex; align-items:flex-end; justify-content:center; padding:24px;
                }
                .pc-card:hover .pc-card-overlay { opacity:1; }

                /* Scroll reveal base */
                [data-sr] {
                    opacity:0; transform:translateY(30px) scale(.97);
                    will-change:opacity,transform;
                    transition:opacity .75s cubic-bezier(.22,1,.36,1), transform .75s cubic-bezier(.22,1,.36,1);
                }

                @media (max-width: 640px) {
                    .hero-title { font-size: 3.5rem !important; }
                }


                /* Testimonial card */
                .pc-testi { transition:transform .45s cubic-bezier(.22,1,.36,1), border-color .3s, box-shadow .4s; }
                .pc-testi:hover { transform:translateY(-8px) !important; }

                /* Trust pill */
                .pc-trust { transition:transform .3s, box-shadow .3s, border-color .3s !important; }
                .pc-trust:hover { transform:translateY(-3px) !important; box-shadow:0 8px 24px rgba(86,60,140,.14) !important; border-color:#563C8C !important; }

                /* Footer link */
                .pc-fl { display:flex; align-items:center; gap:0; transition:color .25s, gap .3s; }
                .pc-fl::before { content:''; width:0; height:1.5px; background:#563C8C; transition:width .3s; flex-shrink:0; }
                .pc-fl:hover { gap:10px !important; }
                .pc-fl:hover::before { width:14px; }

                /* Search bar focus ring */
                .pc-search-wrap:focus-within {
                    border-color:#563C8C !important;
                    box-shadow:0 0 0 4px rgba(86,60,140,0.1) !important;
                }

                @keyframes drift {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(20px, -20px) rotate(3deg); }
                }
                .bg-drift { animation: drift 12s ease-in-out infinite; }

                @keyframes slideText {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .bg-text-slide { 
                    animation: slideText 60s linear infinite; 
                    white-space: nowrap; 
                    pointer-events: none;
                    user-select: none;
                    opacity: 0.03;
                    font-size: 15vw;
                    font-weight: 900;
                    position: absolute;
                    top: 20%;
                    left: 0;
                    line-height: 1;
                    z-index: -1;
                }

            `}</style>

            {/* ══════════════════════════════════════════════════════
                1. Premium Hero Section - Refined & Search-Free
            ══════════════════════════════════════════════════════ */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#f3f0ff] to-luxury-cream pt-12 pb-24 md:pt-28 md:pb-40">
                {/* Background Blobs */}
                <div className="luxury-blob bg-luxury-purple/20 top-[-10%] left-[-5%] animate-float"></div>
                <div className="luxury-blob bg-luxury-purple/10 bottom-[-5%] right-[-10%] animate-float" style={{ animationDelay: '-10s' }}></div>
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-luxury-purple/15 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-luxury-purple-light/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>

                <div className="container mx-auto px-6 max-w-7xl relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                        {/* Left: Text Content */}
                        <div className="lg:w-1/2 flex flex-col items-start text-center lg:text-left">
                            <span className="rise rise-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-purple/10 shadow-sm border border-luxury-purple/20 text-luxury-purple text-[11px] font-black uppercase tracking-[0.2em] mb-8 mx-auto lg:mx-0">
                                <span className="w-2 h-2 rounded-full bg-luxury-purple animate-pulse"></span>
                                New Arrival: Premium Photo Frames
                            </span>

                            <h1 className="rise rise-2 fraunces mb-6 hero-title" style={{ fontSize: 'clamp(44px, 7vw, 92px)', fontWeight: 900, color: '#422D6B', letterSpacing: '-0.03em', lineHeight: 0.95 }}>
                                Your Stories, <br />
                                <span className="text-shimmer italic">Perfectly</span> <br />
                                <span className="text-shimmer">Framed.</span>
                            </h1>

                            <p className="rise rise-3 text-luxury-purple/70 text-lg md:text-xl max-w-lg mb-12 leading-relaxed font-medium mx-auto lg:mx-0">
                                Celebrate life's best moments with our premium collection of
                                frames, keychains and personalized mugs. HD quality, made to last.
                            </p>

                            <div className="rise rise-4 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button className="bg-luxury-purple text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-luxury-purple-dark transition-all hover:translate-y-[-4px] active:scale-95 shadow-xl shadow-luxury-purple-dark/20">
                                    Start Creating
                                </button>
                                <button className="bg-white text-luxury-purple-dark border-2 border-luxury-cream px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-luxury-cream transition-all hover:translate-y-[-4px] active:scale-95">
                                    Browse Frames
                                </button>
                            </div>

                            {/* Floating Dynamic Badges */}
                            <div className="rise rise-5 flex gap-4 mt-16 flex-wrap justify-center lg:justify-start">
                                {['✨ HD Prints', '🛡️ Scratch Resistant', '🎁 Express Gifting'].map((tag, i) => (
                                    <div key={i} className="badge-float flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm" style={{ animationDelay: `${i * 0.5}s` }}>
                                        <span className="text-[14px]">{tag.split(' ')[0]}</span>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{tag.split(' ').slice(1).join(' ')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Visual Showcase - Refined to user's desired style */}
                        <div className="lg:w-1/2 relative rise rise-3 w-full">
                            <div className="relative z-10 hero-float">
                                <div className="relative p-6 md:p-10 bg-white/40 backdrop-blur-md rounded-[56px] border border-white/60 shadow-2xl">
                                    <div className="aspect-[5/4] sm:aspect-[4/3] rounded-[40px] overflow-hidden shadow-inner bg-slate-100 border-8 border-white group cursor-pointer">
                                        <img
                                            src={new URL('../assets/hero_frames_mug_keychains_v2.png', import.meta.url).href}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            alt="Premium Personalized Gifts Showcase"
                                        />
                                    </div>

                                    {/* Overlay Dynamic Elements - Moved inward and made MUCH more visible as requested */}
                                    <div className="absolute -top-14 right-4 md:right-8 bg-white p-7 rounded-[32px] shadow-2xl shadow-luxury-purple/10 border border-slate-50 max-w-[170px] animate-bounce z-20" style={{ animationDuration: '4s' }}>
                                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 shadow-inner">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-luxury-purple/60">Top Trending</p>
                                            <p className="text-[17px] font-black text-luxury-purple-dark">Acrylic Frame</p>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-1 h-1 rounded-full bg-emerald-400"></div>)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-10 -left-6 md:-left-12 bg-slate-900 p-8 rounded-[32px] shadow-2xl shadow-slate-900/30 max-w-[210px] hidden md:block z-20">
                                        <p className="text-white text-sm font-semibold leading-relaxed opacity-95">"The acrylic finish on the frames and mug is stunning!"</p>
                                        <div className="mt-5 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-luxury-purple to-luxury-purple-light overflow-hidden border-2 border-white/20"></div>
                                            <div>
                                                <p className="text-white text-[11px] font-bold">Raghav M.</p>
                                                <span className="text-[9px] font-black text-luxury-purple uppercase tracking-widest">Verified Buyer</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Glows */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-luxury-purple/10 rounded-full blur-[140px] -z-10 animate-pulse"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-[60px] -z-10"></div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                ANIMATED SEARCH SECTION — dark bg with floating product icons
            ══════════════════════════════════════════════════════ */}
            <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #30174D 0%, #170E2B 100%)', padding: '72px 0 80px' }}>
                {/* Floating product emojis */}
                {FLOAT_ITEMS.map((item, i) => (
                    <div key={i} className="fi" style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, '--dur': `${item.dur}s`, '--dly': `${item.delay}s` }}>
                        {item.emoji}
                    </div>
                ))}
                {/* Glow orbs */}
                <div style={{ position: 'absolute', width: 300, height: 300, left: '8%', top: '-30%', borderRadius: '50%', background: 'rgba(161,137,204,.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: 260, height: 260, right: '5%', bottom: '-20%', borderRadius: '50%', background: 'rgba(86,60,140,.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                {/* Dot grid */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 16, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>✦ Search Our Collection</span>

                    <h2 className="fraunces" style={{ fontSize: 'clamp(28px,4vw,54px)', fontWeight: 900, fontStyle: 'italic', color: '#fff', marginBottom: 6, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                        We Turn Your Memories
                    </h2>
                    <h2 className="fraunces" style={{ fontSize: 'clamp(28px,4vw,54px)', fontWeight: 900, fontStyle: 'italic', color: '#A189CC', marginBottom: 40, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                        Into Products
                    </h2>

                    {/* Search bar */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (searchQuery.trim()) {
                                navigate(`/category/Search?q=${encodeURIComponent(searchQuery)}`);
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 640, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(20px)', borderRadius: 100, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.35)', padding: '6px 6px 6px 24px' }}
                    >
                        <span style={{ color: '#94a3b8', flexShrink: 0 }}><FaSearch size={14} /></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for Love Story Frames, Wallet Cards etc."
                            style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 400, color: '#1e293b', background: 'transparent', padding: '12px 16px' }}
                        />
                        <button 
                            type="submit"
                            style={{ background: '#563C8C', color: '#fff', border: 'none', borderRadius: 100, padding: '12px 28px', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0, fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'background .25s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#30174D'}
                            onMouseLeave={e => e.currentTarget.style.background = '#563C8C'}>
                            Search
                        </button>
                    </form>

                    {/* Quick search pills */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {['📱 Phone Cases', '☕ Photo Mugs', '👕 T-Shirts', '🖼️ Wall Art', '🎁 Gift Sets'].map(tag => (
                            <button key={tag}
                                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', color: 'rgba(255,255,255,.72)', fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 100, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all .25s', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                                onMouseEnter={e => { e.target.style.background = 'rgba(161,137,204,.35)'; e.target.style.borderColor = '#A189CC'; e.target.style.color = '#fff'; }}
                                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,.08)'; e.target.style.borderColor = 'rgba(255,255,255,.14)'; e.target.style.color = 'rgba(255,255,255,.72)'; }}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* ══════════════════════════════════════════════════════
                MARQUEE STRIP
            ══════════════════════════════════════════════════════ */}
            <div style={{ overflow: 'hidden', background: '#FAF9F6', borderTop: '1px solid rgba(86,60,140,0.1)', borderBottom: '1px solid rgba(86,60,140,0.1)', padding: '13px 0' }}>
                <div className="mq-track">
                    {[...Array(4)].flatMap((_, r) =>
                        ['Photo Albums', 'Phone Cases', 'Custom Mugs', 'Hoodies', 'Tote Bags', 'Wall Art', 'Notebooks', 'Fridge Magnets', 'Name Pens', 'Pillows'].map((item, i) => (
                            <span key={`${r}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', flexShrink: 0 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.25em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item}</span>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#563C8C', flexShrink: 0, opacity: .5 }} />
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                2. Popular Products Section — Instant Trust
            ══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
                <div data-sr className="flex flex-col md:flex-row items-baseline justify-between mb-14 pb-6 border-b border-luxury-purple/10">
                    <div>
                        <span className="text-luxury-purple text-[10px] font-black uppercase tracking-[0.3em] mb-3 block" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Trending Now</span>
                        <h2 className="fraunces" style={{ fontSize: 'clamp(30px,4vw,54px)', fontWeight: 900, fontStyle: 'italic', color: '#422D6B', letterSpacing: '-1.5px', lineHeight: 1.05 }}>
                            Our Most <span className="text-shimmer">Loved</span> Prints
                        </h2>
                    </div>
                    <a href="#" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#0f172a', textDecoration: 'none', border: '1.5px solid #e2e8f0', borderRadius: 100, padding: '11px 26px', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'border-color .25s', fontFamily: "'Plus Jakarta Sans',sans-serif", marginTop: 16 }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#0f172a'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                        View All <FaChevronRight size={9} />
                    </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {templates.slice(0, 4).map((product, i) => (
                        <Link key={product._id} to={`/product/${product._id}`} className="group relative" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div data-sr data-delay={i * 80} className="pc-card" style={{ aspectRatio: '3/4', background: '#f8fafc' }}>
                                <img
                                    src={product.demoImageUrl || product.previewImage}
                                    className="w-full h-full object-cover"
                                    alt={product.name}
                                />
                                <div style={{ position: 'absolute', top: 0, left: 0, background: '#30174D', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', padding: '6px 13px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                    Best Seller
                                </div>
                                <div className="pc-card-overlay">
                                    <button style={{ background: '#563C8C', color: '#fff', border: 'none', borderRadius: 100, padding: '11px 22px', fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                        Customize Now
                                    </button>
                                </div>
                            </div>
                            <div className="mt-5 text-center px-2">
                                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{product.name}</h3>
                                <div className="fraunces" style={{ fontSize: 26, fontWeight: 900, color: '#563C8C', fontStyle: 'italic' }}>₹{Math.round(product.basePrice * (1 + (product.gst || 0) / 100))}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                TRUST STRIP
            ══════════════════════════════════════════════════════ */}
            <div style={{ background: '#FAF9F6', borderTop: '1px solid rgba(86,60,140,0.1)', borderBottom: '1px solid rgba(86,60,140,0.1)', padding: '28px 48px' }}>
                <div className="container mx-auto max-w-7xl" style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {[
                        { icon: '🎨', text: 'Easy Design Tool' },
                        { icon: '🖨️', text: 'HD-Quality Prints' },
                        { icon: '🚚', text: 'Pan-India Shipping' },
                        { icon: '💯', text: 'Satisfaction Guarantee' },
                        { icon: '⚡', text: 'Express 24hr Dispatch' },
                    ].map((item, i) => (
                        <div key={i} className="pc-trust" data-sr data-delay={i * 70}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px', borderRadius: 100, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'default' }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                3. Popular Products Section — Screenshot Style
            ══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className={`relative overflow-hidden pt-10 pb-12 px-4 md:px-8 rounded-[3rem] bg-luxury-cream border border-luxury-purple/10 shadow-[0_15px_40px_-15px_rgba(86,60,140,0.1)]`}>
                    <div className="flex flex-col items-center mb-6 relative z-10">
                        <h2 className="fraunces text-center" style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#30174D', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            Popular Products
                        </h2>
                        <div className="w-16 h-[1.5px] bg-luxury-purple/30 mt-4"></div>
                    </div>

                    <div className="relative group/scroll">
                        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5 transition-all duration-700 ${showAllCategories ? 'max-h-[5000px] opacity-100' : 'max-h-[800px]'}`}>
                            {categories.map((cat, i) => (
                                <Link
                                    key={cat._id}
                                    to={`/category/${cat.name}`}
                                    data-sr
                                    data-delay={i * 40}
                                    className={`group flex flex-col items-center transition-all duration-500 hover:-translate-y-2 ${(!showAllCategories && i >= 6) ? 'hidden' : 'flex'}`}
                                >
                                    <div className="w-full aspect-square rounded-[2rem] overflow-hidden bg-white shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05)] border border-[#F5E6D3] group-hover:shadow-[0_20px_50px_-10px_rgba(126,107,78,0.15)] group-hover:border-[#7E6B4E]/20 transition-all duration-500 p-0">
                                        <img
                                            src={cat.image || 'https://via.placeholder.com/400'}
                                            alt={cat.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://placehold.co/400x400/FDF6E9/7E6B4E?text=${cat.name.replace(' ', '+')}`;
                                            }}
                                        />
                                    </div>
                                    <h3 className="mt-4 text-[13px] font-[800] text-[#1e293b] tracking-[0.05em] group-hover:text-[#7E6B4E] transition-colors text-center font-sans">
                                        {cat.name}
                                    </h3>
                                </Link>
                            ))}
                        </div>

                        {categories.length > 6 && (
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="px-10 py-4 bg-white hover:bg-[#7E6B4E] hover:text-white border border-[#7E6B4E]/20 text-[#7E6B4E] rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                                >
                                    {showAllCategories ? 'Show Less' : 'Show All Categories'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Decorative subtle texture */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#7E6B4E 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                </div>
            </div>

            <div className="container mx-auto px-6 mb-4">
                <div className="h-[1px] w-full bg-slate-300"></div>
            </div>


            {/* ══════════════════════════════════════════════════════
                4. Products by Category — Redesigned with Themes
            ══════════════════════════════════════════════════════ */}
            <div className="container mx-auto px-6 space-y-4">


                {Object.entries(templatesByCategory).map(([categoryName, categoryTemplates], index, array) => {
                    const theme = {
                        'Mobile Cases': { bg: 'bg-luxury-blue-light/10', text: 'text-luxury-blue-dark', icon: '📱' },
                        'Custom Mugs': { bg: 'bg-luxury-gold-light/10', text: 'text-luxury-gold', icon: '☕' },
                        'T-Shirts': { bg: 'bg-luxury-purple-light/10', text: 'text-luxury-purple', icon: '👕' },
                        'Photo Frames': { bg: 'bg-luxury-red-light/10', text: 'text-luxury-red', icon: '🖼️' },
                        'Keychains': { bg: 'bg-luxury-green-light/10', text: 'text-luxury-green', icon: '🔑' },
                        'Wall Art': { bg: 'bg-luxury-slate/10', text: 'text-luxury-charcoal', icon: '🎨' }
                    }[categoryName] || { bg: 'bg-luxury-cream', text: 'text-luxury-charcoal', icon: '✨' };


                    return (
                        <div key={categoryName}>
                            <div className={`relative overflow-hidden group/section py-8 px-6 md:px-12 rounded-[3.5rem] ${theme.bg}`}>
                                {/* Large Animated Background Text */}
                                <div className="bg-text-slide fraunces">
                                    {categoryName} {categoryName}
                                </div>


                                {/* Floating Decorative Icons */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                                    <div className="bg-drift absolute top-10 right-[10%] text-6xl opacity-[0.07]">{theme.icon}</div>
                                    <div className="bg-drift absolute bottom-20 left-[5%] text-8xl opacity-[0.05]" style={{ animationDelay: '-4s' }}>{theme.icon}</div>
                                    <div className="bg-drift absolute top-1/2 left-1/2 text-9xl opacity-[0.03]" style={{ animationDelay: '-8s' }}>{theme.icon}</div>
                                </div>

                                {/* Decorative elements - subtle glows to complement section bg */}
                                <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/60 blur-[100px] -z-10"></div>




                                <div data-sr className="flex flex-row items-center justify-between mb-12 px-2 md:px-4 relative">
                                    <h2 className="fraunces" style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.02em', textAlign: 'left' }}>
                                        {categoryName}
                                    </h2>
                                    <Link
                                        to={`/category/${categoryName}`}
                                        className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] px-6 md:px-8 py-2.5 md:py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all border border-slate-100 ${theme.text}`}
                                    >
                                        Browse All &rarr;
                                    </Link>
                                </div>



                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8 px-4">
                                    {categoryTemplates.slice(0, 6).map((template, idx) => (
                                        <Link
                                            key={template._id}
                                            to={`/product/${template._id}`}
                                            className="group block"
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div data-sr data-delay={idx * 60}>
                                                <div className="pc-card aspect-[4/5] bg-white shadow-xl shadow-rose-900/5 border-none" style={{ borderRadius: '1.5rem' }}>

                                                    <img
                                                        src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                                        alt={template.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"

                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://placehold.co/400x400/f8fafc/BFA75D?text=' + template.name.replace(' ', '+');
                                                        }}
                                                    />
                                                    <div className="pc-card-overlay">
                                                        <span className="bg-[#2D5A27] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transform translate-y-6 group-hover:translate-y-0 transition-all duration-300">
                                                            Customize
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-6 px-1">
                                                    <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                                        {template.name}
                                                    </h3>
                                                    <div className="flex items-center justify-between">
                                                        <span className="fraunces text-2xl font-black text-luxury-green-dark">₹{Math.round(template.basePrice * (1 + (template.gst || 0) / 100))}</span>
                                                        <div className="w-10 h-10 rounded-2xl border border-luxury-cream flex items-center justify-center text-slate-400 group-hover:bg-luxury-gold group-hover:border-luxury-gold group-hover:text-white transition-all duration-300">
                                                            <FaChevronRight size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            {index < array.length - 1 && (
                                <div className="mt-4">
                                    <div className="h-[1px] w-full bg-slate-300"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>


            {/* ══════════════════════════════════════════════════════
                5. Testimonials Section — Before Footer
            ══════════════════════════════════════════════════════ */}
            <div className="bg-luxury-blue-dark text-white overflow-hidden relative" style={{ padding: '96px 0' }}>
                {/* Bg blobs */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-luxury-gold rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-luxury-blue-light rounded-full blur-[100px]"></div>
                </div>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,.022) 1px,transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

                <div className="container mx-auto px-6 max-w-7xl relative" style={{ zIndex: 1 }}>
                    <div data-sr className="flex flex-col items-center text-center mb-14">
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 16, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Customer Proof</span>
                        <h2 className="fraunces" style={{ fontSize: 'clamp(30px,4vw,54px)', fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 8 }}>
                            Loved by <span style={{ color: '#BFA75D' }}>10,000+</span> Happy Creators
                        </h2>
                        <p style={{ color: 'rgba(148,163,184,.7)', fontWeight: 400, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Join our growing community of customized product lovers</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { name: "Aman Gupta", text: "Quality of the mobile cover is insane! The print doesn't fade even after months.", rating: 5 },
                            { name: "Priya Sharma", text: "The customized mug was the perfect gift for my parents. Highly recommended!", rating: 5 },
                            { name: "Rahul Verma", text: "Best customer service and super fast delivery. The colors are very vibrant.", rating: 5 }
                        ].map((rev, i) => (
                            <div key={i} className="pc-testi" data-sr data-delay={i * 90}
                                style={{ borderRadius: 24, padding: 40, background: 'rgba(255,255,255,.04)', border: '1.5px solid rgba(255,255,255,.08)' }}>
                                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                                    {[...Array(rev.rating)].map((_, j) => (
                                        <svg key={j} width="14" height="14" viewBox="0 0 20 20" style={{ fill: '#A189CC' }}>
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                    ))}
                                </div>
                                <div className="fraunces" style={{ fontSize: 52, color: '#563C8C', lineHeight: .7, marginBottom: 10, fontStyle: 'italic', opacity: .4 }}>"</div>
                                <p className="fraunces" style={{ fontSize: 18, fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 28 }}>
                                    {rev.text}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 22 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(161,137,204,.15)', border: '1.5px solid rgba(161,137,204,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#A189CC', flexShrink: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                        {rev.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '.04em', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{rev.name}</div>
                                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: '#A189CC', marginTop: 3, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Verified Buyer</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                6. Footer — Minimal Professional
            ══════════════════════════════════════════════════════ */}
            <footer className="bg-white border-t border-slate-200" style={{ padding: '88px 0 40px' }}>
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12" style={{ paddingBottom: 56, borderBottom: '1px solid #e2e8f0', marginBottom: 36 }}>

                        {/* Brand */}
                        <div>
                            <h2 className="fraunces" style={{ fontSize: 32, fontWeight: 900, fontStyle: 'italic', color: '#30174D', letterSpacing: '-1px', marginBottom: 6 }}>
                                Mimitiinaa
                            </h2>
                            <div style={{ width: 28, height: 3, background: '#563C8C', borderRadius: 100, marginBottom: 18 }} />
                            <p style={{ fontSize: 13, fontWeight: 400, color: '#64748b', lineHeight: 1.9, maxWidth: 280, marginBottom: 26, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                Quality custom products made for your special moments.
                                Expertly printed and delivered with care.
                            </p>
                            <div className="flex gap-3">
                                {[<FaTwitter size={13} />, <FaInstagram size={13} />, <FaWhatsapp size={13} />].map((icon, i) => (
                                    <a key={i} href="#" style={{ width: 38, height: 38, border: '1.5px solid #e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', transition: 'all .25s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#563C8C'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#563C8C'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                        {icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div>
                            <h3 style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: '#A189CC', marginBottom: 22, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Navigation</h3>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[{ label: 'Home Page', to: '/' }, { label: 'Our Story', to: '/about' }, { label: 'Contact Support', to: '/contact' }, { label: 'My Account', to: '/profile' }].map((link, i) => (
                                    <li key={i}>
                                        <Link to={link.to} className="pc-fl" style={{ color: '#64748b', textDecoration: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 500 }}>{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Connect */}
                        <div>
                            <h3 style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: '#A189CC', marginBottom: 22, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Connect</h3>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[{ icon: <FaMapMarkerAlt size={11} />, text: 'New Design HUB, India' }, { icon: <FaPhoneAlt size={11} />, text: '+91 98765 43210' }, { icon: <FaEnvelope size={11} />, text: 'hello@mimitiinaa.com' }].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <span style={{ color: '#A189CC', marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Subscribe */}
                        <div>
                            <div style={{ background: '#0f172a', padding: 32, borderRadius: 24, color: '#fff' }}>
                                <h3 className="fraunces" style={{ fontSize: 22, fontWeight: 700, fontStyle: 'italic', marginBottom: 6 }}>Subscribe</h3>
                                <div style={{ width: 24, height: 2, background: '#563C8C', borderRadius: 100, marginBottom: 16 }} />
                                <p style={{ fontSize: 10, color: '#475569', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 18, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Get special offers</p>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #1e293b', borderRadius: 100, overflow: 'hidden', padding: '4px 4px 4px 18px' }}>
                                    <input type="email" placeholder="Email address"
                                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: '#fff' }} />
                                    <button style={{ background: '#563C8C', color: '#fff', border: 'none', borderRadius: 100, padding: '10px 20px', fontSize: 14, cursor: 'pointer', transition: 'background .25s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#30174D'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#563C8C'}>→</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            © {new Date().getFullYear()} Mimitiinaa. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            {['Privacy', 'Terms'].map((t, i) => (
                                <a key={i} href="#" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#94a3b8', textDecoration: 'none', transition: 'color .25s', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>{t}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};




export default Home;
