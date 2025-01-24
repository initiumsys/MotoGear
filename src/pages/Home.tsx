import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Star, Shield, Truck, Search } from 'lucide-react';
import { Logo } from '../components/Logo';
import { ProductFinder } from '../components/ProductFinder';

interface HomeProps {
  onShopNow: () => void;
  onSearch: (query: string) => void;
}

export function Home({ onShopNow, onSearch }: HomeProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size={64} className="text-white" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              MotoGear
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Premium motorcycle gear and accessories for the modern rider
            </p>
            <div className="max-w-xl mx-auto mb-8">
              <ProductFinder onSearch={onSearch} />
            </div>
            <button 
              onClick={onShopNow}
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              Shop Now <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Premium Quality</h3>
            <p className="text-gray-600">Only the best gear from trusted manufacturers</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safety First</h3>
            <p className="text-gray-600">All products meet or exceed safety standards</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Quick and reliable shipping worldwide</p>
          </div>
        </div>
      </div>
    </div>
  );
}