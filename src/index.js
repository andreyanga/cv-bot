require('dotenv').config()
const { conectarWhatsApp, enviarMensagem, enviarFicheiro } = require('./whatsapp')
const { processarMensagem } = require('./conversa')

async function iniciar() {
  console.log('🚀 A iniciar o CV Bot...')
  await conectarWhatsApp(async (telefone, texto) => {
    await processarMensagem(telefone, texto, enviarMensagem, enviarFicheiro)
  })
}

iniciar()