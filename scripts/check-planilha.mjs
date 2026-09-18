import XLSX from 'xlsx'
const wb = XLSX.readFile('Leads_Escolas_Consolidado.xlsx')
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Leads de Escolas'])
console.log(`Total de linhas: ${rows.length}\n`)

// Amostra: escolas que sabemos ter múltiplos registros/variantes de nome
const amostras = rows.filter(r => /zoe|lighthouse|ouro preto|acbv|batista conectar/i.test(r['Escola']))
amostras.forEach(r => console.log(JSON.stringify(r, null, 2)))

console.log('\n--- Primeiras 5 linhas (ordem alfabética) ---')
rows.slice(0, 5).forEach(r => console.log(JSON.stringify(r)))

console.log('\n--- Estatística de telefones vazios ---')
const semTelefone = rows.filter(r => !r['Telefones']).length
console.log(`Escolas sem nenhum telefone: ${semTelefone} de ${rows.length}`)
