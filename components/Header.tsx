
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            <span className="text-purple-600">TikTok</span> Generator Foto Fashion
          </h1>
        </div>
      </div>
    </header>
  );
};