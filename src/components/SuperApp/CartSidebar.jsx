import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const CartSidebar = ({ isOpen, onClose, cartItems, removeFromCart, clearCart }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [email, setEmail] = useState('user@example.com'); // Mock email for demo

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      await axios.post('http://localhost:8080/api/items/checkout', {
        email: email,
        total: total
      });
      setCheckoutSuccess(true);
      setTimeout(() => {
        clearCart();
        setCheckoutSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please ensure the backend is running and configured.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#112240] text-gray-200 z-50 shadow-2xl flex flex-col border-l border-[#00F0FF]/20"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Your Cart</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ShoppingCartIcon />
                  <p className="mt-4 text-lg">Your cart is empty</p>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 bg-[#0A192F] p-4 rounded-lg border border-gray-700"
                  >
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[#00F0FF] font-bold">${item.price.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-[#0A192F] border-t border-gray-700">
                <div className="flex justify-between items-center mb-4 text-lg">
                  <span className="text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-white">${total.toFixed(2)}</span>
                </div>
                
                {checkoutSuccess ? (
                  <div className="w-full py-3 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center gap-2 font-bold border border-green-500/50">
                    <CheckCircle className="h-5 w-5" />
                    Order Confirmed!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3 bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#0A192F] rounded-lg font-bold text-lg transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Processing...
                      </>
                    ) : (
                      'Checkout'
                    )}
                  </button>
                )}
                <div className="mt-4">
                  <label className="text-xs text-gray-500 block mb-1">Email for Confirmation</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#112240] border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

export default CartSidebar;
