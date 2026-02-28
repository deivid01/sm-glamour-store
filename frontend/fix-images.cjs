const fs = require('fs');
const path = require('path');

// HomeView
const homePath = path.join(__dirname, 'src/views/HomeView.vue');
let home = fs.readFileSync(homePath, 'utf8');

home = home.replace(
    "image: p.imagem_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'",
    "image: p.imagem_url || '/images/product_fallback.png'"
);
home = home.replace(
    "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=500",
    "/images/skincare.png"
);
home = home.replace(
    "https://images.unsplash.com/photo-1571781564263-ce3b2e5668e2?auto=format&fit=crop&q=80&w=500",
    "/images/makeup.png"
);
home = home.replace(
    "https://images.unsplash.com/photo-1512496015851-a1c8da91d86c?auto=format&fit=crop&q=80&w=1200",
    "/images/editorial.png"
);
fs.writeFileSync(homePath, home);

// CatalogoView
const catPath = path.join(__dirname, 'src/views/CatalogoView.vue');
let cat = fs.readFileSync(catPath, 'utf8');
cat = cat.replace(
    "image: p.imagem_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'",
    "image: p.imagem_url || '/images/product_fallback.png'"
);
// Also for new products if any
cat = cat.replace(
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    "/images/product_fallback.png"
);
fs.writeFileSync(catPath, cat);

console.log('Fixed Image Paths in HomeView and CatalogoView');
