import React from "react";
import mylogo from "./Mimitiinaa_Logo.svg";

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <img
          src={mylogo}
          alt="Mimitiinaa"
          className="h-7 md:h-9 w-auto object-contain relative z-10"
        />
      </div>
      <span className="text-xl font-serif text-white hidden sm:block tracking-tight">
        Mimitiinaa<span className="text-gold">.</span>
      </span>
    </div>
  );
};

export default Logo;
