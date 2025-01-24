import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Users, ShoppingBag, BarChart2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalSales: number;
}

export function Admin() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Get users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get orders count and total sales
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const totalSales = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalUsers: usersCount || 0,
        totalOrders: orders?.length || 0,
        totalSales
      });
    } catch (err) {
      console.error('Error loading admin statistics:', err);
      setError(t('admin.errors.loadingStats'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('admin.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('admin.stats.products')}</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('admin.stats.users')}</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('admin.stats.orders')}</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingBag className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('admin.stats.totalSales')}</p>
                <p className="text-2xl font-bold">€{(stats.totalSales / 100).toFixed(2)}</p>
              </div>
              <BarChart2 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.quickActions.title')}</h2>
            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {t('admin.quickActions.addProduct')}
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {t('admin.quickActions.manageOrders')}
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {t('admin.quickActions.viewStats')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">{t('admin.comingSoon.title')}</h2>
            <p className="text-gray-600 mb-4">
              {t('admin.comingSoon.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>{t('admin.comingSoon.features.inventory')}</li>
              <li>{t('admin.comingSoon.features.reports')}</li>
              <li>{t('admin.comingSoon.features.users')}</li>
              <li>{t('admin.comingSoon.features.discounts')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}