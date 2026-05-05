import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhoneAlt, FaQuestionCircle, FaTruck, FaAward, FaUsers, FaGem, FaUserTie } from 'react-icons/fa';

const TopInfoBar = () => {
    return (
        <div className="w-full relative z-[10000]">
            {/* Top Secondary Links */}
            <div className="bg-primary border-b border-white/5 py-2 hidden md:block">
                <div className="container mx-auto flex justify-between items-center px-6 text-[10px] font-bold text-accent-soft uppercase tracking-widest">
                    <div className="flex space-x-8">
                        <Link to="/contact" className="hover:text-gold transition-colors">Concierge</Link>
                        <Link to="/faq" className="hover:text-gold transition-colors">Inquiries</Link>
                        <Link to="/track-order" className="hover:text-gold transition-colors">Track Shipment</Link>
                    </div>
                    <div className="flex items-center gap-2 italic">
                        <span className="text-gold">Private Member Suite</span>
                    </div>
                </div>
            </div>

            {/* Dark Trust Badge Bar */}
            <div className="bg-primary-dark text-white py-3 overflow-hidden whitespace-nowrap">
                <div className="container mx-auto px-6 flex justify-between items-center text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em]">
                    <div className="flex items-center space-x-2 text-gold">
                        <FaAward className="text-xs" />
                        <span className="text-white">EST. 2015</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <FaUsers className="text-gold text-xs" />
                        <span className="text-accent-soft">Global Patronage</span>
                    </div>

                    <div className="flex items-center space-x-2 hidden sm:flex">
                        <span className="text-gold animate-pulse">✨ 1 Crore+</span>
                        <span className="text-accent-soft">Masterpieces Created</span>
                    </div>

                    <div className="flex items-center space-x-2 hidden lg:flex">
                        <FaGem className="text-gold text-xs" />
                        <span className="text-accent-soft">Premium Curation</span>
                    </div>

                    <div className="flex items-center space-x-2 hidden xl:flex">
                        <FaUserTie className="text-gold text-xs" />
                        <span className="text-accent-soft">Artisan Review</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopInfoBar;
