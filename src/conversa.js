const { createClient } = require('@supabase/supabase-js')
const { organizarDadosComIA } = require('./gemini')
const { gerarCV } = require('./gerador-cv')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const ETAPAS = [
  'inicio',
  'nome',
  'telefone',
  'email',
  'cidade',
  'linkedin',
  'perfil',
  'formacao_curso',
  'formacao_universidade',
  'formacao_ano',
  'experiencia_empresa',
  'experiencia_cargo',
  'experiencia_tempo',
  'experiencia_descricao',
  'competencias',
  'idiomas',
  'finalizado'
]

const PERGUNTAS = {
  inicio: '👋 Olá! Vou ajudar-te a criar o teu CV profissional.\n\nEscreve *iniciar* para começarmos.',
  nome: '1️⃣ Qual é o teu nome completo?',
  telefone: '2️⃣ Qual é o teu número de telefone?',
  email: '3️⃣ Qual é o teu email?',
  cidade: '4️⃣ Em que cidade moras?',
  linkedin: '5️⃣ Tens LinkedIn? Se sim, escreve o link. Se não, escreve *não*.',
  perfil: '6️⃣ Descreve-te profissionalmente em 2 ou 3 frases.\n\nExemplo: _Sou gestor com 3 anos de experiência em finanças, focado em resultados e trabalho em equipa._',
  formacao_curso: '7️⃣ Qual foi o teu curso de formação?\n\nExemplo: _Gestão de Empresas_',
  formacao_universidade: '8️⃣ Em que universidade ou instituição?',
  formacao_ano: '9️⃣ Em que ano terminaste?',
  experiencia_empresa: '🔟 Em que empresa trabalhaste? (a mais recente)\n\nSe não tens experiência, escreve *não*.',
  experiencia_cargo: '1️⃣1️⃣ Qual era o teu cargo?',
  experiencia_tempo: '1️⃣2️⃣ Quanto tempo trabalhaste lá?\n\nExemplo: _2 anos_ ou _Jan 2022 - Dez 2023_',
  experiencia_descricao: '1️⃣3️⃣ Descreve brevemente o que fazias nesse trabalho.',
  competencias: '1️⃣4️⃣ Quais são as tuas principais competências?\n\nExemplo: _Excel, Python, Gestão de projectos, Atendimento ao cliente_',
  idiomas: '1️⃣5️⃣ Que idiomas falas e qual o teu nível?\n\nExemplo: _Português (nativo), Inglês (intermédio), Francês (básico)_'
}

async function obterConversa(telefone) {
  try {
    const { data } = await supabase
      .from('conversas')
      .select('*')
      .eq('telefone', telefone)
      .single()
    return data
  } catch {
    return null
  }
}

async function guardarConversa(telefone, etapa, dados) {
  const { data: existente } = await supabase
    .from('conversas')
    .select('id')
    .eq('telefone', telefone)
    .single()

  if (existente) {
    await supabase
      .from('conversas')
      .update({ etapa, dados, actualizado_em: new Date() })
      .eq('telefone', telefone)
  } else {
    await supabase
      .from('conversas')
      .insert({ telefone, etapa, dados })
  }
}

async function processarMensagem(telefone, texto, enviarMensagem, enviarFicheiro) {
  try {
    let conversa = await obterConversa(telefone)

    if (!conversa) {
      await guardarConversa(telefone, 'inicio', {})
      await enviarMensagem(telefone, PERGUNTAS.inicio)
      return
    }

    const etapaActual = conversa.etapa
    const dados = conversa.dados || {}

    if (texto.toLowerCase() === 'reiniciar') {
      await guardarConversa(telefone, 'inicio', {})
      await enviarMensagem(telefone, PERGUNTAS.inicio)
      return
    }

    if (etapaActual === 'inicio') {
      if (texto.toLowerCase() === 'iniciar') {
        await guardarConversa(telefone, 'nome', dados)
        await enviarMensagem(telefone, PERGUNTAS.nome)
      } else {
        await enviarMensagem(telefone, PERGUNTAS.inicio)
      }
      return
    }

    if (etapaActual === 'finalizado') {
      await enviarMensagem(telefone, '✅ O teu CV já foi gerado! Escreve *reiniciar* para criar um novo.')
      return
    }

    if (etapaActual === 'experiencia_empresa' && texto.toLowerCase() === 'não') {
      dados.sem_experiencia = true
      await guardarConversa(telefone, 'competencias', dados)
      await enviarMensagem(telefone, PERGUNTAS.competencias)
      return
    }

    dados[etapaActual] = texto

    const indexActual = ETAPAS.indexOf(etapaActual)
    const proximaEtapa = ETAPAS[indexActual + 1]

    if (proximaEtapa === 'finalizado') {
      await guardarConversa(telefone, 'finalizado', dados)
      await enviarMensagem(telefone, '⏳ Perfeito! Estou a gerar o teu CV, aguarda um momento...')

      try {
        const dadosOrganizados = await organizarDadosComIA(dados)
        const { pdfBuffer, nomeFicheiro } = await gerarCV(dadosOrganizados)

        await enviarMensagem(telefone, '✅ O teu CV está pronto!')
        await enviarFicheiro(telefone, pdfBuffer, nomeFicheiro)
        await enviarMensagem(telefone, '📄 Aqui está o teu CV.\n\nSe quiseres criar outro, escreve *reiniciar*.')

        await supabase.from('cvs').insert({
          telefone,
          ficheiro_url: nomeFicheiro
        })
      } catch (erro) {
        console.error('Erro ao gerar CV:', erro)
        await enviarMensagem(telefone, '❌ Ocorreu um erro ao gerar o CV. Escreve *reiniciar* para tentar novamente.')
      }
      return
    }

    await guardarConversa(telefone, proximaEtapa, dados)
    await enviarMensagem(telefone, PERGUNTAS[proximaEtapa])

  } catch (erro) {
    console.error('Erro ao processar mensagem:', erro)
    await enviarMensagem(telefone, '❌ Ocorreu um erro. Tenta novamente.')
  }
}

module.exports = { processarMensagem }