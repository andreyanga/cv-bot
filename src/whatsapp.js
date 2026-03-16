const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const { processarMensagem } = require('./conversa')

let sock

async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Lê este QR Code com o teu WhatsApp:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const deveReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Conexão fechada. Reconectando:', deveReconectar)
      if (deveReconectar) conectarWhatsApp()
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp conectado com sucesso!')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const telefone = msg.key.remoteJid
    const texto = msg.message.conversation || 
                  msg.message.extendedTextMessage?.text || ''

    if (!texto) return

    console.log(`📩 Mensagem de ${telefone}: ${texto}`)

    await processarMensagem(telefone, texto, sock)
  })
}

async function enviarMensagem(telefone, texto) {
  await sock.sendMessage(telefone, { text: texto })
}

async function enviarFicheiro(telefone, buffer, nomeFicheiro) {
  await sock.sendMessage(telefone, {
    document: buffer,
    mimetype: 'application/pdf',
    fileName: nomeFicheiro
  })
}

module.exports = { conectarWhatsApp, enviarMensagem, enviarFicheiro }