require('dotenv').config()
const { conectarWhatsApp } = require('./whatsapp')

async function iniciar() {
  console.log('🚀 A iniciar o CV Bot...')
  await conectarWhatsApp()
}

iniciar()