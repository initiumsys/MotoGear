import { supabase } from './supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category_id: string;
  category: Category;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  is_base: boolean;
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

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

export async function addToCart(userId: string, productId: string, quantity: number = 1): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .upsert({
      user_id: userId,
      product_id: productId,
      quantity
    }, {
      onConflict: 'user_id,product_id'
    });

  if (error) throw error;
}

export async function getCartCount(userId: string): Promise<{ count: number }> {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (error) throw error;
  return { count: count || 0 };
}

export async function removeFromCart(userId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .match({ user_id: userId, product_id: productId });

  if (error) throw error;
}

export async function updateCartQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    return removeFromCart(userId, productId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .match({ user_id: userId, product_id: productId });

  if (error) throw error;
}

export async function getDefaultCurrency(): Promise<Currency> {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .eq('is_base', true)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(
        *,
        product:products(*)
      ),
      tracking:order_tracking(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}