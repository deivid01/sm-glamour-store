const fs = require('fs');
const path = require('path');

// Execute from frontend directory
const homePath = path.join(__dirname, 'src/views/HomeView.vue');
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace(/<RouterLink\s+to="([^"]+)"/g, '<a href="$1"');
home = home.replace(/<\/RouterLink>/g, '</a>');
const oldMap = "featuredProducts.value = response.data.slice(0, 4)";
const newMap = `featuredProducts.value = response.data.slice(0, 4).map(p => ({\n      id: p.id,\n      name: p.nome,\n      slug: p.slug,\n      category: p.categoria_nome,\n      price: parseFloat(p.preco),\n      image: p.imagem_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',\n      isNew: false\n    }))`;
home = home.replace(oldMap, newMap);
fs.writeFileSync(homePath, home);

const navPath = path.join(__dirname, 'src/components/Navbar.vue');
let nav = fs.readFileSync(navPath, 'utf8');
nav = nav.replace(/<RouterLink\s+to="([^"]+)"/g, '<a href="$1"');
nav = nav.replace(/<\/RouterLink>/g, '</a>');
nav = nav.replace(/href="#"([\s\S]*?)Sobre Nós/g, 'href="/sobre"$1Sobre Nós');
nav = nav.replace(/href="#"([\s\S]*?)Sobre Nós/g, 'href="/sobre"$1Sobre Nós');
fs.writeFileSync(navPath, nav);

const pcPath = path.join(__dirname, 'src/components/ProductCard.vue');
let pc = fs.readFileSync(pcPath, 'utf8');
pc = pc.replace(/<RouterLink\s+:to="\{\s*name:\s*'produto_detalhe',\s*params:\s*\{\s*slug:\s*product\.slug\s*\}\s*\}"/g, '<a :href="\'/produto/\' + product.slug"');
pc = pc.replace(/<\/RouterLink>/g, '</a>');
fs.writeFileSync(pcPath, pc);

console.log('Fixed missing mappings and RouterLinks');
