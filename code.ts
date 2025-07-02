import productData from './minor_cp_kw.json';
figma.showUI(__html__, { width: 400, height: 700 });

// Node name constants - easily configurable
const NODE_NAMES = {
  PRODUCT_CARD: 'Product Card',
  PRODUCT_IMAGE: 'Product Image', 
  PRODUCT_NAME: 'Product Name'
};

// Columns to search (in order of relevance)
const SEARCH_COLUMNS = [
  { key: 'title', weight: 3 },
  { key: 'brand', weight: 2 },
  { key: 'typeEn', weight: 1.5 },
  { key: 'department', weight: 1 },
  { key: 'material', weight: 1 },
  { key: 'product_type', weight: 1 }
];

type Product = typeof productData[number];

interface ProductCardNodes {
  productCard: SceneNode;
  productImage: SceneNode | null;
  productName: SceneNode | null;
}

// Weighted search function
function searchProducts(query: string): Product[] {
  if (!query.trim()) return [];
  const terms = query.toLowerCase().split(/\s+/);
  return productData
    .map((row: Product) => {
      let score = 0;
      for (const { key, weight } of SEARCH_COLUMNS) {
        const value = (row[key] || '').toString().toLowerCase();
        for (const term of terms) {
          if (value.includes(term)) {
            score += weight;
            // Extra boost for full word match in title
            if (key === 'title' && value.split(/\s+/).includes(term)) {
              score += 2;
            }
          }
        }
      }
      return { ...row, _score: score };
    })
    .filter((row: Product & { _score: number }) => row._score > 0)
    .sort((a: Product & { _score: number }, b: Product & { _score: number }) => b._score - a._score);
}

// Find all Product Cards and their associated Product Image and Product Name nodes
function findProductCards(node: BaseNode): ProductCardNodes[] {
  let productCards: ProductCardNodes[] = [];
  
  // Check if current node is a Product Card (case insensitive)
  if (node.name.toLowerCase() === NODE_NAMES.PRODUCT_CARD.toLowerCase()) {
    const productImage = findNodeByName(node, NODE_NAMES.PRODUCT_IMAGE);
    const productName = findNodeByName(node, NODE_NAMES.PRODUCT_NAME);
    
    productCards.push({
      productCard: node as SceneNode,
      productImage: productImage,
      productName: productName
    });
  }
  
  // Recursively search children
  if ('children' in node) {
    for (const child of node.children) {
      productCards = productCards.concat(findProductCards(child));
    }
  }
  
  return productCards;
}

// Find a node by name within a parent node (deep search, case insensitive)
function findNodeByName(parent: BaseNode, targetName: string): SceneNode | null {
  if (parent.name.toLowerCase() === targetName.toLowerCase()) {
    return parent as SceneNode;
  }
  
  if ('children' in parent) {
    for (const child of parent.children) {
      const found = findNodeByName(child, targetName);
      if (found) return found;
    }
  }
  
  return null;
}

// Check if a node can have image fills
function canHaveImageFills(node: SceneNode): boolean {
  const fillTypes = ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'VECTOR', 'FRAME', 'COMPONENT', 'INSTANCE'];
  return fillTypes.indexOf(node.type) !== -1 && 'fills' in node;
}

// Check if a node can have text content
function canHaveTextContent(node: SceneNode): boolean {
  return node.type === 'TEXT' && 'characters' in node;
}

