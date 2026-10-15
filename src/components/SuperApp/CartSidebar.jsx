import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, CheckCircle } from 'lucide-react';
import api from '../../api';

const CartSidebar = ({ isOpen, onClose, cartItems, removeFromCart, clearCart }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [email, setEmail] = useState('user@example.com');

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      await api.post('/api/items/checkout', {
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
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050B2E] z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0B1550] text-[#F8FAFC] z-50 shadow-2xl flex flex-col border-l border-[#8B92FF]/25"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#8B92FF]/20 bg-[#111B57]/60">
              <h2 className="text-xl font-bold text-[#F8FAFC]">Your Cart</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-[#B8C5F2]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#B8C5F2]/50">
                  <ShoppingCartIcon />
                  <p className="mt-4 text-base font-semibold">Your cart is empty</p>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 bg-[#111B57]/80 p-4 rounded-xl border border-[#8B92FF]/20"
                  >
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#F8FAFC] line-clamp-1">{item.name}</h4>
                      <p className="text-[#356BFF] font-bold mt-1">₹{item.price.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-[#B8C5F2]/60 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 bg-[#111B57]/90 border-t border-[#8B92FF]/20">
                <div className="flex justify-between items-center mb-4 text-base">
                  <span className="text-[#B8C5F2]">Total</span>
                  <span className="text-2xl font-black text-[#F8FAFC]">₹{total.toFixed(2)}</span>
                </div>
                
                {checkoutSuccess ? (
                  <div className="w-full py-3 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center gap-2 font-bold border border-emerald-500/25">
                    <CheckCircle className="h-5 w-5" />
                    Order Confirmed!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3 bg-gradient-to-r from-[#356BFF] to-[#713BFF] text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(113,59,255,0.35)] flex items-center justify-center disabled:opacity-70 cursor-pointer"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      'Complete Checkout'
                    )}
                  </button>
                )}
                <div className="mt-4">
                  <label className="text-xs text-[#B8C5F2] block mb-1">Email for Confirmation</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#050B2E] border border-[#8B92FF]/25 rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#713BFF]"
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
