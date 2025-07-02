# Bulk Image Importer - Product Requirements Document

## Plugin Overview

**Name:** Bulk Image Importer  
**Purpose:** A Figma plugin that allows designers to select a frame and automatically populate it with relevant images and product titles from a searchable dataset, significantly reducing the time spent manually changing multiple images and corresponding text.

**One-line Description:** Select a frame in Figma, open the plugin, search for relevant images, and automatically populate your design with matching products and titles.

---

## Target User Scenarios

### Scenario 1: E-commerce Product Catalog Design
**Context:** A designer is creating a product listing page for an online fashion store.

**Pain Point:** Manually dragging 20+ product images and updating each product title takes 30+ minutes.

**Solution:** Designer selects the product grid frame, searches "women dresses," and the plugin automatically fills each product slot with relevant images and titles.

**Time Saved:** 25+ minutes per catalog page.

### Scenario 2: Marketing Campaign Mockups
**Context:** Creating promotional banners for a seasonal sale featuring specific product categories.

**Pain Point:** Finding and placing relevant product images that match the campaign theme while ensuring titles are accurate.

**Solution:** Designer searches "summer collection" or "sale items" and gets matching products with proper titles instantly populated in their banner template.

### Scenario 3: A/B Testing Variations
**Context:** Creating multiple versions of the same design with different product sets.

**Pain Point:** Manually swapping out products and titles for each test variation is repetitive and error-prone.

**Solution:** Designer can quickly search different categories ("trending," "bestsellers," "new arrivals") to create variations in seconds.

### Scenario 4: Client Presentation Mockups
**Context:** Designer needs to show how a website layout looks with real product data.

**Pain Point:** Using placeholder images doesn't give clients a realistic preview of their actual products.

**Solution:** Search for client's actual product categories and populate realistic mockups instantly.

### Scenario 5: Prototype Testing with Real Data
**Context:** UX designer needs to test user flows with realistic product information.

**Pain Point:** Lorem ipsum and placeholder images don't provide realistic testing scenarios.

**Solution:** Populate prototypes with searchable, realistic product data for better user testing results.

---

## Detailed User Flows

### Primary Flow: Basic Image Import

1. **Setup**
   - Designer opens Figma file
   - Selects a frame containing image placeholders and text elements

2. **Plugin Activation**
   - Right-click on selected frame → Plugins → Bulk Image Importer
   - Plugin panel opens on the right side

3. **Search & Filter**
   - Designer enters search term (e.g., "women," "shoes," "electronics")
   - Plugin displays grid of matching results with thumbnails and titles
   - Each result shows: product image, title, and category tag

4. **Preview & Selection**
   - Designer can preview how images will fit in their frame
   - Option to select specific items or use "Auto-fill" for random selection from results

5. **Import & Apply**
   - Click "Import Selected" or "Auto-fill Frame"
   - Plugin automatically places images in image containers
   - Plugin automatically updates corresponding text layers with product titles
   - Confirmation message shows number of items imported

### Secondary Flow: Refined Search

1. **Advanced Search Options**
   - Filter by category (clothing, electronics, home, etc.)
   - Filter by tags (new, sale, trending, bestseller)
   - Filter by color dominant in image

2. **Batch Operations**
   - Select multiple frames at once
   - Apply different search terms to different sections
   - Bulk update all selected frames with one action

### Error Handling Flow

1. **No Frame Selected**
   - Plugin shows message: "Please select a frame first"
   - Highlight button to close plugin and select frame

2. **No Search Results**
   - Plugin shows: "No products found for '[search term]'"
   - Suggest alternative search terms
   - Show popular categories as quick options

3. **Insufficient Results**
   - If frame needs 12 images but only 8 found
   - Plugin asks: "Only 8 results found. Fill available slots or search again?"

---

## Plugin Interface Design

### Main Panel Layout (List Format)
```
┌─────────────────────────────────────┐
│ 🔍 Search: [nike women shoes      ]│
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [img] Nike Air Max Women's      │ │
│ │       Running Shoes - Black    │ │
│ │       Brand: Nike | Shoes       │ │
│ │       ☐                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [img] Adidas UltraBoost 22      │ │
│ │       Women's Running Shoes     │ │
│ │       Brand: Adidas | Shoes     │ │
│ │       ☐                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [img] Nike React Infinity Run   │ │
│ │       Flyknit Women's Road...   │ │
│ │       Brand: Nike | Shoes       │ │
│ │       ☐                         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Select All] [Clear Selection]      │
│ [Import Selected (3)]              │
└─────────────────────────────────────┘
```

