const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function organizarDadosComIA(dados) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
    Tens os seguintes dados de uma pessoa para criar um CV profissional em português de Angola.
    
    Dados recolhidos:
    - Nome: ${dados.nome}
    - Telefone: ${dados.telefone}
    - Email: ${dados.email}
    - Cidade: ${dados.cidade}
    - LinkedIn: ${dados.linkedin || 'Não informado'}
    - Perfil descrito pela pessoa: ${dados.perfil}
    - Curso: ${dados.formacao_curso}
    - Universidade: ${dados.formacao_universidade}
    - Ano de conclusão: ${dados.formacao_ano}
    - Empresa: ${dados.sem_experiencia ? 'Sem experiência' : dados.experiencia_empresa}
    - Cargo: ${dados.sem_experiencia ? 'N/A' : dados.experiencia_cargo}
    - Tempo: ${dados.sem_experiencia ? 'N/A' : dados.experiencia_tempo}
    - Descrição do trabalho: ${dados.sem_experiencia ? 'N/A' : dados.experiencia_descricao}
    - Competências: ${dados.competencias}
    - Idiomas: ${dados.idiomas}

    Com base nestes dados, devolve APENAS um JSON válido com esta estrutura exacta, sem texto adicional, sem markdown, sem backticks:
    {
      "dados_pessoais": {
        "nome": "",
        "telefone": "",
        "email": "",
        "cidade": "",
        "linkedin": ""
      },
      "perfil_profissional": "",
      "formacao": [
        {
          "curso": "",
          "instituicao": "",
          "ano": ""
        }
      ],
      "experiencia": [
        {
          "empresa": "",
          "cargo": "",
          "periodo": "",
          "descricao": ""
        }
      ],
      "competencias": [],
      "idiomas": [
        {
          "idioma": "",
          "nivel": ""
        }
      ]
    }

    Regras:
    - O perfil_profissional deve ser reescrito de forma profissional e formal
    - As competências devem ser uma lista simples de strings
    - Se não tiver experiência, deixa o array experiencia vazio
    - O JSON deve ser válido e completo
  `

  const resultado = await model.generateContent(prompt)
  const texto = resultado.response.text()

  try {
    const dadosOrganizados = JSON.parse(texto)
    return dadosOrganizados
  } catch (erro) {
    // Tenta limpar o texto caso venha com caracteres extra
    const textoLimpo = texto
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    return JSON.parse(textoLimpo)
  }
}

module.exports = { organizarDadosComIA }