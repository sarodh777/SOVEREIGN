import React from 'react';

const CATEGORIES = [
  { name: 'All', color: '#713BFF' },
  { name: 'Vegetables', color: '#356BFF' },
  { name: 'Clothing', color: '#F59E0B' },
  { name: 'Works', color: '#0EA5E9' },
  { name: 'Furniture', color: '#EC4899' },
  { name: 'Electronics', color: '#A855F7' }
];

const CategoryRibbon = ({ activeCategory, setActiveCategory }) => {
  return (
    <div className="w-full bg-[#0B1550]/80 border-b border-[#8B92FF]/20 shadow-md overflow-x-auto hide-scrollbar">
      <div className="flex items-center space-x-3 px-4 py-3 min-w-max max-w-7xl mx-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            style={{
              backgroundColor: activeCategory === cat.name ? cat.color : 'transparent',
              borderColor: cat.color,
              color: activeCategory === cat.name ? '#fff' : cat.color
            }}
            className="px-4 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryRibbon;
