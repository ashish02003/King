import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhoneAlt, FaQuestionCircle, FaTruck, FaAward, FaUsers, FaGem, FaUserTie } from 'react-icons/fa';

const TopInfoBar = () => {
    return (
        <div className="w-full">
            {/* Top Secondary Links */}
            <div className="bg-white border-b py-2 hidden md:block">
                <div className="container mx-auto flex justify-between items-center px-4 text-[13px] font-semibold text-gray-500">
                    <div className="flex space-x-6">
                        <Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link>
                        <Link to="/faq" className="hover:text-blue-600 transition-colors">FAQ's</Link>
                        <Link to="/track-order" className="hover:text-blue-600 transition-colors">Track Order</Link>
                    </div>
                </div>
            </div>

            {/* Dark Trust Badge Bar */}
            <div className="bg-luxury-purple-dark text-white py-2.5 overflow-hidden whitespace-nowrap">
                <div className="container mx-auto px-4 flex justify-between items-center text-[11px] md:text-[13px] font-bold uppercase tracking-tight">
                    <div className="flex items-center space-x-1.5 text-luxury-purple-light">
                        <FaAward className="text-sm" />
                        <span className="text-white">EST. 2015</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <FaUsers className="text-luxury-purple-light text-sm" />
                        <span>Trusted By Millions</span>
                    </div>

                    <div className="flex items-center space-x-1.5 hidden sm:flex">
                        <span className="text-luxury-purple-light">🔥 1 Crore+</span>
                        <span>Photos Printed</span>
                    </div>

                    <div className="flex items-center space-x-1.5 hidden lg:flex">
                        <FaGem className="text-luxury-purple-light text-sm" />
                        <span>Crafted With Premium Materials</span>
                    </div>

                    <div className="flex items-center space-x-1.5 hidden xl:flex">
                        <FaUserTie className="text-luxury-purple-light text-sm" />
                        <span>Professional Editing</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopInfoBar;
