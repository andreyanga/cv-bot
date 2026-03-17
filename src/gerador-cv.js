const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, VerticalAlign } = require('docx')

function criarSeparador(cor = '2563EB') {
  return new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: cor }
    },
    spacing: { before: 200, after: 200 }
  })
}

function criarTituloSeccao(texto) {
  return new Paragraph({
    children: [
      new TextRun({
        text: texto.toUpperCase(),
        bold: true,
        size: 24,
        color: '2563EB',
        font: 'Arial'
      })
    ],
    spacing: { before: 300, after: 100 }
  })
}

function criarTexto(texto, opcoes = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text: texto,
        size: opcoes.tamanho || 20,
        bold: opcoes.negrito || false,
        color: opcoes.cor || '374151',
        font: 'Arial'
      })
    ],
    spacing: { before: opcoes.antes || 80, after: opcoes.depois || 80 }
  })
}

async function gerarCV(dados) {
  const { dados_pessoais, perfil_profissional, formacao, experiencia, competencias, idiomas } = dados

  // ── Cabeçalho ──
  const cabecalho = [
    new Paragraph({
      children: [
        new TextRun({
          text: dados_pessoais.nome,
          bold: true,
          size: 48,
          color: '1E3A5F',
          font: 'Arial'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${dados_pessoais.cidade}`, size: 18, color: '6B7280', font: 'Arial' }),
        new TextRun({ text: '   |   ', size: 18, color: '6B7280', font: 'Arial' }),
        new TextRun({ text: `${dados_pessoais.telefone}`, size: 18, color: '6B7280', font: 'Arial' }),
        new TextRun({ text: '   |   ', size: 18, color: '6B7280', font: 'Arial' }),
        new TextRun({ text: `${dados_pessoais.email}`, size: 18, color: '6B7280', font: 'Arial' }),
        ...(dados_pessoais.linkedin && dados_pessoais.linkedin !== 'não' ? [
          new TextRun({ text: '   |   ', size: 18, color: '6B7280', font: 'Arial' }),
          new TextRun({ text: `${dados_pessoais.linkedin}`, size: 18, color: '2563EB', font: 'Arial' })
        ] : [])
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 200 }
    }),
    criarSeparador()
  ]

  // ── Perfil Profissional ──
  const perfilSeccao = [
    criarTituloSeccao('Perfil Profissional'),
    criarSeparador('E5E7EB'),
    criarTexto(perfil_profissional, { antes: 150, depois: 150 })
  ]

  // ── Formação ──
  const formacaoSeccao = [
    criarTituloSeccao('Formação Académica'),
    criarSeparador('E5E7EB'),
    ...formacao.flatMap(f => [
      new Paragraph({
        children: [
          new TextRun({ text: f.curso, bold: true, size: 22, color: '1E3A5F', font: 'Arial' })
        ],
        spacing: { before: 150, after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: f.instituicao, size: 20, color: '374151', font: 'Arial' }),
          new TextRun({ text: `   •   ${f.ano}`, size: 20, color: '6B7280', font: 'Arial' })
        ],
        spacing: { before: 40, after: 100 }
      })
    ])
  ]

  // ── Experiência ──
  const experienciaSeccao = experiencia.length > 0 ? [
    criarTituloSeccao('Experiência Profissional'),
    criarSeparador('E5E7EB'),
    ...experiencia.flatMap(e => [
      new Paragraph({
        children: [
          new TextRun({ text: e.cargo, bold: true, size: 22, color: '1E3A5F', font: 'Arial' })
        ],
        spacing: { before: 150, after: 40 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: e.empresa, size: 20, color: '374151', font: 'Arial' }),
          new TextRun({ text: `   •   ${e.periodo}`, size: 20, color: '6B7280', font: 'Arial' })
        ],
        spacing: { before: 40, after: 80 }
      }),
      criarTexto(e.descricao, { cor: '4B5563', depois: 120 })
    ])
  ] : []

  // ── Competências e Idiomas ──
  const tabelaCompetenciasIdiomas = new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [4500, 4526],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE },
      insideV: { style: BorderStyle.NONE }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'COMPETÊNCIAS', bold: true, size: 24, color: '2563EB', font: 'Arial' })],
                spacing: { before: 300, after: 100 }
              }),
              new Paragraph({
                children: [],
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' } },
                spacing: { before: 0, after: 150 }
              }),
              ...competencias.map(c =>
                new Paragraph({
                  children: [
                    new TextRun({ text: '▸ ', size: 20, color: '2563EB', font: 'Arial' }),
                    new TextRun({ text: c, size: 20, color: '374151', font: 'Arial' })
                  ],
                  spacing: { before: 80, after: 80 }
                })
              )
            ]
          }),
          new TableCell({
            width: { size: 4526, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'IDIOMAS', bold: true, size: 24, color: '2563EB', font: 'Arial' })],
                spacing: { before: 300, after: 100 }
              }),
              new Paragraph({
                children: [],
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' } },
                spacing: { before: 0, after: 150 }
              }),
              ...idiomas.map(i =>
                new Paragraph({
                  children: [
                    new TextRun({ text: i.idioma, bold: true, size: 20, color: '1E3A5F', font: 'Arial' }),
                    new TextRun({ text: ` — ${i.nivel}`, size: 20, color: '6B7280', font: 'Arial' })
                  ],
                  spacing: { before: 80, after: 80 }
                })
              )
            ]
          })
        ]
      })
    ]
  })

  // ── Montar documento ──
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 }
        }
      },
      children: [
        ...cabecalho,
        ...perfilSeccao,
        ...formacaoSeccao,
        ...experienciaSeccao,
        tabelaCompetenciasIdiomas
      ]
    }]
  })

  const pdfBuffer = await Packer.toBuffer(doc)
  const nomeFicheiro = `CV_${dados_pessoais.nome.replace(/\s+/g, '_')}.docx`

  return { pdfBuffer, nomeFicheiro }
}

module.exports = { gerarCV }