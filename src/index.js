require('dotenv').config()
const http = require('http')
const { conectarWhatsApp, enviarMensagem, enviarFicheiro } = require('./whatsapp')
const { processarMensagem } = require('./conversa')

// Servidor HTTP simples para o Render não matar o processo
const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end('CV Bot está online ✅')
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP na porta ${PORT}`)
})

async function iniciar() {
  console.log('🚀 A iniciar o CV Bot...')
  await conectarWhatsApp(async (telefone, texto) => {
    await processarMensagem(telefone, texto, enviarMensagem, enviarFicheiro)
  })
}

iniciar()