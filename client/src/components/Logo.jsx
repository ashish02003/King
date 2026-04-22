import React from "react";
import mylogo from "./Mimitiinaa_Logo.svg";

const Logo = ({ className = "" }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src={mylogo}
        alt="PrintShoppy Logo"
        className="h-6 md:h-8 w-auto object-contain transition-all"
      />
      <span className="text-xl font-black text-shimmer hidden sm:block tracking-tight">
        Mimitiinaa
      </span>
    </div>
  );
};

export default Logo;

