import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ title, image, link, bgClass = "bg-gray-50", className = "" }) => {
    return (
        <Link
            to={link}
            className={`flex flex-col items-center group cursor-pointer ${className}`}
        >
            <div className={`w-full aspect-square rounded-xl overflow-hidden relative border border-luxury-cream bg-white shadow-[0_4px_10px_rgba(0,0,0,0.02)] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] group-hover:border-luxury-gold/20 transition-all duration-300 flex items-center justify-center p-6 md:p-8`}>
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 relative z-10"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/400x400/f8fafc/6366f1?text=${title.replace(' ', '+')}`;
                    }}
                />
            </div>

            <h3 className="mt-4 text-[11px] font-[900] text-luxury-charcoal tracking-[0.1em] group-hover:text-luxury-gold transition-colors uppercase text-center">
                {title}
            </h3>
        </Link >
    );
};






export default CategoryCard;
