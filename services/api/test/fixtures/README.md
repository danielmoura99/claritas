# Fixtures de teste

Payloads **fictícios** no formato da Binance Spot, usados SOMENTE pelos testes automatizados
(`test/unit`). Valores redondos e datas de 2023 de propósito — não são cotações reais e nunca
devem ser importados por código de produção (`src/`). O teste `no-fake-data.test.ts` garante isso.
