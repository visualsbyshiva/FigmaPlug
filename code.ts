import productData from './minor_cp_kw.json';
figma.showUI(__html__, { width: 400, height: 800 });

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

// Handle messages from UI
figma.ui.onmessage = async (msg: { type: string; products?: any[]; allProducts?: any[] }) => {
  if (msg.type === 'import') {
    const selectedProducts = msg.products || [];
    const allProducts = msg.allProducts || [];
    if (selectedProducts.length === 0 && allProducts.length === 0) {
      figma.notify('No products available.');
      return;
    }
    // Find selected frame
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
      figma.notify('Please select a single frame to import into.');
      return;
    }
    const frame = selection[0] as FrameNode;
    // Find all 'Product Card' frames (Frame or Auto Layout)
    function findProductCards(node: BaseNode): FrameNode[] {
      let cards: FrameNode[] = [];
      if ((node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') && node.name === 'Product Card') {
        cards.push(node as FrameNode);
      }
      if ('children' in node) {
        for (const child of node.children) {
          cards = cards.concat(findProductCards(child));
        }
      }
      return cards;
    }
    const productCards = findProductCards(frame);
    if (productCards.length === 0) {
      figma.notify('No Product Card frames found in the selected frame.');
      return;
    }
    // Prepare product list to match number of cards
    let productsToUse = [...selectedProducts];
    let allFlat = allProducts.length ? allProducts : selectedProducts;
    let idx = 0;
    while (productsToUse.length < productCards.length) {
      productsToUse.push(allFlat[idx % allFlat.length]);
      idx++;
      if (allFlat.length === 0) break;
    }
    // For each Product Card, find and replace image/text
    let replacedCount = 0;
    for (let i = 0; i < productCards.length; i++) {
      const card = productCards[i];
      const product = productsToUse[i];
      // Find Image node named 'Product Image' and Text node named 'Product name'
      let imageNode: SceneNode | null = null;
      let textNode: TextNode | null = null;
      function findNodes(node: BaseNode) {
        if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'VECTOR') {
          if (node.name === 'Product Image') imageNode = node as SceneNode;
        }
        if (node.type === 'TEXT' && node.name === 'Product name') {
          textNode = node as TextNode;
        }
        if ('children' in node) {
          for (const child of node.children) findNodes(child);
        }
      }
      findNodes(card);
      if (imageNode && textNode && product) {
        // Set image fill
        try {
          const imageBytes = await fetch(product.image_link).then(r => r.arrayBuffer());
          const imageHash = figma.createImage(new Uint8Array(imageBytes)).hash;
          if (imageNode && 'fills' in imageNode) {
            const newFills: ImagePaint[] = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash }];
            (imageNode as GeometryMixin).fills = newFills;
          }
        } catch (e) {
          // Ignore image errors, continue
        }
        // Set text
        try {
          if (textNode && 'fontName' in textNode && 'characters' in textNode) {
            await figma.loadFontAsync((textNode as TextNode).fontName as FontName);
            (textNode as TextNode).characters = product.title;
          }
        } catch (e) {
          // Ignore font errors, continue
        }
        replacedCount++;
      }
    }
    if (replacedCount === 0) {
      figma.notify('No Product Cards with both Product Image and Product name found.');
    } else {
      figma.notify(`Imported ${replacedCount} products to Product Cards.`);
    }
  }
};
