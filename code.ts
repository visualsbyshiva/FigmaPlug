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
figma.ui.onmessage = async (msg: { type: string; products?: any[] }) => {
  if (msg.type === 'import') {
    const products = msg.products || [];
    if (products.length === 0) {
      figma.notify('No products selected.');
      return;
    }
    // Find selected frame
    const selection = figma.currentPage.selection;
    if (selection.length !== 1 || selection[0].type !== 'FRAME') {
      figma.notify('Please select a single frame to import into.');
      return;
    }
    const frame = selection[0] as FrameNode;
    // Find image containers (rectangles or shapes with image fills)
    const imageNodes: SceneNode[] = [];
    const textNodes: TextNode[] = [];
    function traverse(node: BaseNode) {
      if ('children' in node) {
        for (const child of node.children) traverse(child);
      }
      if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'VECTOR') {
        imageNodes.push(node as SceneNode);
      }
      if (node.type === 'TEXT') {
        textNodes.push(node as TextNode);
      }
    }
    traverse(frame);
    if (imageNodes.length === 0 || textNodes.length === 0) {
      figma.notify('Frame must contain both image containers and text layers.');
      return;
    }
    // Fill in order: match product to image node and text node by index
    const count = Math.min(products.length, imageNodes.length, textNodes.length);
    for (let i = 0; i < count; i++) {
      const product = products[i];
      const imageNode = imageNodes[i];
      const textNode = textNodes[i];
      // Set image fill
      try {
        const imageBytes = await fetch(product.image_link).then(r => r.arrayBuffer());
        const imageHash = figma.createImage(new Uint8Array(imageBytes)).hash;
        if ('fills' in imageNode) {
          const newFills: ImagePaint[] = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash }];
          imageNode.fills = newFills;
        }
      } catch (e) {
        // Ignore image errors, continue
      }
      // Set text
      try {
        await figma.loadFontAsync(textNode.fontName as FontName);
        textNode.characters = product.title;
      } catch (e) {
        // Ignore font errors, continue
      }
    }
    figma.notify(`Imported ${count} products to frame.`);
  }
};
