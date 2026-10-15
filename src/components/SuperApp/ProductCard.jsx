import React from 'react';

const CATEGORY_COLORS = {
  'Vegetables': '#356BFF', 
  'Clothing': '#F59E0B',   
  'Works': '#0EA5E9',      
  'Furniture': '#EC4899',  
  'Electronics': '#713BFF' 
};

const ProductCard = ({ product, onAddToCart }) => {
  const color = CATEGORY_COLORS[product.category] || '#713BFF';
  const isService = product.service || product.category === 'Works';

  return (
    <div 
      className="relative flex flex-col bg-[#111B57]/80 backdrop-blur-md border border-[#8B92FF]/22 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#713BFF]/50 hover:shadow-[0_8px_30px_rgba(113,59,255,0.2)]"
      style={{ borderBottom: `4px solid ${color}` }}
    >
      <div className="h-48 w-full overflow-hidden relative">
        <img 
          src={product.imageUrl || 'https://via.placeholder.com/500'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div 
          className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs font-bold rounded-lg text-white shadow"
          style={{ backgroundColor: color }}
        >
          {product.category}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-[#F8FAFC] mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-xl font-black text-[#F8FAFC] mb-4 mt-auto">
          ₹{product.price.toFixed(2)}
        </p>
        
        <button
          onClick={() => onAddToCart(product)}
          className="w-full py-2.5 rounded-xl font-bold text-white transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-50 cursor-pointer"
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
