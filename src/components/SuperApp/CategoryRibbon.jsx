import React from 'react';

const CATEGORIES = [
  { name: 'All', color: '#6B7280' },
  { name: 'Vegetables', color: '#10B981' }, // Green
  { name: 'Clothing', color: '#F59E0B' },   // Gold
  { name: 'Works', color: '#0EA5E9' },      // Sky Blue
  { name: 'Furniture', color: '#E06C75' },  // Terracotta approx
  { name: 'Electronics', color: '#8B5CF6' } // Amethyst
];

const CategoryRibbon = ({ activeCategory, setActiveCategory }) => {
  return (
    <div className="w-full bg-[#0B0F14] border-b border-gray-800 shadow-md overflow-x-auto hide-scrollbar">
      <div className="flex items-center space-x-4 px-4 py-3 min-w-max max-w-7xl mx-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            style={{
              backgroundColor: activeCategory === cat.name ? cat.color : 'transparent',
              borderColor: cat.color,
              color: activeCategory === cat.name ? '#fff' : cat.color
            }}
            className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all duration-300 transform hover:scale-105 whitespace-nowrap`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryRibbon;
