const XLSX = require('xlsx');
const fs = require('fs');

const input = 'minor_cp_kw.xlsx';
const output = 'minor_cp_kw.json';
const testOutput = 'test_data.json';

const workbook = XLSX.readFile(input);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// CATEGORY/SUBCATEGORY MAPPING
const CATEGORY_MAP = {
  Women: {
    Clothing: [
      'women-clothing', 'women-clothing-dresses', 'women-clothing-bottoms', 'women-clothing-tops', 'women-clothing-lingerie', 'women-clothing-nightwear', 'women-clothing-sportswearandactivewear',
    ],
    Footwear: [
      'women-shoes', 'women-shoes-flats', 'women-shoes-heels', 'women-shoes-sandals', 'women-shoes-ballerinas', 'women-shoes-mules',
    ],
    'Intimate & Sleep': [
      'women-clothing-lingerie', 'women-clothing-nightwear',
    ],
    Accessories: [
      'women-bagsandwallets', 'women-watchesandjewellery', 'women-watchesandjewellery-jewellery', 'women-watchesandjewellery-watches', 'women-accessories',
    ],
    'Personal Care': [
      'women-personalcare', 'women-personalcare-haircare', 'women-personalcare-skincare', 'women-personalcare-fragrance',
    ],
  },
  Men: {
    Clothing: [
      'men-clothing', 'men-clothing-shirts', 'men-clothing-tshirtsandpolos', 'men-clothing-bottoms', 'men-clothing-nightwear', 'men-clothing-sportswearandactivewear',
    ],
    Footwear: [
      'men-shoes', 'men-shoes-sneakers', 'men-shoes-sandals',
    ],
    Accessories: [
      'men-bagsandwallets', 'men-watchesandjewellery', 'men-watchesandjewellery-jewellery', 'men-watchesandjewellery-watches', 'men-accessories',
    ],
    Grooming: [
      'men-personalcare', 'men-personalcare-haircare', 'men-personalcare-skincare', 'men-personalcare-fragrance',
    ],
  },
  Kids: {
    Clothing: [
      'kids-clothing', 'kids-clothing-boys', 'kids-clothing-girls', 'kids-clothing-baby',
    ],
    Footwear: [
      'kids-shoes', 'kids-shoes-boys', 'kids-shoes-girls', 'kids-shoes-baby',
    ],
    'Toys & Games': [
      'kids-toysandgames',
    ],
    Essentials: [
      'kids-essentials', 'kids-essentials-baby',
    ],
  },
  Girls: {
    Clothing: [
      'girls-clothing', 'girls-clothing-bottoms', 'girls-clothing-tops', 'girls-clothing-dresses',
    ],
    Footwear: [
      'girls-shoes',
    ],
    'School & Hobby': [
      'school', 'school-bagsandbackpacks', 'school-stationery', 'school-lunchessentials',
    ],
    Accessories: [
      'girls-accessories', 'girls-accessories-hairaccessories', 'girls-accessories-jewellery', 'girls-accessories-sunglasses',
    ],
  },
  Boys: {
    Clothing: [
      'boys-clothing', 'boys-clothing-bottoms', 'boys-clothing-tops', 'boys-clothing-shirts',
    ],
    Footwear: [
      'boys-shoes',
    ],
    'School & Hobby': [
      'school', 'school-bagsandbackpacks', 'school-stationery', 'school-lunchessentials',
    ],
    Accessories: [
      'boys-accessories', 'boys-accessories-hairaccessories', 'boys-accessories-jewellery', 'boys-accessories-sunglasses',
    ],
  },
  Home: {
    Furniture: [
      'home-furniture',
    ],
    Furnishings: [
      'home-furnishings',
    ],
    Décor: [
      'home-decor',
    ],
    'Kitchen & Dining': [
      'home-kitchenanddining',
    ],
    Appliances: [
      'home-appliances',
    ],
  },
  Beauty: {
    Makeup: [
      'beauty-makeup',
    ],
    Skincare: [
      'beauty-skincare',
    ],
    Haircare: [
      'beauty-haircare',
    ],
    Fragrance: [
      'beauty-fragrance',
    ],
    'Tools & Appliances': [
      'beauty-toolsandappliances',
    ],
  },
  Sports: {
    Sportswear: [
      'sports-sportswear',
    ],
    Footwear: [
      'sports-footwear',
    ],
    Equipment: [
      'sports-equipment',
    ],
    'Outdoor & Adventure': [
      'sports-outdoorandadventure',
    ],
  },
};

