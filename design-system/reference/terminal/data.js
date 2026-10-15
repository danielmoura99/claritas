// Mock market data for the Claritas Terminal UI kit (B3, fictitious prices).
window.CL_DATA = {
  assets: [
    { symbol: 'PETR4', name: 'Petrobras PN', price: 38.42, change: 1.21, seed: 7, sector: 'Petróleo' },
    { symbol: 'VALE3', name: 'Vale ON', price: 61.27, change: -0.64, seed: 11, sector: 'Mineração' },
    { symbol: 'ITUB4', name: 'Itaú Unibanco PN', price: 34.18, change: 0.33, seed: 19, sector: 'Bancos' },
    { symbol: 'WEGE3', name: 'WEG ON', price: 52.9, change: 2.08, seed: 23, sector: 'Bens industriais' },
    { symbol: 'BBAS3', name: 'Banco do Brasil ON', price: 27.61, change: -1.12, seed: 29, sector: 'Bancos' },
    { symbol: 'BBDC4', name: 'Bradesco PN', price: 13.42, change: 0.15, seed: 31, sector: 'Bancos' },
    { symbol: 'PRIO3', name: 'PRIO ON', price: 44.8, change: 1.74, seed: 37, sector: 'Petróleo' },
    { symbol: 'B3SA3', name: 'B3 ON', price: 11.37, change: -0.44, seed: 41, sector: 'Financeiro' },
    { symbol: 'ABEV3', name: 'Ambev ON', price: 12.08, change: 0.08, seed: 43, sector: 'Consumo' },
    { symbol: 'SUZB3', name: 'Suzano ON', price: 56.12, change: -0.92, seed: 47, sector: 'Papel e celulose' },
    { symbol: 'RENT3', name: 'Localiza ON', price: 41.55, change: 0.61, seed: 53, sector: 'Locação' },
    { symbol: 'MGLU3', name: 'Magazine Luiza ON', price: 9.84, change: -2.31, seed: 59, sector: 'Varejo' },
  ],
  macro: [
    { symbol: 'IBOV', price: 131420, change: 0.42, decimals: 0 },
    { symbol: 'IFIX', price: 3318, change: 0.06, decimals: 0 },
    { symbol: 'USDBRL', price: 5.4321, change: -0.21, decimals: 4 },
    { symbol: 'DI1F27', price: 13.42, change: 0.05 },
    { symbol: 'S&P FUT', price: 5832, change: 0.18, decimals: 0 },
  ],
  // Claritas reads — templates the live desk cycles through.
  signals: [
    { kind: 'buy', tf: '5m', title: 'Rompimento confirmado acima da resistência', body: 'Fechamento acima do nível testado três vezes desde a abertura, com volume 2,1× a média de 20 períodos. Invalida se voltar a fechar abaixo do nível.', conf: 78, tags: ['Rompimento', 'Volume'] },
    { kind: 'watch', tf: '15m', title: 'Testando a VWAP pela terceira vez', body: 'Preço oscila em torno da VWAP com volume caindo. Sem direção definida — aguardar fechamento fora da faixa.', conf: 52, tags: ['VWAP'] },
    { kind: 'sell', tf: '5m', title: 'Perdeu a mínima do dia com fluxo vendedor', body: 'Três velas de baixa consecutivas com saldo de agressão negativo. MM9 cruzou a MM21 para baixo.', conf: 64, tags: ['Fluxo', 'Médias'] },
    { kind: 'pattern', tf: '1h', title: 'Bandeira de alta em formação', body: 'Mastro de +2,4% seguido de consolidação estreita e volume decrescente. Alvo projetado pela altura do mastro.', conf: 61, tags: ['Padrão'] },
    { kind: 'alert', tf: '1m', title: 'Volume atípico nos últimos 3 minutos', body: 'Negócios 4,3× acima do normal para o horário. Pode anteceder notícia — conferir fatos relevantes.', conf: 70, tags: ['Volume'] },
    { kind: 'buy', tf: '15m', title: 'Divergência de alta no IFR', body: 'Preço fez nova mínima, IFR(14) não. Primeiro sinal de exaustão vendedora desde 11:20.', conf: 58, tags: ['IFR', 'Divergência'] },
  ],
  thoughts: ['lendo fluxo de agressão', 'comparando volume com 20 períodos', 'recalculando suportes', 'checando correlação com IBOV', 'medindo amplitude do dia', 'procurando padrões de candle', 'cruzando médias 9 × 21', 'avaliando VWAP'],
};