### Key Interface Elements
- **Search Bar:** Prominent at top with search icon and placeholder text
- **List Results:** Single column, card-style layout for easy title reading
- **Product Cards:** Each showing:
  - Small thumbnail image (left side, 60x60px)
  - Full product title (main text, bold, 2 lines max)
  - Brand and primary category (smaller text below title)
  - Selection checkbox (bottom right)
- **Selection Controls:** Select all/none options and import counter
- **Action Button:** "Import Selected (X)" showing count of selected items
- **Status Info:** Shows "X results found" and "Frame needs Y images"

---

## Technical Requirements

### Programming Language & Framework
**Base Technology: Open to AI Implementation**
- Cursor AI will determine the optimal technology stack
- Could be JavaScript, TypeScript, or any other suitable language
- Must integrate with Figma Plugin API
- Should prioritize simplicity and performance

### Data Source & Structure
**Backend Data: Excel Sheet (.xlsx format)**

The Excel file serves as the complete product database. Every search operation reads from this Excel file.

Required Excel columns (exact format):
- **id** (unique identifier - not searchable)
- **image_link** (direct URL to product image - not searchable, used for display)
- **title** (product title - primary search field)
- **typeEn** (product type in English - searchable)
- **brand** (brand name - searchable)
- **department** (department/category - searchable)
- **material** (product material - searchable)
- **product_type** (specific product type - searchable)

**Data Flow:**
1. User enters search term in plugin
2. Plugin reads Excel sheet and searches through all searchable columns
3. Plugin fetches product images from `image_link` URLs
4. Plugin displays matching products with images in list format
5. User selects products and imports them to Figma frames

### Frame Detection Logic
- Plugin should detect frames containing:
  - Image containers (rectangles, shapes with image fills)
  - Text layers (for product titles)
- Smart matching of images to containers based on position/hierarchy

### Search Functionality & Image Display
**Excel-Based Search Process:**
1. **Real-time Excel Reading:** Every search query reads through the Excel sheet
2. **Multi-column Search:** Search across title, typeEn, brand, department, material, product_type (excludes id and image_link)
3. **Weighted Relevance:** Title matches should have highest priority, followed by brand, then other fields
4. **Image Fetching:** For each matching product, fetch and display the image from the `image_link` URL
5. **Dynamic Results:** As user types, continuously search Excel and update results with product images

**Search & Display Flow:**
- User types "nike shoes" → Plugin searches Excel columns → Finds matching products → Fetches images from image_link URLs → Displays products with images in list format
- Each search result shows: Product image (from image_link) + Full product title + Brand and category info
- User can select multiple products and import them to selected Figma frame

**Image Handling:**
- All product images come from the `image_link` column in Excel
- Plugin must handle image loading states (loading, error, success)
- Images should be optimized/resized for plugin display
- Selected images get imported into Figma frames at full resolution

---

## Figma Plugin Setup Guide (For Non-Coders)

### Option 1: No-Code Plugin Builder Tools

**Recommended: Use Figma Plugin Boilerplate Templates**

1. **Get Started with Figma Plugin Template**
   - Visit GitHub and search "figma plugin boilerplate"
   - Download a basic template (like "figma-plugin-react-template")
   - This gives you the basic structure without coding

2. **Use Visual Plugin Builders**
   - **Figma Community:** Look for plugin templates you can duplicate
   - **No-code tools:** Some services offer visual plugin builders (though limited for Figma)

### Option 2: AI-Driven Development Approach (Cursor)

**What You'll Need:**
- Figma account
- Cursor AI IDE (free download)
- Excel file with your product data (with the specified columns)
- No coding knowledge required - Cursor handles implementation

**Step-by-Step Setup:**

1. **Enable Figma Plugin Development**
   - In Figma: Menu → Plugins → Development → New Plugin
   - Choose "With UI & browser APIs"
   - Name it "Bulk Image Importer"
   - Save the folder somewhere you can find it

2. **Let Cursor Design the Architecture**
   - Open Cursor AI and create new project in your plugin folder
   - Provide Cursor with this PRD document
   - Let Cursor determine optimal file structure, technology stack, and implementation approach
   - Cursor will handle: Excel reading, search algorithms, UI design, image fetching, Figma API integration