// Helper to flatten all product_type keys for quick lookup
const PRODUCT_TYPE_TO_CATEGORY = {};
for (const [cat, subcats] of Object.entries(CATEGORY_MAP)) {
  for (const [subcat, keys] of Object.entries(subcats)) {
    for (const key of keys) {
      PRODUCT_TYPE_TO_CATEGORY[key] = { category: cat, subcategory: subcat };
    }
  }
}

// Build nested output
const nested = {};
for (const [cat, subcats] of Object.entries(CATEGORY_MAP)) {
  nested[cat] = {};
  for (const subcat of Object.keys(subcats)) {
    nested[cat][subcat] = [];
  }
}

data.forEach((item) => {
  let found = false;
  // Try to match by product_type
  if (item.product_type) {
    for (const key of Object.keys(PRODUCT_TYPE_TO_CATEGORY)) {
      if (item.product_type.includes(key)) {
        const { category, subcategory } = PRODUCT_TYPE_TO_CATEGORY[key];
        if (nested[category][subcategory].length < 50) {
          nested[category][subcategory].push(item);
        }
        found = true;
        break;
      }
    }
  }
  // Fallback: try department
  if (!found && item.department) {
    for (const cat of Object.keys(CATEGORY_MAP)) {
      if (item.department.toLowerCase().includes(cat.toLowerCase())) {
        // Put in first subcategory
        const subcat = Object.keys(CATEGORY_MAP[cat])[0];
        if (nested[cat][subcat].length < 50) {
          nested[cat][subcat].push(item);
        }
        found = true;
        break;
      }
    }
  }
  // If still not found, ignore
});

// Remove empty subcategories
for (const cat of Object.keys(nested)) {
  for (const subcat of Object.keys(nested[cat])) {
    if (!nested[cat][subcat] || nested[cat][subcat].length === 0) {
      delete nested[cat][subcat];
    }
  }
}

fs.writeFileSync(output, JSON.stringify(nested, null, 2));
console.log(`Converted ${input} to ${output} in nested category format (max 50 per subcategory, no empty subcategories).`);

// Write first 100 records to test_data.json
const testData = data.slice(0, 100);
fs.writeFileSync(testOutput, JSON.stringify(testData, null, 2));
console.log(`Wrote first 100 records to ${testOutput}.`);

// === CAP SUBCATEGORIES TO 40 PRODUCTS EACH ===
if (require.main === module) {
  const inputFile = 'minor_cp_kw.json';
  const outputFile = 'minor_cp_kw_capped.json';
  const structure = {
    Women: ['Clothing', 'Footwear', 'Accessories'],
    Men: ['Clothing', 'Footwear', 'Accessories'],
    Kids: ['Clothing', 'Footwear', 'Toys & Games'],
    Girls: ['Clothing', 'Footwear', 'Accessories'],
    Boys: ['Clothing', 'Footwear', 'Accessories'],
    Home: ['Furniture', 'Furnishings', 'Décor', 'Kitchen & Dining'],
    Beauty: ['Makeup', 'Skincare', 'Haircare', 'Fragrance'],
    Sports: ['Sportswear', 'Footwear', 'Equipment'],
  };
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const capped = {};
  for (const cat in structure) {
    capped[cat] = {};
    for (const sub of structure[cat]) {
      if (data[cat] && Array.isArray(data[cat][sub])) {
        capped[cat][sub] = data[cat][sub].slice(0, 40);
      } else {
        capped[cat][sub] = [];
      }
    }
  }
  fs.writeFileSync(outputFile, JSON.stringify(capped, null, 2));
  console.log('Capped JSON written to', outputFile);
} 