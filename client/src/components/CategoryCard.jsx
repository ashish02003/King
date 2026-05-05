import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ title, image, link, className = "" }) => {
    return (
        <Link
            to={link}
            className={`flex flex-col items-center group cursor-pointer ${className}`}
        >
            <div className="w-full aspect-square rounded-luxury overflow-hidden relative bg-primary-light border border-white/[0.06] group-hover:border-gold/30 transition-all duration-500 flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-gold/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 relative z-10"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/400x400/1A1333/C9A14A?text=${title.replace(' ', '+')}`;
                    }}
                />
            </div>

            <h3 className="mt-4 text-[10px] font-medium text-white/50 tracking-[0.15em] group-hover:text-gold transition-all uppercase text-center">
                {title}
            </h3>
        </Link>
    );
};

export default CategoryCard;
