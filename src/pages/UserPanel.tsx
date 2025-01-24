import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { User, MapPin, CreditCard, Package, Plus, X } from 'lucide-react';
import * as api from '../lib/api';

interface UserProfile {
  id: string;
  tax_id: string;
  company_name: string;
  phone: string;
  phone_prefix: string;
  email: string;
  payment_mode: 'prepaid' | 'postpaid';
  billing_address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface Address {
  id: string;
  type: 'shipping';
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  provider: string;
  last_digits?: string;
  expiry_date?: string;
  is_default: boolean;
}

interface Order {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  tracking: OrderTracking | null;
}

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
  };
  quantity: number;
  price_at_time: number;
}

interface OrderTracking {
  tracking_number: string;
  carrier: string;
  status: string;
  location: string;
}

interface AddressFormData {
  type: 'shipping';
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export function UserPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    type: 'shipping',
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'ES',
    is_default: false
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        throw new Error(t('userPanel.errors.loading'));
      }

      // Load addresses
      const { data: addressesData, error: addressesError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'shipping')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (addressesError) {
        console.error('Error loading addresses:', addressesError);
        throw new Error(t('userPanel.errors.loading'));
      }

      // Load payment methods
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id);

      if (paymentsError) {
        console.error('Error loading payment methods:', paymentsError);
        throw new Error(t('userPanel.errors.loading'));
      }

      // Load orders
      const ordersData = await api.getOrders(user.id);

      setProfile(profileData);
      setAddresses(addressesData || []);
      setPaymentMethods(paymentsData || []);
      setOrders(ordersData || []);
      setError(null);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(t('userPanel.errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(t('userPanel.errors.updateProfile'));
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      if (addressForm.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('type', addressForm.type);
      }

      const { error: insertError } = await supabase
        .from('addresses')
        .insert({
          ...addressForm,
          user_id: user.id
        });

      if (insertError) throw insertError;

      await loadUserData();
      setShowAddressModal(false);
      setAddressForm({
        type: 'shipping',
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'ES',
        is_default: false
      });
    } catch (err) {
      console.error('Error adding address:', err);
      setError(t('userPanel.errors.updateAddress'));
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (deleteError) throw deleteError;
      await loadUserData();
    } catch (err) {
      console.error('Error deleting address:', err);
      setError(t('userPanel.errors.deleteAddress'));
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('type', 'shipping');

      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (updateError) throw updateError;
      await loadUserData();
    } catch (err) {
      console.error('Error setting default address:', err);
      setError(t('userPanel.errors.updateAddress'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                <User className="w-5 h-5 mr-2" />
                {t('userPanel.tabs.profile')}
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`${
                  activeTab === 'addresses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                <MapPin className="w-5 h-5 mr-2" />
                {t('userPanel.tabs.addresses')}
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {t('userPanel.tabs.payments')}
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                <Package className="w-5 h-5 mr-2" />
                {t('userPanel.tabs.orders')}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('userPanel.profile.title')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('userPanel.profile.description')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('userPanel.profile.email')}
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('userPanel.profile.taxId')}
                    </label>
                    <input
                      type="text"
                      value={profile?.tax_id || ''}
                      onChange={(e) => updateProfile({ tax_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('userPanel.profile.companyName')}
                    </label>
                    <input
                      type="text"
                      value={profile?.company_name || ''}
                      onChange={(e) => updateProfile({ company_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Empresa S.L. / Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('userPanel.profile.phone')}
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <select
                        value={profile?.phone_prefix || '+34'}
                        onChange={(e) => updateProfile({ phone_prefix: e.target.value })}
                        className="rounded-l-md border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                      >
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+351">🇵🇹 +351</option>
                      </select>
                      <input
                        type="tel"
                        value={profile?.phone || ''}
                        onChange={(e) => updateProfile({ phone: e.target.value })}
                        className="flex-1 rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={t('userPanel.profile.phonePlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('userPanel.profile.paymentMode')}
                    </label>
                    <select
                      value={profile?.payment_mode || 'prepaid'}
                      onChange={(e) => updateProfile({ 
                        payment_mode: e.target.value as 'prepaid' | 'postpaid' 
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="prepaid">{t('userPanel.profile.paymentModes.prepaid')}</option>
                      <option value="postpaid">{t('userPanel.profile.paymentModes.postpaid')}</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      {t(`userPanel.profile.paymentModeDescriptions.${profile?.payment_mode || 'prepaid'}`)}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      {t('userPanel.profile.billingAddress')}
                    </h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userPanel.addresses.line1')}
                        </label>
                        <input
                          type="text"
                          value={profile?.billing_address?.address_line1 || ''}
                          onChange={(e) => updateProfile({
                            billing_address: {
                              ...profile?.billing_address,
                              address_line1: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userPanel.addresses.line2')}
                        </label>
                        <input
                          type="text"
                          value={profile?.billing_address?.address_line2 || ''}
                          onChange={(e) => updateProfile({
                            billing_address: {
                              ...profile?.billing_address,
                              address_line2: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userPanel.addresses.city')}
                        </label>
                        <input
                          type="text"
                          value={profile?.billing_address?.city || ''}
                          onChange={(e) => updateProfile({
                            billing_address: {
                              ...profile?.billing_address,
                              city: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userPanel.addresses.state')}
                        </label>
                        <input
                          type="text"
                          value={profile?.billing_address?.state || ''}
                          onChange={(e) => updateProfile({
                            billing_address: {
                              ...profile?.billing_address,
                              state: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userPanel.addresses.postalCode')}
                        </label>
                        <input
                          type="text"
                          value={profile?.billing_address?.postal_code || ''}
                          onChange={(e) => updateProfile({
                            billing_address: {
                              ...profile?.billing_address,
                              postal_code: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userPanel.addresses.country')}
                        </label>
                        <select
                          value={profile?.billing_address?.country || 'ES'}
                          onChange={(e) => updateProfile({
                            billing_address: {
                              ...profile?.billing_address,
                              country: e.target.value
                            }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="ES">🇪🇸 España</option>
                          <option value="FR">🇫🇷 Francia</option>
                          <option value="PT">🇵🇹 Portugal</option>
                          <option value="IT">🇮🇹 Italia</option>
                          <option value="DE">🇩🇪 Alemania</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('userPanel.addresses.title')}
                  </h3>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('userPanel.addresses.addNew')}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`bg-white p-4 rounded-lg border ${
                        address.is_default ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{address.name}</h5>
                          {address.is_default && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {t('userPanel.addresses.default')}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!address.is_default && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              {t('userPanel.common.default')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-sm text-red-600 hover:text-red-500"
                          >
                            {t('userPanel.common.delete')}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{address.address_line1}</p>
                        {address.address_line2 && <p>{address.address_line2}</p>}
                        <p>
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  ))}

                  {addresses.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      {t('userPanel.addresses.noAddresses')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('userPanel.payments.title')}
                  </h3>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    {t('userPanel.payments.addNew')}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {method.provider}
                            {method.last_digits && ` (**** ${method.last_digits})`}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {t(`userPanel.payments.types.${method.type}`)}
                          </p>
                        </div>
                        {method.is_default && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('userPanel.payments.default')}
                          </span>
                        )}
                      </div>
                      {method.expiry_date && (
                        <p className="text-sm text-gray-600">
                          {t('userPanel.payments.expires')}: {method.expiry_date}
                        </p>
                      )}
                      <div className="mt-4 flex space-x-3">
                        <button className="text-sm text-blue-600 hover:text-blue-500">
                          {t('userPanel.common.edit')}
                        </button>
                        <button className="text-sm text-red-600 hover:text-red-500">
                          {t('userPanel.common.delete')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('userPanel.orders.title')}
                </h3>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          {t('userPanel.orders.orderNumber')}
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('userPanel.orders.date')}
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('userPanel.orders.status')}
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('userPanel.orders.total')}
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          {t('userPanel.orders.tracking')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {t(`userPanel.orders.statuses.${order.status}`)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            €{(order.total_amount / 100).toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {order.tracking?.tracking_number ? (
                              <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4" />
                                <span>{order.tracking.tracking_number} </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}

                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                            {t('userPanel.orders.noOrders')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-medium text-gray-900 mb-6">
              {t('userPanel.addresses.addNew')}
            </h3>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('userPanel.addresses.name')}
                </label>
                <input
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('userPanel.addresses.line1')}
                </label>
                <input
                  type="text"
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    address_line1: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('userPanel.addresses.line2')}
                </label>
                <input
                  type="text"
                  value={addressForm.address_line2}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    address_line2: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('userPanel.addresses.city')}
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      city: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('userPanel.addresses.state')}
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      state: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('userPanel.addresses.postalCode')}
                  </label>
                  <input
                    type="text"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      postal_code: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('userPanel.addresses.country')}
                  </label>
                  <select
                    value={addressForm.country}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      country: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="ES">🇪🇸 España</option>
                    <option value="FR">🇫🇷 Francia</option>
                    <option value="PT">🇵🇹 Portugal</option>
                    <option value="IT">🇮🇹 Italia</option>
                    <option value="DE">🇩🇪 Alemania</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    is_default: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                  {t('userPanel.addresses.setDefault')}
                </label>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  {t('userPanel.common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {t('userPanel.common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}