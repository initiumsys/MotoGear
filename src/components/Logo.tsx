import React from 'react';
import { Bike, Wrench } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Bike size={size} className="text-blue-600" />
      <Wrench 
        size={size * 0.5} 
        className="absolute -bottom-1 -right-1 text-gray-800 transform rotate-45" 
      />
    </div>
  );
}