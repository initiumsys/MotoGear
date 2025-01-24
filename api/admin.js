import { createClient } from '@supabase/supabase-js';
import pino from 'pino';
import * as grpc from '@grpc/grpc-js';

// Setup logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Error handling middleware
const handleError = (error, call, callback) => {
  logger.error({ error }, 'Error in admin gRPC call');
  const status = {
    code: grpc.status.INTERNAL,
    details: 'Internal server error'
  };
  if (error.code === 'PGRST301') {
    status.code = grpc.status.UNAUTHENTICATED;
    status.details = 'Authentication required';
  }
  callback(status);
};

// Admin authentication middleware
const checkAdminAuth = async (call) => {
  const token = call.metadata.get('authorization')[0];
  if (!token) {
    throw { code: grpc.status.UNAUTHENTICATED, details: 'No authorization token' };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw { code: grpc.status.UNAUTHENTICATED, details: 'Invalid token' };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('auth.users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (adminError || !adminUser?.is_admin) {
    throw { code: grpc.status.PERMISSION_DENIED, details: 'Admin access required' };
  }

  return user;
};

// Admin service implementation
export const adminService = {
  async createProduct(call, callback) {
    try {
      await checkAdminAuth(call);
      const { name, description, price, image_url, stock, category_id } = call.request;

      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          price,
          image_url,
          stock,
          category_id
        })
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      callback(null, data);
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async updateProduct(call, callback) {
    try {
      await checkAdminAuth(call);
      const { id, ...updates } = call.request;

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      callback(null, data);
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async deleteProduct(call, callback) {
    try {
      await checkAdminAuth(call);
      const { id } = call.request;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      callback(null, { success: true });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async createCategory(call, callback) {
    try {
      await checkAdminAuth(call);
      const { name, description } = call.request;

      const { data, error } = await supabase
        .from('categories')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;
      callback(null, data);
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async updateCategory(call, callback) {
    try {
      await checkAdminAuth(call);
      const { id, name, description } = call.request;

      const { data, error } = await supabase
        .from('categories')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      callback(null, data);
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async deleteCategory(call, callback) {
    try {
      await checkAdminAuth(call);
      const { id } = call.request;

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      callback(null, { success: true });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async getOrders(call, callback) {
    try {
      await checkAdminAuth(call);
      const { status, start_date, end_date, limit = 10, offset = 0 } = call.request;

      let query = supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(*))', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      callback(null, {
        orders: data,
        total_count: count
      });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async updateOrderStatus(call, callback) {
    try {
      await checkAdminAuth(call);
      const { order_id, status } = call.request;

      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', order_id)
        .select('*, items:order_items(*, product:products(*))')
        .single();

      if (error) throw error;
      callback(null, data);
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async getSalesStats(call, callback) {
    try {
      await checkAdminAuth(call);
      const { start_date, end_date } = call.request;

      // Get total sales and orders
      const { data: totals, error: totalsError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .eq('status', 'completed');

      if (totalsError) throw totalsError;

      const totalSales = totals.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = totals.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Get daily sales
      const { data: dailySales, error: dailyError } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .eq('status', 'completed')
        .order('created_at');

      if (dailyError) throw dailyError;

      // Get top products
      const { data: topProducts, error: productsError } = await supabase
        .from('order_items')
        .select(`
          product:products(*),
          quantity,
          price
        `)
        .gte('created_at', start_date)
        .lte('created_at', end_date)
        .order('quantity', { ascending: false })
        .limit(5);

      if (productsError) throw productsError;

      // Get top categories
      const { data: topCategories, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          products!inner(
            order_items!inner(
              quantity,
              price,
              created_at
            )
          )
        `)
        .gte('products.order_items.created_at', start_date)
        .lte('products.order_items.created_at', end_date)
        .order('products.order_items(quantity)', { ascending: false })
        .limit(5);

      if (categoriesError) throw categoriesError;

      callback(null, {
        total_sales: totalSales,
        total_orders: totalOrders,
        average_order_value: averageOrderValue,
        daily_sales: processDailySales(dailySales),
        top_products: processTopProducts(topProducts),
        top_categories: processTopCategories(topCategories)
      });
    } catch (error) {
      handleError(error, call, callback);
    }
  }
};

// Helper functions for processing statistics
function processDailySales(sales) {
  const dailyMap = sales.reduce((acc, order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { sales: 0, orders: 0 };
    }
    acc[date].sales += order.total;
    acc[date].orders += 1;
    return acc;
  }, {});

  return Object.entries(dailyMap).map(([date, stats]) => ({
    date,
    sales: stats.sales,
    orders: stats.orders
  }));
}

function processTopProducts(products) {
  return products.map(item => ({
    product: item.product,
    total_sales: item.quantity * item.price,
    quantity_sold: item.quantity
  }));
}

function processTopCategories(categories) {
  return categories.map(category => {
    const products_sold = category.products.reduce((sum, product) => 
      sum + product.order_items.reduce((qty, item) => qty + item.quantity, 0), 0);
    const total_sales = category.products.reduce((sum, product) => 
      sum + product.order_items.reduce((total, item) => total + (item.quantity * item.price), 0), 0);
    return {
      category: {
        id: category.id,
        name: category.name,
        description: category.description
      },
      total_sales,
      products_sold
    };
  });
}