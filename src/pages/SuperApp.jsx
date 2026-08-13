import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/SuperApp/Navbar';
import CategoryRibbon from '../components/SuperApp/CategoryRibbon';
import ProductCard from '../components/SuperApp/ProductCard';
import CartSidebar from '../components/SuperApp/CartSidebar';

const SuperApp = () => {
  const [items, setItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/items');
        setItems(response.data);
      } catch (error) {
        console.error('Error fetching items:', error);
        // Fallback mock data if backend isn't running
        setItems([
          { id: 1, name: "Organic Tomatoes (Fallback)", category: "Vegetables", price: 4.99, isService: false, imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80" },
          { id: 2, name: "Home Cleaning (Fallback)", category: "Works", price: 150.00, isService: true, imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleAddToCart = (product) => {
    setCartItems([...cartItems, product]);
  };

  const handleRemoveFromCart = (indexToRemove) => {
    setCartItems(cartItems.filter((_, index) => index !== indexToRemove));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const filteredItems = activeCategory === 'All' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <Navbar 
        cartItemCount={cartItems.length} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <CategoryRibbon 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00F0FF]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <ProductCard 
                key={item.id || item.name} 
                product={item} 
                onAddToCart={handleAddToCart} 
              />
            ))}
          </div>
        )}
      </main>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        removeFromCart={handleRemoveFromCart}
        clearCart={handleClearCart}
      />
    </div>
  );
};

export default SuperApp;
