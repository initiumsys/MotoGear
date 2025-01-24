import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import * as api from '../lib/api';
import { AddShippingAddressModal } from './AddShippingAddressModal';
import { AddBillingAddressModal } from './AddBillingAddressModal';

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock: number;
  };
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
}

export function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }: CartDrawerProps) {
  const { t } = useTranslation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAddShippingAddress, setShowAddShippingAddress] = useState(false);
  const [showAddBillingAddress, setShowAddBillingAddress] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const total = items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      setCheckoutSuccess(false);
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Get default shipping address
      const { data: shippingAddress, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'shipping')
        .eq('is_default', true)
        .maybeSingle();

      if (!shippingAddress) {
        setShowAddShippingAddress(true);
        return;
      }

      // Get user profile with billing address
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('payment_mode, billing_address')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile.billing_address?.address_line1) {
        setShowAddBillingAddress(true);
        return;
      }

      // Create billing address record
      const { data: billingAddress, error: billingError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          type: 'billing',
          name: profile.billing_address.address_line1,
          ...profile.billing_address,
          is_default: true
        })
        .select()
        .single();

      if (billingError) throw billingError;

      // Create checkout session
      const { data: sessionId, error: checkoutError } = await supabase
        .rpc('create_checkout_session', {
          p_billing_address_id: billingAddress.id,
          p_cart_items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.price
          })),
          p_shipping_address_id: shippingAddress.id,
          p_user_id: user.id
        });

      if (checkoutError) throw checkoutError;

      // Clear cart items one by one
      for (const item of items) {
        await onRemoveItem(item.product_id);
      }

      // Show success message
      setCheckoutSuccess(true);
      
      // Close drawer after a delay
      setTimeout(() => {
        onClose();
        setCheckoutSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error during checkout:', error);
      alert(t('checkout.error'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-6 bg-gray-50 sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {t('cart.title')}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Success message */}
            {checkoutSuccess && (
              <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                <div className="flex items-center text-green-700">
                  <Check className="w-5 h-5 mr-2" />
                  <span>{t('checkout.success')}</span>
                </div>
              </div>
            )}

            {/* Cart items */}
            <div className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-4 text-gray-500">{t('cart.empty')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </h3>
                            <button
                              onClick={() => onRemoveItem(item.product_id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            €{(item.product.price / 100).toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="flex-1 flex items-end justify-between">
                          <div className="flex items-center border rounded-lg">
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="p-2 text-gray-600 hover:text-blue-600 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            €{((item.quantity * item.product.price) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                  <p>{t('cart.total')}</p>
                  <p>€{(total / 100).toFixed(2)}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || checkoutSuccess}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? t('checkout.processing') : t('cart.checkout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddShippingAddressModal
        isOpen={showAddShippingAddress}
        onClose={() => setShowAddShippingAddress(false)}
        onAddressAdded={handleCheckout}
      />

      <AddBillingAddressModal
        isOpen={showAddBillingAddress}
        onClose={() => setShowAddBillingAddress(false)}
        onAddressAdded={handleCheckout}
      />
    </>
  );
}