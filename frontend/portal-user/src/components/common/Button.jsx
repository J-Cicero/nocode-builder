import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick, 
  type = 'button',
  disabled = false 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#C4622D] text-white hover:bg-[#A04E24] shadow-md hover:shadow-lg active:scale-95",
    secondary: "bg-[#D4A017] text-[#1A0E0A] hover:bg-[#B88A14] shadow-sm",
    outline: "bg-transparent border-2 border-[#E8D9C4] text-[#1A0E0A] hover:border-[#C4622D] hover:text-[#C4622D]",
    ghost: "bg-transparent text-[#7A5C44] hover:bg-[#FBF4E9] hover:text-[#C4622D]",
    dark: "bg-[#1A0E0A] text-white hover:bg-black shadow-lg"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
