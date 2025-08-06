import React from 'react';

const CitationIcon = () => (
  <svg 
    xmlns='http://www.w3.org/2000/svg' 
    viewBox='0 0 16 16' 
    fill='currentColor' 
    className='icon'
  >
    <path 
      fillRule='evenodd' 
      d='M4.242 2.47a.75.75 0 0 1 .666 0l4.004 2.224a.75.75 0 0 1 0 1.332L4.908 8.25a.75.75 0 0 1-.666 0L.908 5.91a.75.75 0 0 1 0-1.332L4.242 2.47Z' 
      clipRule='evenodd' 
    />
    <path 
      fillRule='evenodd' 
      d='M3.408 8.085a.75.75 0 0 1 .666 0l4.004 2.224a.75.75 0 0 1 0 1.332L4.074 13.87a.75.75 0 0 1-.666 0L.074 11.53a.75.75 0 0 1 0-1.332l3.334-1.849Z' 
      clipRule='evenodd' 
    />
  </svg>
);

export default function Citation({ text }) {
  return (
    <span className='citation'>
      <CitationIcon />
      {text}
    </span>
  );
}