3. **Cursor Will Create Project Structure**
   - Cursor determines the best folder structure and files needed
   - May include: manifest.json, main plugin files, UI components, Excel processing modules
   - Cursor selects appropriate libraries and dependencies

4. **Excel Integration (Cursor Implementation)**
   - Cursor implements Excel file reading functionality
   - Handles search across all specified columns (title, typeEn, brand, department, material, product_type)
   - Implements image fetching from image_link URLs
   - Creates efficient search algorithms with weighted relevance

5. **UI Implementation (Cursor Design)**
   - Cursor creates the list-based interface for search results
   - Implements real-time search as user types
   - Designs product cards showing: image thumbnail, full title, brand/category
   - Creates selection and import functionality

6. **Testing and Iteration**
   - Test plugin with your Excel file
   - Provide feedback to Cursor for improvements
   - Cursor handles debugging and optimization
   - Iterate until plugin works perfectly with your data

### Getting Help Without Coding

1. **Hire a Developer:** Platforms like Upwork, Fiverr for small plugin projects
2. **Figma Community:** Post your PRD and see if someone wants to collaborate
3. **Plugin Templates:** Use existing templates and modify the data/images
4. **YouTube Tutorials:** Search "Figma plugin development for beginners"

### Data Setup (Excel-Based Backend)

**Excel File as Backend Database:**
Your Excel file serves as the complete product database. Every search operation reads from this file.

**Excel File Structure:**
Create your products.xlsx file with these exact column headers:

| id | image_link | title | typeEn | brand | department | material | product_type |
|----|------------|-------|--------|-------|------------|----------|--------------|
| 1 | https://example.com/img1.jpg | Nike Air Max 90 Women's Shoes - White/Black | Footwear | Nike | Women | Synthetic | Athletic Shoes |
| 2 | https://example.com/img2.jpg | Adidas Ultraboost 22 Running Shoes for Women | Footwear | Adidas | Women | Textile | Running Shoes |
| 3 | https://example.com/img3.jpg | Levi's 501 Original Fit Men's Jeans - Dark Blue | Clothing | Levi's | Men | Denim | Jeans |

**How Search & Image Display Works:**
1. **User Search Input:** User types "nike women" in search box
2. **Excel Processing:** Plugin reads through Excel sheet row by row
3. **Column Matching:** Searches across title, typeEn, brand, department, material, product_type columns
4. **Result Compilation:** Collects all matching products with their data
5. **Image Fetching:** For each match, fetches the actual product image from the `image_link` URL
6. **Display Results:** Shows list of products with real product images and full titles
7. **User Selection:** User selects desired products from search results
8. **Import to Figma:** Selected product images and titles get imported into the selected Figma frame

**Excel File Requirements:**
- **All columns must be present** (can have empty values)
- **image_link URLs must be publicly accessible** (direct links to images)
- **Title field should be descriptive** and contain key product information
- **Consistent naming** in brand, department, typeEn fields for better search
- **File can contain unlimited products** - AI will optimize performance
- **Image URLs should be high-resolution** for quality imports to Figma

**Search Examples with Image Display:**
- Search "nike women" → Plugin finds Nike products in Women department → Fetches images from image_link → Displays Nike women's products with actual product photos
- Search "running shoes" → Matches title and product_type → Shows running shoe products with their real images
- Search "denim jeans" → Matches material and product_type → Displays denim jeans with product photos
- Search "adidas footwear" → High relevance for Adidas brand + footwear type → Shows Adidas shoes with images

**AI Implementation Notes for Cursor:**
- Cursor should determine the most efficient way to read and search Excel files
- Handle image loading states (loading spinners, error handling, caching)
- Optimize search performance for large Excel files
- Implement smart caching to avoid re-reading Excel on every search
- Design responsive image loading for plugin UI constraints

---

## Success Metrics

**Time Savings:**
- Reduce image placement time from 30+ minutes to under 2 minutes
- Eliminate manual title typing errors

**User Satisfaction:**
- Plugin saves at least 20 minutes per design session
- 90% of searches return relevant results
- Users can complete image import in under 1 minute

**Usage Patterns:**
- Average 10+ searches per session
- Most common search terms: product categories and descriptive keywords
- Peak usage during campaign and catalog creation periods