import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';

// Configure environment variables
dotenv.config();

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

// Setup file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../proto/shop.proto');

// Load protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const shopProto = protoDescriptor.shop;

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Error handling middleware
const handleError = (error, call, callback) => {
  logger.error({ error }, 'Error in gRPC call');
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

// Currency conversion helper
const convertPrice = (price, fromCurrency, toCurrency, currencies) => {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return price;
  
  const from = currencies.find(c => c.code === fromCurrency);
  const to = currencies.find(c => c.code === toCurrency);
  
  if (!from || !to) return price;
  
  // Convert to base currency (EUR) first, then to target currency
  return Math.round((price / from.rate) * to.rate);
};

// Service implementation
const server = new grpc.Server();

server.addService(shopProto.ShopService.service, {
  async getProducts(call, callback) {
    try {
      logger.info({ params: call.request }, 'getProducts called');
      
      // Get currencies first
      const { data: currencies, error: currencyError } = await supabase
        .from('currencies')
        .select('*');

      if (currencyError) throw currencyError;

      const query = supabase
        .from('products')
        .select('*, category:categories(*), currency:currencies(*)');

      if (call.request.category_id) {
        query.eq('category_id', call.request.category_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Convert prices if needed
      const targetCurrency = call.request.currency_code || 'EUR';
      const products = data.map(product => ({
        ...product,
        price: convertPrice(
          product.price,
          product.currency_code,
          targetCurrency,
          currencies
        ),
        currency: currencies.find(c => c.code === targetCurrency)
      }));
      
      logger.info({ count: products.length }, 'Products retrieved successfully');
      callback(null, { products });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async getCurrencies(call, callback) {
    try {
      logger.info('getCurrencies called');
      
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('is_base', { ascending: false });

      if (error) throw error;
      
      logger.info({ count: data.length }, 'Currencies retrieved successfully');
      callback(null, { currencies: data });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async getCategories(call, callback) {
    try {
      logger.info('getCategories called');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      logger.info({ count: data.length }, 'Categories retrieved successfully');
      callback(null, { categories: data });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async getCartItems(call, callback) {
    try {
      logger.info({ userId: call.request.user_id }, 'getCartItems called');
      
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', call.request.user_id);

      if (error) throw error;
      
      logger.info({ count: data.length }, 'Cart items retrieved successfully');
      callback(null, { items: data });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async addToCart(call, callback) {
    try {
      const { user_id, product_id, quantity } = call.request;
      logger.info({ user_id, product_id, quantity }, 'addToCart called');

      // Check product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', product_id)
        .single();

      if (productError) throw productError;

      if (!product || product.stock < quantity) {
        callback({
          code: grpc.status.FAILED_PRECONDITION,
          details: 'Insufficient stock'
        });
        return;
      }

      // Add to cart
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id,
          product_id,
          quantity: quantity || 1
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;

      logger.info('Item added to cart successfully');
      callback(null, { success: true });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async getCartCount(call, callback) {
    try {
      logger.info({ userId: call.request.user_id }, 'getCartCount called');
      
      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact' })
        .eq('user_id', call.request.user_id);

      if (error) throw error;

      logger.info({ count }, 'Cart count retrieved successfully');
      callback(null, { count: count || 0 });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async removeFromCart(call, callback) {
    try {
      const { user_id, product_id } = call.request;
      logger.info({ user_id, product_id }, 'removeFromCart called');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .match({ user_id, product_id });

      if (error) throw error;

      logger.info('Item removed from cart successfully');
      callback(null, { success: true });
    } catch (error) {
      handleError(error, call, callback);
    }
  },

  async updateCartQuantity(call, callback) {
    try {
      const { user_id, product_id, quantity } = call.request;
      logger.info({ user_id, product_id, quantity }, 'updateCartQuantity called');

      if (quantity <= 0) {
        callback({
          code: grpc.status.INVALID_ARGUMENT,
          details: 'Quantity must be greater than 0'
        });
        return;
      }

      // Check product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', product_id)
        .single();

      if (productError) throw productError;

      if (!product || product.stock < quantity) {
        callback({
          code: grpc.status.FAILED_PRECONDITION,
          details: 'Insufficient stock'
        });
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .match({ user_id, product_id });

      if (error) throw error;

      logger.info('Cart quantity updated successfully');
      callback(null, { success: true });
    } catch (error) {
      handleError(error, call, callback);
    }
  }
});

// Start server
const port = process.env.GRPC_PORT || 50051;
server.bindAsync(
  `0.0.0.0:${port}`,
  grpc.ServerCredentials.createInsecure(),
  (error, boundPort) => {
    if (error) {
      logger.error({ error }, 'Failed to start gRPC server');
      process.exit(1);
    }
    server.start();
    logger.info({ port: boundPort }, 'gRPC server running');
  }
);