// Handle messages from UI
figma.ui.onmessage = async (msg: { type: string; products?: any[]; allProducts?: any[] }) => {
  if (msg.type === 'import') {
    const selectedProducts = msg.products || [];
    if (selectedProducts.length === 0) {
      figma.notify('No products selected.');
      return;
    }

    // Get all selected frames/components/instances
    const selection = figma.currentPage.selection.filter(node => 
      node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE'
    );
    
    if (selection.length === 0) {
      figma.notify('Please select at least one frame.');
      return;
    }

    // Find all Product Cards and their associated nodes
    let allProductCards: ProductCardNodes[] = [];
    for (const frame of selection) {
      allProductCards = allProductCards.concat(findProductCards(frame));
    }

    console.log(`Found ${allProductCards.length} Product Cards`);
    
         if (allProductCards.length === 0) {
       figma.notify(`No "${NODE_NAMES.PRODUCT_CARD}" nodes found in the selected frames.`);
       return;
     }

    // Filter out Product Cards that don't have the required child nodes
    const validProductCards = allProductCards.filter(pc => {
      const hasValidImage = pc.productImage && canHaveImageFills(pc.productImage);
      const hasValidText = pc.productName && canHaveTextContent(pc.productName);
      
      if (!hasValidImage) {
        console.log(`Product Card "${pc.productCard.name}" missing valid Product Image`);
      }
      if (!hasValidText) {
        console.log(`Product Card "${pc.productCard.name}" missing valid Product Name`);
      }
      
      return hasValidImage || hasValidText; // At least one should be valid
    });

    console.log(`Found ${validProductCards.length} valid Product Cards`);

    if (validProductCards.length === 0) {
      figma.notify(`No valid Product Cards found. Make sure they contain "${NODE_NAMES.PRODUCT_IMAGE}" and/or "${NODE_NAMES.PRODUCT_NAME}" nodes.`);
      return;
    }

    // If there are fewer selected products than Product Cards, loop the products
    let productsToUse = [...selectedProducts];
    while (productsToUse.length < validProductCards.length) {
      productsToUse = productsToUse.concat(selectedProducts);
    }
    productsToUse = productsToUse.slice(0, validProductCards.length);

    // Update each Product Card
    let updatedCards = 0;
    for (let i = 0; i < validProductCards.length; i++) {
      const productCard = validProductCards[i];
      const product = productsToUse[i];
      
      if (!product) break;

      let cardUpdated = false;

      // Update Product Image
      if (productCard.productImage && canHaveImageFills(productCard.productImage)) {
        try {
          const imageBytes = await fetch(product.image_link).then(r => r.arrayBuffer());
          const imageHash = figma.createImage(new Uint8Array(imageBytes)).hash;
          const newFills: ImagePaint[] = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash }];
          (productCard.productImage as GeometryMixin).fills = newFills;
          console.log(`Updated image for Product Card: ${productCard.productCard.name}`);
          cardUpdated = true;
        } catch (e) {
          console.log(`Failed to update image for Product Card: ${productCard.productCard.name}`, e);
        }
      }

      // Update Product Name
      if (productCard.productName && canHaveTextContent(productCard.productName)) {
        try {
          const textNode = productCard.productName as TextNode;
          await figma.loadFontAsync(textNode.fontName as FontName);
          textNode.characters = product.title || 'Product Name';
          console.log(`Updated text for Product Card: ${productCard.productCard.name}`);
          cardUpdated = true;
        } catch (e) {
          console.log(`Failed to update text for Product Card: ${productCard.productCard.name}`, e);
        }
      }

      if (cardUpdated) {
        updatedCards++;
      }
    }

    if (updatedCards === 0) {
      figma.notify('No Product Cards were updated.');
    } else {
      figma.notify(`Updated ${updatedCards} Product Cards.`);
    }
  }

  if (msg.type === 'selectRandom') {
    const allProducts = msg.allProducts || [];
    
    // Get all selected items (frames/components/instances)
    const selection = figma.currentPage.selection.filter(node => 
      node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE'
    );
    
    if (selection.length === 0) {
      figma.notify('Please select at least one frame/component/instance.');
      return;
    }

    // Find all Product Cards and their associated nodes
    let allProductCards: ProductCardNodes[] = [];
    for (const item of selection) {
      allProductCards = allProductCards.concat(findProductCards(item));
    }

    console.log(`Found ${allProductCards.length} Product Cards`);
    
    if (allProductCards.length === 0) {
      figma.notify(`No "${NODE_NAMES.PRODUCT_CARD}" nodes found in the selected items.`);
      return;
    }

    // Filter out Product Cards that don't have the required child nodes
    const validProductCards = allProductCards.filter(pc => {
      const hasValidImage = pc.productImage && canHaveImageFills(pc.productImage);
      const hasValidText = pc.productName && canHaveTextContent(pc.productName);
      return hasValidImage || hasValidText;
    });

    if (validProductCards.length === 0) {
      figma.notify(`No valid Product Cards found. Make sure they contain "${NODE_NAMES.PRODUCT_IMAGE}" and/or "${NODE_NAMES.PRODUCT_NAME}" nodes.`);
      return;
    }

    // Pick random products
    function shuffle<T>(array: T[]): T[] {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // If there are fewer products than Product Cards, loop the products
    let randomizedProducts = shuffle(allProducts);
    if (randomizedProducts.length === 0) {
      figma.notify('No products available to fill.');
      return;
    }
    
    while (randomizedProducts.length < validProductCards.length) {
      randomizedProducts = randomizedProducts.concat(shuffle(allProducts));
    }
    randomizedProducts = randomizedProducts.slice(0, validProductCards.length);

    // Update each Product Card
    let updatedCards = 0;
    for (let i = 0; i < validProductCards.length; i++) {
      const productCard = validProductCards[i];
      const product = randomizedProducts[i];
      
      if (!product) break;

      let cardUpdated = false;

      // Update Product Image
      if (productCard.productImage && canHaveImageFills(productCard.productImage)) {
        try {
          const imageBytes = await fetch(product.image_link).then(r => r.arrayBuffer());
          const imageHash = figma.createImage(new Uint8Array(imageBytes)).hash;
          const newFills: ImagePaint[] = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash }];
          (productCard.productImage as GeometryMixin).fills = newFills;
          cardUpdated = true;
        } catch (e) {
          console.log(`Failed to update image for Product Card: ${productCard.productCard.name}`, e);
        }
      }

             // Update Product Name
       if (productCard.productName && canHaveTextContent(productCard.productName)) {
         try {
           const textNode = productCard.productName as TextNode;
           await figma.loadFontAsync(textNode.fontName as FontName);
           textNode.characters = product.title || 'Product Name';
           cardUpdated = true;
         } catch (e) {
           console.log(`Failed to update text for Product Card: ${productCard.productCard.name}`, e);
         }
       }

      if (cardUpdated) {
        updatedCards++;
      }
    }

    if (updatedCards === 0) {
      figma.notify('No Product Cards were updated.');
    } else {
      figma.notify(`Updated ${updatedCards} Product Cards with random products.`);
    }
  }

  if (msg.type === 'countProductImages') {
    // Get all selected frames
    const selection = figma.currentPage.selection.filter(node => 
      node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE'
    );
    
    let allProductCards: ProductCardNodes[] = [];
    for (const frame of selection) {
      allProductCards = allProductCards.concat(findProductCards(frame));
    }
    
    const validProductCards = allProductCards.filter(pc => {
      const hasValidImage = pc.productImage && canHaveImageFills(pc.productImage);
      const hasValidText = pc.productName && canHaveTextContent(pc.productName);
      return hasValidImage || hasValidText;
    });
    
    figma.ui.postMessage({ type: 'productImageCount', count: validProductCards.length });
  }
};


