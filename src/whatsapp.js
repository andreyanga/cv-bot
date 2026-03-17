const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

let sock

async function conectarWhatsApp(onMensagem) {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, console)
    },
    printQRInTerminal: false,
    connectTimeoutMs: 120000,
    defaultQueryTimeoutMs: 120000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 5000,
    maxRetries: 10,
    browser: ['cv-bot', 'Chrome', '120.0.0'],
    syncFullHistory: false,
    fireInitQueries: false,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: jid => !jid.includes('@s.whatsapp.net') && !jid.includes('@g.us')
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Lê este QR Code com o teu WhatsApp:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const deveReconectar = statusCode !== DisconnectReason.loggedOut
      console.log('Conexão fechada. Código:', statusCode, 'Reconectando:', deveReconectar)
      if (deveReconectar) {
        setTimeout(() => conectarWhatsApp(onMensagem), 5000)
      }
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
    await onMensagem(telefone, texto)
  })
}

async function enviarMensagem(telefone, texto) {
  await sock.sendMessage(telefone, { text: texto })
}

async function enviarFicheiro(telefone, buffer, nomeFicheiro) {
  await sock.sendMessage(telefone, {
    document: buffer,
    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileName: nomeFicheiro
  })
}

module.exports = { conectarWhatsApp, enviarMensagem, enviarFicheiro }