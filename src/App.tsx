import React, { useEffect, useState } from 'react';
import { ShoppingBag, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabase';
import { ProductCard } from './components/ProductCard';
import { AuthModal } from './components/AuthModal';
import { LanguageSelector } from './components/LanguageSelector';
import { ProductFinder } from './components/ProductFinder';
import { CategoryFilter } from './components/CategoryFilter';
import { Home } from './pages/Home';
import { Logo } from './components/Logo';
import { UserPanel } from './pages/UserPanel';
import { CartDrawer } from './components/CartDrawer';
import * as api from './lib/api';

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

function App() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [showHome, setShowHome] = useState(true);
  const [showUserPanel, setShowUserPanel] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      setVerificationMessage(t('auth.emailVerified'));
      window.history.replaceState(null, '', window.location.pathname);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (event === 'SIGNED_IN' && currentUser) {
        loadCartCount(currentUser.id);
        loadCartItems(currentUser.id);
        setVerificationMessage('');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCartCount(0);
        setCartItems([]);
        setShowHome(true);
        setShowUserPanel(false);
        setSelectedCategory(null);
        setSearchQuery('');
        setFilteredProducts(products);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCartCount = async (userId: string) => {
    try {
      const { count } = await api.getCartCount(userId);
      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const loadCartItems = async (userId: string) => {
    try {
      const items = await api.getCartItems(userId);
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowHome(false);
    setShowUserPanel(false);
    
    if (!query) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleShowHome = () => {
    setShowHome(true);
    setShowUserPanel(false);
    setSelectedCategory(null);
    setSearchQuery('');
    setFilteredProducts(products);
  };

  const handleShopNow = () => {
    setShowHome(false);
    setShowUserPanel(false);
    setSelectedCategory(null);
    setSearchQuery('');
    setFilteredProducts(products);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      handleShowHome();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (user) {
      try {
        await api.addToCart(user.id, productId);
        await loadCartItems(user.id);
        await loadCartCount(user.id);
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      await api.updateCartQuantity(user.id, productId, quantity);
      await loadCartItems(user.id);
      await loadCartCount(user.id);
    } catch (error) {
      console.error('Error updating cart quantity:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      await api.removeFromCart(user.id, productId);
      await loadCartItems(user.id);
      await loadCartCount(user.id);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {verificationMessage && (
        <div className="bg-green-500 text-white px-4 py-2 text-center">
          {verificationMessage}
        </div>
      )}
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={handleShowHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Logo size={32} />
            <h1 className="text-2xl font-bold text-gray-900">{t('header.title')}</h1>
          </button>
          <div className="flex items-center gap-6">
            <LanguageSelector />
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUserPanel(true)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <User size={24} className="text-gray-600" />
                  {t('header.userPanel')}
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t('header.signOut')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('header.signIn')}
              </button>
            )}
          </div>
        </div>
        {!showUserPanel && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(categoryId) => {
              setSelectedCategory(categoryId);
              setShowHome(false);
              setShowUserPanel(false);
            }}
          />
        )}
      </header>

      <main>
        {showUserPanel ? (
          <UserPanel />
        ) : showHome && !searchQuery && !selectedCategory ? (
          <Home onShopNow={handleShopNow} onSearch={handleSearch} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <ProductFinder onSearch={handleSearch} className="mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;