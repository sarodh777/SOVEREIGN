import React from 'react';

const CATEGORY_COLORS = {
  'Vegetables': '#10B981', // Green
  'Clothing': '#F59E0B',   // Gold
  'Works': '#0EA5E9',      // Sky Blue
  'Furniture': '#E06C75',  // Terracotta approx
  'Electronics': '#8B5CF6' // Amethyst
};

const ProductCard = ({ product, onAddToCart }) => {
  const color = CATEGORY_COLORS[product.category] || '#6B7280';
  const isService = product.service || product.category === 'Works'; // Fallback if backend boolean mapping is weird

  return (
    <div 
      className="relative flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
      style={{ borderBottom: `4px solid ${color}` }}
    >
      <div className="h-48 w-full overflow-hidden relative">
        <img 
          src={product.imageUrl || 'https://via.placeholder.com/500'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div 
          className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded text-white shadow"
          style={{ backgroundColor: color }}
        >
          {product.category}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-2xl font-bold text-[#00F0FF] mb-4 mt-auto">
          ${product.price.toFixed(2)}
        </p>
        
        <button
          onClick={() => onAddToCart(product)}
          className="w-full py-2.5 rounded font-bold text-white transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 4px 14px 0 ${color}66`
          }}
        >
          {isService ? 'Book Service' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
