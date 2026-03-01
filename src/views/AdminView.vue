<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="admin-header-content">
        <h1>⚙️ Painel Admin — SM Glamour</h1>
        <p>Gerencie os produtos e sincronize com a Olist.</p>
      </div>
    </div>

    <!-- OLIST SYNC CARD -->
    <div class="admin-section">
      <h2>🔄 Sincronização Olist</h2>
      <p>O sistema sincroniza automaticamente todo dia às <strong>03:00 AM</strong>. Para rodar agora mesmo:</p>
      <div class="sync-controls">
        <input v-model="syncPages" type="number" min="1" max="50" placeholder="Páginas (padrão: 10)" class="admin-input" />
        <button @click="syncOlist" :disabled="syncing" class="btn-primary">
          {{ syncing ? '⏳ Sincronizando...' : '▶ Sincronizar Produtos Agora' }}
        </button>
      </div>
      <div v-if="syncResult" class="sync-result" :class="{ success: !syncResult.error, error: syncResult.error }">
        <div v-if="syncResult.error">❌ Erro: {{ syncResult.error }}</div>
        <div v-else>
          ✅ Sincronização concluída!<br />
          Produtos importados: <strong>{{ syncResult.summary?.upserted }}</strong> |
          Pulados: {{ syncResult.summary?.skipped }} |
          Páginas processadas: {{ syncResult.summary?.pagesProcessed }}
        </div>
      </div>
    </div>

    <!-- PRODUCTS TABLE -->
    <div class="admin-section">
      <h2>📦 Produtos ({{ produtos.length }})</h2>
      <input v-model="search" type="text" placeholder="🔍 Filtrar por nome..." class="admin-input full-width" />

      <div class="products-grid">
        <div v-for="produto in filteredProdutos" :key="produto.id" class="product-card">
          <div class="product-img-wrapper">
            <img
              :src="produto.imagem_url || '/images/product_fallback.png'"
              :alt="produto.nome"
              class="product-thumb"
            />
          </div>
          <div class="product-info">
            <p class="product-name">{{ produto.nome }}</p>
            <p class="product-price">R$ {{ parseFloat(produto.preco).toFixed(2) }}</p>
            <p class="product-cat">{{ produto.categoria?.nome }}</p>
          </div>
          <div class="upload-area">
            <input
              type="file"
              accept="image/*"
              :id="`file-${produto.id}`"
              @change="(e) => uploadImage(e, produto.id)"
              class="hidden-input"
            />
            <label :for="`file-${produto.id}`" class="btn-upload">
              {{ uploading === produto.id ? '⏳ Enviando...' : '📷 Trocar Foto' }}
            </label>
            <div v-if="uploadStatus[produto.id]" class="upload-status" :class="{ ok: uploadStatus[produto.id]?.ok }">
              {{ uploadStatus[produto.id]?.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

const produtos = ref([])
const search = ref('')
const syncing = ref(false)
const syncResult = ref(null)
const syncPages = ref(10)
const uploading = ref(null)
const uploadStatus = ref({})

const filteredProdutos = computed(() => {
  if (!search.value) return produtos.value
  const q = search.value.toLowerCase()
  return produtos.value.filter(p => p.nome.toLowerCase().includes(q))
})

const loadProdutos = async () => {
  try {
    const { data } = await axios.get(`${API}/admin/produtos`)
    produtos.value = data
  } catch (err) {
    console.error('Erro ao carregar produtos admin:', err)
  }
}

const syncOlist = async () => {
  syncing.value = true
  syncResult.value = null
  try {
    const { data } = await axios.post(`${API}/integrations/olist/sync`, { max_pages: syncPages.value })
    syncResult.value = data
    await loadProdutos()
  } catch (err) {
    syncResult.value = { error: err?.response?.data?.detail || err.message }
  } finally {
    syncing.value = false
  }
}

const uploadImage = async (event, produtoId) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = produtoId
  uploadStatus.value[produtoId] = null

  const formData = new FormData()
  formData.append('imagem', file)

  try {
    const { data } = await axios.post(`${API}/admin/produtos/${produtoId}/imagem`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    uploadStatus.value[produtoId] = { ok: true, message: '✅ Imagem atualizada!' }
    const idx = produtos.value.findIndex(p => p.id === produtoId)
    if (idx !== -1) produtos.value[idx].imagem_url = data.imagem_url
  } catch (err) {
    uploadStatus.value[produtoId] = { ok: false, message: '❌ ' + (err?.response?.data?.detail || 'Erro no upload') }
  } finally {
    uploading.value = null
  }
}

onMounted(loadProdutos)
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #0d0d0d; color: #eee; padding-bottom: 4rem; }
.admin-header { background: linear-gradient(135deg, #1a003a 0%, #2d0057 100%); padding: 2.5rem 2rem; border-bottom: 2px solid #7c3aed; }
.admin-header-content { max-width: 1200px; margin: 0 auto; }
.admin-header h1 { font-size: 1.8rem; margin: 0 0 .5rem; color: #e9d5ff; }
.admin-header p { color: #a78bfa; margin: 0; }
.admin-section { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; }
.admin-section h2 { font-size: 1.3rem; color: #c4b5fd; margin-bottom: 1rem; border-bottom: 1px solid #2d2d3d; padding-bottom: .5rem; }
.sync-controls { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem; }
.admin-input { background: #1a1a2e; border: 1px solid #3d3d5c; color: #eee; padding: .6rem 1rem; border-radius: 8px; font-size: .95rem; outline: none; }
.admin-input:focus { border-color: #7c3aed; }
.full-width { width: 100%; max-width: 400px; margin-bottom: 1.5rem; }
.btn-primary { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; border: none; padding: .7rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: opacity .2s; }
.btn-primary:hover:not(:disabled) { opacity: .85; }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.sync-result { margin-top: 1rem; padding: 1rem 1.5rem; border-radius: 10px; font-size: .95rem; line-height: 1.7; }
.sync-result.success { background: #0f2e1f; border: 1px solid #22c55e; color: #86efac; }
.sync-result.error { background: #2e0f0f; border: 1px solid #ef4444; color: #fca5a5; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.2rem; }
.product-card { background: #16162a; border: 1px solid #2d2d4a; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
.product-img-wrapper { height: 160px; overflow: hidden; background: #0d0d20; }
.product-thumb { width: 100%; height: 100%; object-fit: cover; }
.product-info { padding: .8rem 1rem; flex: 1; }
.product-name { font-size: .9rem; font-weight: 600; margin: 0 0 .25rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.product-price { color: #a78bfa; font-size: .95rem; margin: 0 0 .2rem; }
.product-cat { color: #6b7280; font-size: .8rem; margin: 0; }
.upload-area { padding: .75rem 1rem; border-top: 1px solid #2d2d4a; }
.hidden-input { display: none; }
.btn-upload { display: block; text-align: center; background: #1e1e3f; border: 1px dashed #7c3aed; color: #c4b5fd; padding: .5rem; border-radius: 8px; cursor: pointer; font-size: .85rem; transition: background .2s; }
.btn-upload:hover { background: #2d1b5e; }
.upload-status { margin-top: .4rem; text-align: center; font-size: .8rem; }
.upload-status.ok { color: #86efac; }
</style>
