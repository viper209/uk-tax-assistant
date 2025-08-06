import React from 'react';

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C13.81 22 15.5 21.5 17 20.67L12 12V2Z" 
        fill="#363062" 
      />
      <path 
        d="M20.67 17C21.5 15.5 22 13.81 22 12C22 6.48 17.52 2 12 2V12L20.67 17Z" 
        fill="#00A9A5"
      />
    </svg>
  );
}