import { useState, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// CAMADA 1 — DADOS FIXOS AUDITÁVEIS
// Fonte: legislações estaduais vigentes, conferidas abr/2025
// ═══════════════════════════════════════════════════════════════════════════════

const ALIQ_INTER = 12; // MG → qualquer UF (operações interestaduais gerais)

const ESTADOS = [
  { uf:"AC", nome:"Acre",                aliq:19,   porDentro:false, fcp:0 },
  { uf:"AL", nome:"Alagoas",             aliq:19,   porDentro:true,  fcp:2 },
  { uf:"AM", nome:"Amazonas",            aliq:20,   porDentro:false, fcp:0 },
  { uf:"AP", nome:"Amapá",               aliq:18,   porDentro:false, fcp:0 },
  { uf:"BA", nome:"Bahia",               aliq:20.5, porDentro:true,  fcp:0 },
  { uf:"CE", nome:"Ceará",               aliq:20,   porDentro:false, fcp:2 },
  { uf:"DF", nome:"Distrito Federal",    aliq:20,   porDentro:false, fcp:2 },
  { uf:"ES", nome:"Espírito Santo",      aliq:17,   porDentro:false, fcp:0 },
  { uf:"GO", nome:"Goiás",               aliq:19,   porDentro:true,  fcp:0 },
  { uf:"MA", nome:"Maranhão",            aliq:23,   porDentro:false, fcp:0 },
  { uf:"MT", nome:"Mato Grosso",         aliq:17,   porDentro:false, fcp:2 },
  { uf:"MS", nome:"Mato Grosso do Sul",  aliq:17,   porDentro:true,  fcp:0 },
  { uf:"PA", nome:"Pará",                aliq:19,   porDentro:true,  fcp:2 },
  { uf:"PB", nome:"Paraíba",             aliq:20,   porDentro:true,  fcp:2 },
  { uf:"PR", nome:"Paraná",              aliq:19.5, porDentro:true,  fcp:0 },
  { uf:"PE", nome:"Pernambuco",          aliq:20.5, porDentro:true,  fcp:0 },
  { uf:"PI", nome:"Piauí",               aliq:22.5, porDentro:true,  fcp:0 },
  { uf:"RJ", nome:"Rio de Janeiro",      aliq:22,   porDentro:true,  fcp:2 },
  { uf:"RN", nome:"Rio Grande do Norte", aliq:20,   porDentro:false, fcp:2 },
  { uf:"RS", nome:"Rio Grande do Sul",   aliq:17,   porDentro:true,  fcp:0 },
  { uf:"RO", nome:"Rondônia",            aliq:19.5, porDentro:false, fcp:0 },
  { uf:"RR", nome:"Roraima",             aliq:20,   porDentro:false, fcp:0 },
  { uf:"SC", nome:"Santa Catarina",      aliq:17,   porDentro:true,  fcp:0 },
  { uf:"SP", nome:"São Paulo",           aliq:18,   porDentro:true,  fcp:2 },
  { uf:"SE", nome:"Sergipe",             aliq:20,   porDentro:true,  fcp:0 },
  { uf:"TO", nome:"Tocantins",           aliq:20,   porDentro:true,  fcp:0 },
];

const SEFAZ_URLS = {
  AC:"sefaz.ac.gov.br", AL:"sefaz.al.gov.br", AM:"sefaz.am.gov.br",
  AP:"sefaz.ap.gov.br", BA:"sefaz.ba.gov.br", CE:"sefaz.ce.gov.br",
  DF:"fazenda.df.gov.br", ES:"sefaz.es.gov.br", GO:"sefaz.go.gov.br",
  MA:"sefaz.ma.gov.br", MT:"sefaz.mt.gov.br", MS:"sefaz.ms.gov.br",
  PA:"sefaz.pa.gov.br", PB:"sefaz.pb.gov.br", PR:"fazenda.pr.gov.br",
  PE:"sefaz.pe.gov.br", PI:"sefaz.pi.gov.br", RJ:"fazenda.rj.gov.br",
  RN:"set.rn.gov.br", RS:"receita.rs.gov.br", RO:"sefin.ro.gov.br",
  RR:"sefaz.rr.gov.br", SC:"sef.sc.gov.br", SP:"fazenda.sp.gov.br",
  SE:"sefaz.se.gov.br", TO:"sefaz.to.gov.br",
};

// ── CONVÊNIOS NACIONAIS HARD-CODED ──────────────────────────────────────────
// Fonte primária: CONFAZ. Aplicam-se a DIFAL MG→consumidor final não contribuinte.

// Conv.52/91 Anexo II — Implementos agrícolas
// Carga efetiva interna destino = 5,60% (Cláusula 5ª)
// Como 5,60% < 12% (alíq.inter.), DIFAL = 0 em qualquer estado
// Vigência: até 30/04/2026 (Conv.226/2023)
// Confirmado: Consulta MT 108/2024 (8424.41.00); RC SP 31184/2025
const CONV52_IMPL = new Set([
  "8201.10.00","8201.30.00","8201.40.00","8201.50.00","8201.60.00","8201.90.00",
  "8424.41.00","8424.49.00","8424.82.21","8424.82.29","8424.89.10",
  "8432.31.10","8432.31.90","8432.39.90","8432.80.00","8432.90.00",
  "8433.11.00","8433.90.10",
  "8434.20.90",
  "8435.10.00",
  "8436.10.00","8436.21.00","8436.29.00","8436.80.00","8436.91.00","8436.99.00",
  "8437.80.10",
]);

// Conv.52/91 Anexo I — Equipamentos industriais
// Carga efetiva interna destino = 8,80% (Cláusula 5ª)
// Como 8,80% < 12%, DIFAL = 0 também
// Vigência: até 30/04/2026
const CONV52_EQUIP = new Set([
  "8421.21.00","8421.29.19",
]);

// NCMs NÃO cobertos por convênio nacional para consumidor final PF:
// Conv.100/97 → apenas produtores rurais/contribuintes
// Conv.87/2002 → apenas órgãos públicos
// Conv.162/94 → apenas órgãos públicos
const PREFIXO_MEDICAMENTO = ["3001","3002","3003","3004","3005","3006"];
const ST_CIGARROS = new Set(["2402.20.00","2403.19.00","4813.10.00"]);
const ST_BEBIDAS = new Set(["2201.10.00","2202.10.00","2202.90.00","2202.91.00","2202.99.00","2203.00.00","2207.20.11","2207.20.19","2207.20.20"]);

// ═══════════════════════════════════════════════════════════════════════════════
// CAMADA 2 — MOTOR DE CÁLCULO com memória de cálculo completa
// ═══════════════════════════════════════════════════════════════════════════════

function calcDIFAL(bc, aliqInterna, porDentro) {
  const ai = ALIQ_INTER / 100;
  const ad = aliqInterna / 100;
  if (porDentro) {
    const bc1 = bc - bc * ai;
    const bc2 = bc1 / (1 - ad);
    return Math.max(0, bc2 * ad - bc * ai);
  }
  return Math.max(0, bc * (ad - ai));
}

function gerarMemoriaCalculo(bc, aliqInterna, aliqEfetiva, porDentro, temBeneficio, nomeBeneficio) {
  const ai = ALIQ_INTER / 100;
  const ad = aliqInterna / 100;
  const ae = (aliqEfetiva ?? aliqInterna) / 100;
  const passos = [];

  passos.push({ n:"1", label:"Base de Cálculo (valor da venda)", formula:`BC = R$ ${fmt(bc)}`, resultado: bc });

  if (porDentro) {
    const bc1 = bc - bc * ai;
    const bc2 = bc1 / (1 - ad);
    const difalBruto = bc2 * ad - bc * ai;
    passos.push({ n:"2", label:"Retirada do ICMS interestadual da base (gross-up)", formula:`BC₁ = BC − BC × ${ALIQ_INTER}% = ${fmt(bc)} − ${fmt(bc * ai)} = ${fmt(bc1)}`, resultado: bc1 });
    passos.push({ n:"3", label:"Gross-up: base ajustada pelo tributo por dentro", formula:`BC₂ = BC₁ ÷ (1 − ${aliqInterna}%) = ${fmt(bc1)} ÷ ${(1 - ad).toFixed(4)} = ${fmt(bc2)}`, resultado: bc2 });
    if (temBeneficio && aliqEfetiva !== aliqInterna) {
      const bc2ef = bc1 / (1 - ae);
      const difalEf = Math.max(0, bc2ef * ae - bc * ai);
      passos.push({ n:"4", label:`DIFAL pela alíquota cheia (sem benefício)`, formula:`DIFAL bruto = BC₂ × ${aliqInterna}% − BC × ${ALIQ_INTER}% = ${fmt(bc2 * ad)} − ${fmt(bc * ai)} = ${fmt(Math.max(0, difalBruto))}`, resultado: Math.max(0, difalBruto) });
      passos.push({ n:"5", label:`Aplicação de ${nomeBeneficio}: alíquota efetiva = ${aliqEfetiva}%`, formula:`BC₂ef = BC₁ ÷ (1 − ${aliqEfetiva}%) = ${fmt(bc1)} ÷ ${(1 - ae).toFixed(4)} = ${fmt(bc2ef)}\nDIFAL com benefício = ${fmt(bc2ef * ae)} − ${fmt(bc * ai)} = ${fmt(difalEf)}`, resultado: difalEf });
    } else if (temBeneficio && aliqEfetiva === 0) {
      passos.push({ n:"4", label:`DIFAL pela alíquota cheia`, formula:`DIFAL bruto = BC₂ × ${aliqInterna}% − BC × ${ALIQ_INTER}% = ${fmt(Math.max(0, difalBruto))}`, resultado: Math.max(0, difalBruto) });
      passos.push({ n:"5", label:`${nomeBeneficio}: alíquota efetiva interna = 0% (isento)`, formula:`Alíq.efetiva (0%) < Alíq.inter. (${ALIQ_INTER}%) → DIFAL = R$ 0,00`, resultado: 0 });
    } else if (temBeneficio) {
      passos.push({ n:"4", label:`DIFAL pela alíquota cheia`, formula:`DIFAL bruto = ${fmt(Math.max(0, difalBruto))}`, resultado: Math.max(0, difalBruto) });
      passos.push({ n:"5", label:`${nomeBeneficio}: alíquota efetiva = ${aliqEfetiva}%`, formula:`Carga efetiva (${aliqEfetiva}%) < Alíq.inter. (${ALIQ_INTER}%) → DIFAL = R$ 0,00`, resultado: 0 });
    } else {
      passos.push({ n:"4", label:"DIFAL = ICMS interno − ICMS interestadual", formula:`DIFAL = BC₂ × ${aliqInterna}% − BC × ${ALIQ_INTER}% = ${fmt(bc2 * ad)} − ${fmt(bc * ai)} = ${fmt(Math.max(0, difalBruto))}`, resultado: Math.max(0, difalBruto) });
    }
  } else {
    const difalBruto = bc * (ad - ai);
    passos.push({ n:"2", label:"DIFAL pela diferença de alíquotas (base simples)", formula:`DIFAL = BC × (${aliqInterna}% − ${ALIQ_INTER}%) = ${fmt(bc)} × ${(ad - ai).toFixed(4)} = ${fmt(Math.max(0, difalBruto))}`, resultado: Math.max(0, difalBruto) });
    if (temBeneficio && aliqEfetiva !== aliqInterna) {
      const difalEf = Math.max(0, bc * (ae - ai));
      passos.push({ n:"3", label:`${nomeBeneficio}: alíquota efetiva = ${aliqEfetiva}%`, formula:`DIFAL com benefício = BC × (${aliqEfetiva}% − ${ALIQ_INTER}%) = ${fmt(difalEf)}`, resultado: difalEf });
    } else if (temBeneficio) {
      passos.push({ n:"3", label:`${nomeBeneficio}: alíquota efetiva = ${aliqEfetiva ?? 0}%`, formula:`Carga efetiva (${aliqEfetiva ?? 0}%) ≤ Alíq.inter. (${ALIQ_INTER}%) → DIFAL = R$ 0,00`, resultado: 0 });
    }
  }

  return passos;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMADA 3 — CONSULTA IA + WEB SEARCH para legislação estadual
// Acionada SOMENTE quando não há convênio nacional identificado
// ═══════════════════════════════════════════════════════════════════════════════

async function consultarLegislacaoEstadual(ncm, uf, nomeEstado, aliqInterna, descricao) {
  const sefazDomain = SEFAZ_URLS[uf] || `sefaz.${uf.toLowerCase()}.gov.br`;

  const prompt = `Você é especialista em ICMS estadual brasileiro. Analise se existe isenção, redução de base de cálculo ou alíquota reduzida de ICMS nas operações INTERNAS do estado de ${nomeEstado} (${uf}) com o produto de NCM ${ncm}${descricao ? ` (${descricao})` : ""}.

CONTEXTO DA OPERAÇÃO:
- Remetente: Minas Gerais (contribuinte do ICMS)
- Destinatário: consumidor final NÃO contribuinte (pessoa física) em ${nomeEstado}
- Tipo de operação: venda interestadual com DIFAL
- Se o produto for ISENTO ou tributado a ALÍQUOTA ZERO nas operações INTERNAS do ${nomeEstado}, o DIFAL será ZERO (pois DIFAL = alíq.interna − 12%, e se alíq.interna = 0%, resultado é negativo = zero)
- Alíquota interna padrão do ${nomeEstado}: ${aliqInterna}%

USE web_search para buscar:
1. RICMS ${nomeEstado} NCM ${ncm} isenção ICMS operação interna
2. ${sefazDomain} NCM ${ncm} alíquota reduzida ICMS
3. Convênio ICMS ${ncm} isenção ${uf} operação interna consumidor final

REGRAS CRÍTICAS — sua resposta deve seguir:
1. Só declare benefício se encontrar BASE LEGAL ESPECÍFICA (lei, decreto, artigo do RICMS, convênio estadual) com o NCM exato ou posição NCM abrangente
2. Não confunda isenções restritas a contribuintes/produtores rurais com isenções para consumidor final
3. Não confunda benefícios de operações internas entre contribuintes com benefícios de DIFAL
4. Se não encontrar nada específico: declare "nao_encontrado"
5. Sempre inclua a URL da fonte se encontrada

Responda SOMENTE em JSON válido, sem markdown:
{
  "status": "isento" | "reduzido" | "tributado_cheio" | "nao_encontrado",
  "aliqEfetiva": número (0 se isento, valor reduzido se reduzido, ${aliqInterna} se cheio ou não encontrado),
  "percentualReducaoBC": número (0 se não houver redução de BC),
  "tipobeneficio": "string descritiva ou vazio",
  "baseLegal": "artigo + lei/decreto/convênio exato ou vazio",
  "urlFonte": "URL encontrada ou vazio",
  "descricaoBeneficio": "explicação em linguagem simples ou vazio",
  "ressalva": "sempre incluir: análise orientativa — confirmar com contador ou SEFAZ antes de emitir NF-e"
}`;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Chave VITE_ANTHROPIC_API_KEY não configurada. Veja o arquivo .env.example.");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${resp.status}`);
  }

  const data = await resp.json();
  // Pegar o último bloco de texto (após tool use)
  const blocos = data.content || [];
  const textoBlocos = blocos.filter(b => b.type === "text").map(b => b.text);
  const raw = textoBlocos[textoBlocos.length - 1] || "{}";
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { status: "nao_encontrado", aliqEfetiva: aliqInterna, baseLegal: "", ressalva: "Não foi possível interpretar a resposta da busca." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANÁLISE COMPLETA: convênio nacional → se não encontrou → busca estadual
// ═══════════════════════════════════════════════════════════════════════════════

function analisarConvenioNacional(ncm, uf) {
  const p4 = ncm.slice(0, 4);
  const isMed = PREFIXO_MEDICAMENTO.includes(p4);
  const isST_cig = ST_CIGARROS.has(ncm);
  const isST_beb = ST_BEBIDAS.has(ncm);

  if (CONV52_IMPL.has(ncm)) {
    return {
      encontrou: true,
      tipo: "Conv.ICMS 52/91 — Implementos agrícolas",
      aliqEfetiva: 5.60,
      difalZero: true,
      baseLegal: "Convênio ICMS 52/91, Cláusulas 2ª e 5ª (CONFAZ). Prorrogado até 30/04/2026 pelo Conv.226/2023.",
      vigencia: "até 30/04/2026",
      descricao: "Implemento agrícola listado no Anexo II do Conv.52/91. Carga tributária efetiva interna = 5,60%, inferior à alíquota interestadual de 12%. DIFAL = zero.",
      urlFonte: "https://www.confaz.fazenda.gov.br/legislacao/convenios/1991/CV052_91",
      alertas: [],
      st: null,
    };
  }

  if (CONV52_EQUIP.has(ncm)) {
    return {
      encontrou: true,
      tipo: "Conv.ICMS 52/91 — Equipamento industrial",
      aliqEfetiva: 8.80,
      difalZero: true,
      baseLegal: "Convênio ICMS 52/91, Cláusulas 1ª e 5ª (CONFAZ). Prorrogado até 30/04/2026.",
      vigencia: "até 30/04/2026",
      descricao: "Equipamento industrial listado no Anexo I do Conv.52/91. Carga tributária efetiva interna = 8,80%, inferior à alíquota interestadual de 12%. DIFAL = zero.",
      urlFonte: "https://www.confaz.fazenda.gov.br/legislacao/convenios/1991/CV052_91",
      alertas: [],
      st: null,
    };
  }

  const alertas = [];
  let st = null;

  if (isMed) alertas.push("Medicamento: Conv.87/2002 aplica-se SOMENTE a órgãos públicos. Conv.162/94 (oncológicos) idem. Nenhum convênio nacional isenta DIFAL de medicamentos para consumidor final PF. Busca de legislação estadual será realizada.");
  if (isST_cig) st = { aplicavel: true, obs: "Cigarro/fumo: ST generalizada. DIFAL normalmente recolhido pelo substituto tributário (fabricante/importador)." };
  if (isST_beb) st = { aplicavel: true, obs: "Água/bebida: sujeita a ST na maioria dos estados. Verificar protocolo MG↔destino." };

  return { encontrou: false, alertas, st };
}

function calcularResultado(bc, estado, convenio, buscaEstadual) {
  const { aliq, porDentro, fcp } = estado;
  let aliqEfetiva = aliq;
  let difalOtim = 0;
  let temBeneficio = false;
  let beneficio = null;
  let fonte = "legislação estadual padrão";

  if (convenio.encontrou) {
    aliqEfetiva = convenio.aliqEfetiva;
    difalOtim = 0;
    temBeneficio = true;
    beneficio = {
      tipo: convenio.tipo,
      aliqEfetiva: convenio.aliqEfetiva,
      baseLegal: convenio.baseLegal,
      vigencia: convenio.vigencia,
      descricao: convenio.descricao,
      urlFonte: convenio.urlFonte,
      origem: "convenio_nacional",
    };
    fonte = convenio.tipo;
  } else if (buscaEstadual) {
    if (buscaEstadual.status === "isento") {
      aliqEfetiva = 0;
      difalOtim = 0;
      temBeneficio = true;
      beneficio = {
        tipo: buscaEstadual.tipobeneficio || "Isenção estadual",
        aliqEfetiva: 0,
        baseLegal: buscaEstadual.baseLegal,
        vigencia: "",
        descricao: buscaEstadual.descricaoBeneficio,
        urlFonte: buscaEstadual.urlFonte,
        origem: "legislacao_estadual",
        ressalva: buscaEstadual.ressalva,
      };
      fonte = buscaEstadual.tipobeneficio || "Isenção estadual";
    } else if (buscaEstadual.status === "reduzido" && buscaEstadual.aliqEfetiva < aliq) {
      aliqEfetiva = buscaEstadual.aliqEfetiva;
      difalOtim = calcDIFAL(bc, aliqEfetiva, porDentro);
      temBeneficio = difalOtim < calcDIFAL(bc, aliq, porDentro);
      beneficio = {
        tipo: buscaEstadual.tipobeneficio || "Redução estadual",
        aliqEfetiva,
        baseLegal: buscaEstadual.baseLegal,
        vigencia: "",
        descricao: buscaEstadual.descricaoBeneficio,
        urlFonte: buscaEstadual.urlFonte,
        origem: "legislacao_estadual",
        ressalva: buscaEstadual.ressalva,
      };
      fonte = buscaEstadual.tipobeneficio || "Redução estadual";
    }
  }

  const difalCheio = calcDIFAL(bc, aliq, porDentro);
  if (!temBeneficio) difalOtim = difalCheio;
  const economia = difalCheio - difalOtim;
  const fcpValor = fcp > 0 ? bc * (fcp / 100) : 0;

  const memoria = gerarMemoriaCalculo(
    bc, aliq, temBeneficio ? aliqEfetiva : aliq, porDentro,
    temBeneficio, fonte
  );

  return { difalCheio, difalOtim, economia, temBeneficio, beneficio, aliqEfetiva, fcpValor, memoria };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt(v) {
  return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function classificarNCM(ncm) {
  const p = ncm.slice(0, 4);
  const mapa = {
    "1005":"Milho","1006":"Arroz","1007":"Sorgo","1008":"Outros cereais","1101":"Farinha de trigo","1102":"Farinha de cereais","1103":"Grânulos de cereais","1104":"Grãos trabalhados","1106":"Farinha de leguminosas","1108":"Amidos e féculas","1201":"Soja","1204":"Semente de linhaça","1206":"Semente de girassol","1207":"Sementes oleaginosas","1209":"Sementes p/ semeadura","1214":"Forragens e fenos","1302":"Extratos vegetais","1507":"Óleo de soja","1515":"Óleos vegetais","1516":"Gorduras animais/vegetais","1517":"Margarina","1601":"Embutidos","1701":"Açúcar","1806":"Chocolate","1901":"Preparações de farinha","1902":"Massas alimentícias","1904":"Produtos de cereais","1905":"Produtos de padaria","2005":"Legumes preparados","2007":"Geleias/compotas","2104":"Sopas e caldos","2105":"Sorvetes","2106":"Preparações alimentícias","2201":"Água mineral","2202":"Bebidas não alcoólicas","2203":"Cerveja","2207":"Álcool etílico","2302":"Farelos de cereais","2304":"Farelo de soja","2306":"Farelo de oleaginosas","2308":"Resíduos vegetais","2309":"Preparações p/ animais","2402":"Cigarros","2403":"Outros produtos do fumo","2501":"Sal","2503":"Enxofre","2504":"Grafita","2505":"Areias naturais","2508":"Caulim/argilas","2517":"Cascalho/brita","2518":"Dolomita","2520":"Gesso","2522":"Cal","2530":"Minerais diversos","2710":"Óleos de petróleo","2806":"Ácido clorídrico","2811":"Compostos inorgânicos","2815":"Hidróxido de sódio","2827":"Cloretos","2833":"Sulfatos","2835":"Fosfatos","2836":"Carbonatos","2905":"Álcoois acíclicos","2906":"Álcoois cíclicos","2912":"Aldeídos","2916":"Ácidos carboxílicos","2921":"Compostos amino","2931":"Compostos organomet.","2933":"Compostos heterocíclicos","2936":"Vitaminas","2937":"Hormônios","2942":"Outras substâncias orgânicas","3001":"Glândulas (farmacêutico)","3002":"Sangue/biológicos","3003":"Medicamentos (granel)","3004":"Medicamentos (dose)","3005":"Curativos/ataduras","3006":"Produtos farmacêuticos","3101":"Fertilizante org./vegetal","3102":"Fertilizante nitrogenado","3103":"Fertilizante fosfatado","3104":"Fertilizante potássico","3105":"Adubo misto/complexo","3208":"Tintas e vernizes","3214":"Mastiques","3301":"Óleos essenciais","3302":"Misturas odoríferas","3304":"Cosméticos","3305":"Xampus/capilares","3306":"Higiene bucal","3307":"Desodorantes/barbear","3401":"Sabões","3402":"Detergentes","3505":"Dextrinas/colas","3506":"Colas e adesivos","3507":"Enzimas","3605":"Fósforos","3802":"Carvão ativado","3808":"Agrotóxicos/pesticidas","3822":"Reagentes diagnóstico","3824":"Produtos químicos mistos","3901":"Polietileno","3902":"Polipropileno","3904":"PVC","3906":"Polímeros acrílicos","3909":"Resinas aminadas","3910":"Silicones","3916":"Monofilamentos plásticos","3917":"Tubos plásticos","3919":"Filmes adesivos","3920":"Chapas plásticas","3921":"Outras chapas plásticas","3922":"Artigos sanitários plásticos","3923":"Embalagens plásticas","3924":"Utensílios plásticos","3925":"Plásticos p/ construção","3926":"Outras obras plásticas","4001":"Borracha natural","4011":"Pneumáticos","4012":"Pneumáticos recauchutados","4013":"Câmaras de ar","4015":"Vestuário de borracha","4016":"Outras obras de borracha","4107":"Couro curtido","4115":"Couro reconstituído","4201":"Artigos de selaria","4202":"Malas e bolsas","4203":"Vestuário de couro","4205":"Outros artigos de couro","4401":"Lenha e madeira","4402":"Carvão vegetal","4409":"Madeira perfilada","4411":"Painéis de fibra","4412":"Madeira contraplacada","4417":"Ferramentas de madeira","4419":"Artefatos de madeira","4420":"Marcenaria decorativa","4421":"Obras de madeira","4602":"Cestaria","4801":"Papel jornal","4802":"Papel não revestido","4811":"Papel revestido","4813":"Papel p/ cigarros","4817":"Envelopes","4818":"Papel higiênico","4911":"Impressos","5101":"Lã","5202":"Desperdícios de algodão","5305":"Fibras vegetais","5404":"Monofilamentos sintéticos","5407":"Tecidos sint.","5408":"Tecidos artificiais","5503":"Fibras sintéticas","5603":"Não-tecidos (TNT)","5607":"Cordas sintéticas","5608":"Redes","5609":"Artigos de cordas","5806":"Fitas estreitas","6005":"Tecidos de malha","6101":"Agasalhos masculinos","6103":"Ternos masculinos","6108":"Roupas íntimas","6114":"Roupas de malha","6116":"Luvas de malha","6201":"Agasalhos (tecidos)","6203":"Ternos/calças masc.","6204":"Ternos/saias fem.","6210":"Vestuário especial","6212":"Sutiãs","6216":"Luvas de tecido","6217":"Acessórios de vestuário","6302":"Roupa de cama/mesa","6306":"Toldos e tendas","6307":"Artefatos de tecido","6309":"Roupas usadas","6401":"Calçados impermeáveis","6402":"Calçados plástico/borracha","6403":"Calçados de couro","6405":"Outros calçados","6406":"Partes de calçados","6504":"Chapéus de palha","6505":"Chapéus de malha","6506":"Outros chapéus","6601":"Guarda-chuvas","6804":"Pedras para amolar","6805":"Abrasivos","6806":"Lãs de escória","6810":"Obras de cimento","6912":"Louças de cerâmica","6914":"Cerâmica diversa","7013":"Vidros para mesa","7017":"Vidro de laboratório","7210":"Produtos planos de aço","7214":"Barras de aço","7217":"Fios de aço","7307":"Acessórios p/ tubos","7308":"Construções de aço","7310":"Tanques de aço","7312":"Cordas de aço","7313":"Arame farpado","7314":"Telas de aço","7315":"Correntes de aço","7317":"Pregos e tachas","7318":"Parafusos e porcas","7319":"Agulhas e alfinetes","7321":"Fogões de aço","7323":"Utensílios de aço","7325":"Obras moldadas de ferro","7326":"Outras obras de aço","7604":"Barras de alumínio","7606":"Chapas de alumínio","7608":"Tubos de alumínio","7615":"Utensílios de alumínio","7616":"Obras de alumínio","7806":"Obras de chumbo","7907":"Obras de zinco","8001":"Estanho","8201":"Ferramentas agrícolas manuais","8202":"Serras","8203":"Limas e ferramentas","8204":"Chaves de boca","8205":"Ferramentas diversas","8207":"Ferramentas intercambiáveis","8208":"Facas industriais","8209":"Pastilhas p/ ferramentas","8210":"Aparelhos manuais cozinha","8211":"Facas","8213":"Tesouras","8214":"Cutelaria diversa","8215":"Talheres","8301":"Fechaduras","8302":"Ferragens p/ móveis","8306":"Sinos/campainhas","8308":"Fechos p/ bolsas","8309":"Tampas e cápsulas","8311":"Fios de solda","8412":"Motores hidráulicos","8413":"Bombas p/ líquidos","8414":"Compressores de ar","8417":"Fornos industriais","8418":"Refrigeradores","8419":"Aparelhos térmicos","8420":"Calandras","8421":"Centrifugadores/filtros","8423":"Balanças","8424":"Pulverizadores","8432":"Máquinas p/ solo","8433":"Máquinas de colheita","8434":"Máquinas de ordenha","8435":"Prensas agrícolas","8436":"Equipamentos agrícolas","8437":"Máquinas p/ grãos","8438":"Máquinas alimentícias","8460":"Máquinas de desempenar","8466":"Partes de máq.-ferramenta","8467":"Ferramentas pneumáticas","8479":"Máquinas de uso geral","8481":"Válvulas e torneiras","8483":"Árvores de transmissão","8501":"Motores elétricos","8504":"Transformadores","8506":"Pilhas e baterias","8510":"Aparelhos de barbear","8513":"Lanternas","8515":"Máquinas de solda","8516":"Aparelhos elét. domésticos","8536":"Aparelhos p/ circuitos","8539":"Lâmpadas","8543":"Máquinas elétricas","8544":"Cabos elétricos","8546":"Isoladores elétricos","8714":"Partes de motocicletas","8716":"Reboques","9004":"Óculos","9015":"Instrumentos de topografia","9017":"Instrumentos de medida","9018":"Instrumentos médico-cirúrg.","9020":"Aparelhos respiratórios","9025":"Termômetros","9026":"Instrumentos de fluxo","9030":"Osciloscópios","9031":"Instrumentos de controle","9033":"Partes de instrumentos","9208":"Instrumentos musicais","9401":"Assentos","9403":"Outros móveis","9405":"Aparelhos de iluminação","9503":"Brinquedos","9506":"Artigos esportivos","9507":"Artigos de pesca","9603":"Vassouras e escovas","9604":"Peneiras","9609":"Lápis e giz","9613":"Isqueiros","9615":"Pentes","9617":"Garrafas térmicas","9619":"Fraldas e absorventes",
  };
  return mapa[p] || `NCM ${p}.xx`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════════════════

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#0f172a;min-height:100vh}

.hd{background:#0f172a;padding:16px 24px;border-bottom:2px solid #15803d;display:flex;align-items:center;justify-content:space-between}
.hd-logo{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#4ade80;margin-right:12px;letter-spacing:-1px}
.hd h1{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#fff}
.hd p{font-size:10px;color:#94a3b8;font-family:'JetBrains Mono',monospace;margin-top:1px}
.hd-badge{background:#1e293b;border:1px solid #334155;border-radius:7px;padding:7px 12px;text-align:right}
.hd-badge span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:#4ade80;letter-spacing:1px}
.hd-badge strong{font-family:'JetBrains Mono',monospace;font-size:12px;color:#fff}

.app{max-width:940px;margin:0 auto;padding:20px 12px 60px}

.aviso{background:#fefce8;border:1px solid #fde047;border-radius:9px;padding:11px 14px;margin-bottom:16px;font-size:12px;color:#713f12;line-height:1.5}
.aviso strong{color:#854d0e}

.camadas{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.camada{flex:1;min-width:180px;background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:10px 13px}
.camada .ct{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
.camada .cv{font-size:12px;color:#0f172a;line-height:1.4}
.camada.ativa{border-color:#15803d;background:#f0fdf4}
.camada.ativa .ct{color:#15803d}

.resumo{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:18px}
.rc{background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:12px 14px}
.rc.dest{background:#f0fdf4;border-color:#86efac}
.rc .rl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;font-family:'JetBrains Mono',monospace}
.rc .rv{font-size:16px;font-weight:700;font-family:'JetBrains Mono',monospace}
.rc .rs{font-size:11px;color:#65a30d;margin-top:2px}

.painel{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:20px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.05)}
.abas{display:flex;background:#f1f5f9;border-radius:7px;padding:3px;margin-bottom:18px}
.aba{flex:1;padding:7px 0;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-size:13px;font-family:'Inter',sans-serif;background:transparent;color:#64748b;transition:all .15s}
.aba.on{background:#15803d;color:#fff}

.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:9px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:9px}
label.lbl{display:block;font-size:10px;font-weight:600;color:#374151;margin-bottom:3px;text-transform:uppercase;letter-spacing:.7px}
input,select,textarea{width:100%;padding:8px 10px;border-radius:7px;border:1px solid #d1d5db;font-size:13px;font-family:'Inter',sans-serif;outline:none;background:#fafafa;color:#0f172a;transition:border .12s,box-shadow .12s}
input:focus,select:focus,textarea:focus{border-color:#15803d!important;box-shadow:0 0 0 3px rgba(21,128,61,.10)!important}
textarea{height:110px;resize:vertical;font-family:'JetBrains Mono',monospace;font-size:11px}
.mb8{margin-bottom:8px}.mb14{margin-bottom:14px}
.btn{border:none;border-radius:7px;padding:9px 22px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s}
.btn-p{background:#15803d;color:#fff}.btn-p:hover:not(:disabled){background:#14532d}
.btn-p:disabled{background:#e5e7eb;color:#9ca3af;cursor:not-allowed}
.btn-s{background:transparent;border:1px solid #15803d;color:#15803d}.btn-s:hover{background:#f0fdf4}
.btn-d{background:transparent;border:1px solid #dc2626;color:#dc2626}.btn-d:hover{background:#fee2e2}
.btn-sm{padding:5px 11px;font-size:11px}

.barra{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.barra-ac{display:flex;gap:7px}

/* Cards de resultado */
.cr{background:#fff;border:1px solid #e2e8f0;border-radius:11px;margin-bottom:9px;overflow:hidden}
.cr-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;cursor:pointer;transition:background .1s}
.cr-hd:hover{background:#f8fafc}
.cr-hd.verde{background:#f0fdf4}.cr-hd.verde:hover{background:#dcfce7}
.cr-hd.buscando{background:#f0f9ff}.cr-hd.buscando:hover{background:#e0f2fe}

.idx{background:#1e293b;color:#fff;border-radius:5px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;font-family:'JetBrains Mono',monospace}
.ncm-c{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:13px;color:#0f172a}
.ncm-d{font-size:11px;color:#64748b;margin-top:1px}

.badge{border-radius:999px;padding:2px 8px;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace;white-space:nowrap}
.b-eco{background:#dcfce7;color:#15803d;border:1px solid #86efac}
.b-dupla{background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd}
.b-fora{background:#e0f2fe;color:#0369a1;border:1px solid #7dd3fc}
.b-st{background:#fef9c3;color:#854d0e;border:1px solid #fde047}
.b-fcp{background:#fce7f3;color:#9d174d;border:1px solid #f9a8d4}
.b-busca{background:#e0f2fe;color:#0369a1;border:1px solid #7dd3fc}
.b-estadual{background:#f3e8ff;color:#7e22ce;border:1px solid #d8b4fe}
.b-nacional{background:#dcfce7;color:#15803d;border:1px solid #86efac}

.dv{font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace}
.dr{font-size:10px;color:#94a3b8;text-decoration:line-through;font-family:'JetBrains Mono',monospace}

/* Detalhe expandido */
.det{padding:15px;background:#f8fafc;border-top:1px solid #f1f5f9}
.mg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:11px}
.mc{background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 11px}
.mc .ml{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px;font-family:'JetBrains Mono',monospace}
.mc .mv{font-size:12px;font-weight:600;color:#0f172a}
.mc .mf{font-size:8px;color:#94a3b8;margin-top:2px;font-family:'JetBrains Mono',monospace}
.mc.dupla{background:#ede9fe;border-color:#c4b5fd}
.mc.fora{background:#e0f2fe;border-color:#7dd3fc}

/* Memória de cálculo */
.mem{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:11px}
.mem-title{font-size:11px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.mem-passo{display:flex;gap:10px;margin-bottom:8px;align-items:flex-start}
.mem-n{background:#1e293b;color:#fff;border-radius:4px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;font-family:'JetBrains Mono',monospace;flex-shrink:0;margin-top:1px}
.mem-corpo{flex:1}
.mem-label{font-size:11px;color:#475569;margin-bottom:3px}
.mem-formula{font-family:'JetBrains Mono',monospace;font-size:11px;color:#0f172a;background:#f8fafc;border-radius:4px;padding:4px 8px;white-space:pre-wrap;line-height:1.5}
.mem-resultado{font-size:12px;font-weight:700;color:#15803d;font-family:'JetBrains Mono',monospace;margin-top:3px}
.mem-divider{height:1px;background:#f1f5f9;margin:8px 0}

/* Benefício / alertas */
.al{border-radius:7px;padding:10px 12px;margin-bottom:8px;font-size:12px}
.al-v{background:#f0fdf4;border:1px solid #86efac}
.al-v .at{font-weight:700;font-size:12px;color:#15803d;margin-bottom:4px}
.al-v .ad{color:#14532d;margin-bottom:2px;font-size:12px}
.al-v .abl{font-family:'JetBrains Mono',monospace;font-size:10px;color:#166534;margin-top:3px}
.al-v .avg{font-size:10px;color:#15803d;margin-top:2px;font-style:italic}
.al-c{background:#fff;border:1px solid #e2e8f0;color:#475569}
.al-am{background:#fefce8;border:1px solid #fde047}
.al-am .at{font-weight:700;color:#854d0e;margin-bottom:3px}
.al-am .ad{color:#713f12}
.al-warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;line-height:1.5}
.al-fcp{background:#fce7f3;border:1px solid #f9a8d4;color:#9d174d;line-height:1.5}
.al-estadual{background:#f3e8ff;border:1px solid #d8b4fe}
.al-estadual .at{font-weight:700;color:#7e22ce;margin-bottom:4px;font-size:12px}
.al-estadual .ad{color:#581c87;font-size:12px;margin-bottom:2px}
.al-estadual .abl{font-family:'JetBrains Mono',monospace;font-size:10px;color:#7e22ce;margin-top:3px}
.al-estadual .ar{font-size:10px;color:#9333ea;font-style:italic;margin-top:2px}

/* Comparativo */
.comp{display:flex;gap:16px;margin-top:11px;padding-top:11px;border-top:1px solid #e5e7eb;align-items:flex-end;flex-wrap:wrap}
.ci .cl{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;font-family:'JetBrains Mono',monospace}
.ci .cv{font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace}
.seta{color:#d1d5db;font-size:16px}

/* Estado vazio */
.vazio{text-align:center;padding:44px 20px;color:#94a3b8}
.vazio .vi{font-size:36px;margin-bottom:10px}
.vazio strong{display:block;font-size:14px;font-weight:600;color:#64748b;margin-bottom:4px}
.vazio p{font-size:12px;line-height:1.6}

/* CSV */
.csv-h{background:#f0fdf4;border:1px solid #86efac;border-radius:7px;padding:10px 12px;margin-bottom:11px}
.csv-h .ct{font-weight:700;font-size:12px;color:#15803d;margin-bottom:3px}
.csv-h code{background:#dcfce7;padding:1px 4px;border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#166534}
.csv-h pre{font-family:'JetBrains Mono',monospace;font-size:10px;color:#166534;background:#dcfce7;border-radius:5px;padding:6px 8px;line-height:1.7;margin-top:4px}
.erro{color:#dc2626;font-size:12px;background:#fee2e2;border-radius:5px;padding:6px 10px;margin-bottom:9px}

.spin{display:inline-block;animation:giro 1s linear infinite}
@keyframes giro{to{transform:rotate(360deg)}}
.fonte-tag{display:inline-block;background:#e0f2fe;color:#0369a1;border-radius:4px;padding:1px 6px;font-size:9px;font-family:'JetBrains Mono',monospace;margin-left:4px}
.fonte-tag.nac{background:#dcfce7;color:#15803d}
.fonte-tag.est{background:#f3e8ff;color:#7e22ce}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [modo, setModo] = useState("manual");
  const [form, setForm] = useState({ ncm: "", uf: "", valor: "", descricao: "" });
  const [csvText, setCsvText] = useState("");
  const [csvErro, setCsvErro] = useState("");
  const [items, setItems] = useState([]);
  const [abertos, setAbertos] = useState({});
  const [memAbertos, setMemAbertos] = useState({});

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const podeAnalisar = form.ncm.trim() && form.uf && form.valor && parseFloat(form.valor) > 0;

  // Processa um item: convênio nacional imediato, depois busca estadual se necessário
  const processarItem = useCallback(async (ncm, uf, valor, descricao) => {
    const estado = ESTADOS.find(e => e.uf === uf);
    if (!estado) return null;
    const bc = parseFloat(valor);
    const convenio = analisarConvenioNacional(ncm, uf);
    const id = Date.now() + Math.random();
    const base = {
      id, ncm, uf, valor, bc, descricao,
      classificacao: classificarNCM(ncm),
      estado,
      modalidade: estado.porDentro ? "por dentro (base dupla)" : "por fora (base simples)",
      convenio,
      buscaEstadual: null,
      status: convenio.encontrou ? "ok" : "buscando",
    };

    // Resultado preliminar com convênio nacional (ou cheio)
    const resNacional = calcularResultado(bc, estado, convenio, null);
    return { ...base, ...resNacional };
  }, []);

  const buscarEstadual = useCallback(async (item) => {
    const { ncm, uf, estado, descricao } = item;
    try {
      const buscaEstadual = await consultarLegislacaoEstadual(ncm, uf, estado.nome, estado.aliq, descricao);
      const res = calcularResultado(item.bc, estado, item.convenio, buscaEstadual);
      return { ...item, ...res, buscaEstadual, status: "ok" };
    } catch (e) {
      return { ...item, status: "erro", erroMsg: e.message };
    }
  }, []);

  const adicionarManual = async () => {
    if (!podeAnalisar) return;
    const ncm = form.ncm.trim();
    const { uf, valor, descricao } = form;
    setForm({ ncm: "", uf: "", valor: "", descricao: "" });

    const item = await processarItem(ncm, uf, valor, descricao);
    if (!item) return;
    setItems(p => [...p, item]);
    setAbertos(p => ({ ...p, [item.id]: true }));

    if (item.status === "buscando") {
      const itemFinal = await buscarEstadual(item);
      setItems(p => p.map(i => i.id === item.id ? itemFinal : i));
    }
  };

  const processarCSV = async () => {
    setCsvErro("");
    const linhas = csvText.trim().split("\n").map(l => l.trim()).filter(l => l && !l.toLowerCase().startsWith("ncm"));
    if (!linhas.length) { setCsvErro("Nenhuma linha válida."); return; }

    const pendentes = [];
    for (const linha of linhas) {
      const [ncm, uf, valor, ...desc] = linha.split(";").map(c => c.trim());
      if (!ncm || !uf || !valor) { setCsvErro(`Linha inválida: "${linha}"`); return; }
      const ufUp = uf.toUpperCase();
      if (!ESTADOS.find(e => e.uf === ufUp)) { setCsvErro(`UF inválida: "${uf}"`); return; }
      const item = await processarItem(ncm, ufUp, valor.replace(",", "."), desc.join(" "));
      if (item) pendentes.push(item);
    }

    setItems(p => [...p, ...pendentes]);
    setCsvText("");

    // Buscar estadual para os que precisam (sequencial para não sobrecarregar)
    for (const item of pendentes) {
      if (item.status === "buscando") {
        const itemFinal = await buscarEstadual(item);
        setItems(p => p.map(i => i.id === item.id ? itemFinal : i));
      }
    }
  };

  const toggle = (id) => setAbertos(p => ({ ...p, [id]: !p[id] }));
  const toggleMem = (id) => setMemAbertos(p => ({ ...p, [id]: !p[id] }));
  const limpar = () => { setItems([]); setAbertos({}); setMemAbertos({}); };

  const exportarCSV = () => {
    const cab = ["#","NCM","Produto","UF","Modalidade","Alíq.Int%","DIFAL Cheio","DIFAL Otimizado","Economia","FCP","Tem Benefício","Tipo Benefício","Base Legal","Fonte","URL Fonte","Ressalva"].join(";");
    const linhas = items.filter(i => i.status === "ok").map((it, idx) => [
      idx + 1, it.ncm, `"${it.classificacao}"`, it.uf,
      `"${it.modalidade}"`, it.estado.aliq,
      it.difalCheio?.toFixed(2), it.difalOtim?.toFixed(2),
      it.economia?.toFixed(2), it.fcpValor?.toFixed(2),
      it.temBeneficio ? "Sim" : "Não",
      `"${it.beneficio?.tipo || ""}"`,
      `"${it.beneficio?.baseLegal || ""}"`,
      `"${it.beneficio?.origem === "legislacao_estadual" ? "Legislação Estadual (IA+web)" : it.beneficio?.origem === "convenio_nacional" ? "Convênio Nacional" : "—"}"`,
      `"${it.beneficio?.urlFonte || ""}"`,
      `"${it.beneficio?.ressalva || "Confirmar com contador ou SEFAZ."}"`,
    ].join(";"));
    const blob = new Blob(["\uFEFF" + [cab, ...linhas].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `DIFAL_OFazendeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const { totalCheio, totalOtim, totalEcon, totalFCP, nBenef } = useMemo(() => {
    const ok = items.filter(i => i.status === "ok");
    return {
      totalCheio: ok.reduce((a, i) => a + (i.difalCheio || 0), 0),
      totalOtim: ok.reduce((a, i) => a + (i.difalOtim || 0), 0),
      totalEcon: ok.reduce((a, i) => a + (i.economia || 0), 0),
      totalFCP: ok.reduce((a, i) => a + (i.fcpValor || 0), 0),
      nBenef: ok.filter(i => i.temBeneficio).length,
    };
  }, [items]);

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>

      <div className="hd">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="hd-logo">OF</div>
          <div>
            <h1>Calculadora DIFAL — 3 Camadas de Análise</h1>
            <p>O FAZENDEIRO LTDA · SETE LAGOAS MG · MG → CONSUMIDOR FINAL NÃO CONTRIBUINTE · ALÍQ.INTER. 12%</p>
          </div>
        </div>
        <div className="hd-badge">
          <span>METODOLOGIA</span>
          <strong>Conv. Nacional → Busca Estadual</strong>
        </div>
      </div>

      <div className="app">

        {/* Explicação das camadas */}
        <div className="camadas">
          <div className="camada ativa">
            <div className="ct">⚡ Camada 1 — Imediato</div>
            <div className="cv">Convênios nacionais CONFAZ hard-coded. Conv.52/91 (implementos agrícolas — DIFAL zero). Resultado instantâneo, sem IA.</div>
          </div>
          <div className="camada">
            <div className="ct">🔍 Camada 2 — Busca estadual</div>
            <div className="cv">Se não há convênio nacional: IA busca na SEFAZ do estado destino e nos RICMSs. Cita fonte e URL. 10–20s por consulta.</div>
          </div>
          <div className="camada">
            <div className="ct">📐 Camada 3 — Memória de cálculo</div>
            <div className="cv">Todo resultado mostra passo a passo: BC, gross-up, alíquotas, benefício aplicado, FCP. Auditável e exportável.</div>
          </div>
        </div>

        <div className="aviso">
          <strong>Importante:</strong> Convênios nacionais são hard-coded e auditáveis. Benefícios estaduais são encontrados via web search em tempo real — cite a URL e confirme com contador ou SEFAZ antes de emitir NF-e. Conv.100/97 e Conv.87/2002 <strong>não se aplicam</strong> a DIFAL de consumidor final PF.
        </div>

        {/* Resumo */}
        {items.some(i => i.status === "ok") && (
          <div className="resumo">
            <div className="rc"><div className="rl">Análises</div><div className="rv" style={{ color: "#1e293b" }}>{items.filter(i => i.status === "ok").length}</div></div>
            <div className="rc"><div className="rl">DIFAL Cheio</div><div className="rv" style={{ color: "#dc2626" }}>{fmt(totalCheio)}</div></div>
            <div className="rc"><div className="rl">DIFAL Otimizado</div><div className="rv" style={{ color: "#2563eb" }}>{fmt(totalOtim)}</div></div>
            <div className="rc dest">
              <div className="rl">Economia Total</div>
              <div className="rv" style={{ color: "#15803d" }}>{fmt(totalEcon)}</div>
              <div className="rs">{nBenef} benefício{nBenef !== 1 ? "s" : ""} · FCP {fmt(totalFCP)}</div>
            </div>
          </div>
        )}

        {/* Entrada */}
        <div className="painel">
          <div className="abas">
            {[["manual","✏️  Venda Única"],["lote","📋  Lote via CSV"]].map(([id, lb]) => (
              <button key={id} className={`aba${modo === id ? " on" : ""}`} onClick={() => setModo(id)}>{lb}</button>
            ))}
          </div>

          {modo === "manual" && (
            <div>
              <div className="g3 mb8">
                <div><label className="lbl">NCM *</label><input placeholder="Ex: 8424.41.00" value={form.ncm} onChange={f("ncm")} maxLength={10} /></div>
                <div>
                  <label className="lbl">UF Destino *</label>
                  <select value={form.uf} onChange={f("uf")}>
                    <option value="">Selecione...</option>
                    {ESTADOS.map(e => <option key={e.uf} value={e.uf}>{e.uf} — {e.nome} ({e.aliq}%{e.fcp > 0 ? ` +${e.fcp}%FCP` : ""})</option>)}
                  </select>
                </div>
                <div><label className="lbl">Valor (R$) *</label><input type="number" placeholder="Ex: 450.00" value={form.valor} onChange={f("valor")} min="0" step="0.01" /></div>
              </div>
              <div className="mb14">
                <label className="lbl">Descrição <span style={{ fontWeight: 400, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>(ajuda a busca estadual)</span></label>
                <input placeholder="Ex: Pulverizador costal 20L para uso agrícola" value={form.descricao} onChange={f("descricao")} />
              </div>
              <button className="btn btn-p" onClick={adicionarManual} disabled={!podeAnalisar}>🔍 Analisar DIFAL</button>
            </div>
          )}

          {modo === "lote" && (
            <div>
              <div className="csv-h">
                <div className="ct">Formato CSV</div>
                <div style={{ fontSize: 12, color: "#166534", marginBottom: 4 }}>Cada linha: <code>NCM;UF;Valor;Descrição</code></div>
                <pre>{"8424.41.00;GO;1200.00;Pulverizador agrícola manual\n3004.90.71;RJ;74.00;Medicamento veterinário bovinos\n8201.10.00;SP;85.00;Enxada de cabo longo\n2309.10.00;MT;350.00;Ração para cães e gatos"}</pre>
              </div>
              {csvErro && <div className="erro">⚠️ {csvErro}</div>}
              <textarea value={csvText} onChange={e => { setCsvText(e.target.value); setCsvErro(""); }} placeholder={"8424.41.00;GO;1200.00;Pulverizador\n3004.90.71;SP;74.00;Medicamento"} />
              <button className="btn btn-p" style={{ marginTop: 9 }} onClick={processarCSV} disabled={!csvText.trim()}>📤 Processar Lote</button>
            </div>
          )}
        </div>

        {/* Resultados */}
        {items.length > 0 && (
          <div>
            <div className="barra">
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {items.length} item{items.length !== 1 ? "s" : ""} · <span style={{ color: "#15803d", fontWeight: 600 }}>{nBenef} com benefício</span>
                {items.some(i => i.status === "buscando") && <span style={{ color: "#0369a1", marginLeft: 8 }}>· <span className="spin">⏳</span> buscando legislação estadual...</span>}
              </div>
              <div className="barra-ac">
                {items.some(i => i.status === "ok") && <button className="btn btn-s btn-sm" onClick={exportarCSV}>⬇️ Exportar CSV</button>}
                <button className="btn btn-d btn-sm" onClick={limpar}>🗑️ Limpar</button>
              </div>
            </div>

            {items.map((item, idx) => {
              if (item.status === "erro") return (
                <div key={item.id} className="cr">
                  <div className="cr-hd"><span className="idx">{idx + 1}</span><div style={{ marginLeft: 8, fontSize: 12, color: "#dc2626" }}>❌ Erro: {item.ncm} → {item.uf} — {item.erroMsg}</div></div>
                </div>
              );

              const open = abertos[item.id];
              const memOpen = memAbertos[item.id];
              const buscando = item.status === "buscando";
              const { temBeneficio, difalCheio, difalOtim, economia, beneficio, convenio, fcpValor, memoria, estado } = item;
              const isDupla = item.modalidade?.includes("dupla");
              const isFonteEstadual = beneficio?.origem === "legislacao_estadual";
              const isFonteNacional = beneficio?.origem === "convenio_nacional";

              return (
                <div key={item.id} className="cr">
                  <div className={`cr-hd${temBeneficio ? " verde" : buscando ? " buscando" : ""}`} onClick={() => toggle(item.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div className="idx">{idx + 1}</div>
                      <div>
                        <div className="ncm-c">
                          NCM {item.ncm} → {item.uf}
                          {isFonteNacional && <span className="fonte-tag nac">Conv.Nacional</span>}
                          {isFonteEstadual && <span className="fonte-tag est">Legisl.Estadual</span>}
                          {buscando && <span className="fonte-tag">🔍 buscando...</span>}
                        </div>
                        <div className="ncm-d">{item.classificacao}{item.descricao ? ` · ${item.descricao}` : ""} · {fmt(item.bc)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {temBeneficio && <span className="badge b-eco">💰 −{fmt(economia)}</span>}
                      {item.convenio?.st?.aplicavel && <span className="badge b-st">ST</span>}
                      {estado.fcp > 0 && <span className="badge b-fcp">FCP {estado.fcp}%</span>}
                      {!buscando && <span className={`badge ${isDupla ? "b-dupla" : "b-fora"}`}>{isDupla ? "base dupla" : "base simples"}</span>}
                      {!buscando && (
                        <div style={{ textAlign: "right" }}>
                          <div className="dv" style={{ color: temBeneficio ? "#15803d" : "#0f172a" }}>{fmt(difalOtim)}</div>
                          {temBeneficio && <div className="dr">{fmt(difalCheio)}</div>}
                        </div>
                      )}
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>{open ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {open && !buscando && (
                    <div className="det">
                      {/* Mini cards info */}
                      <div className="mg">
                        <div className="mc"><div className="ml">Produto</div><div className="mv" style={{ fontSize: 11 }}>{item.classificacao}</div></div>
                        <div className="mc"><div className="ml">Alíq. Interna</div><div className="mv" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{estado.aliq}%{estado.fcp > 0 ? ` + ${estado.fcp}% FCP` : ""}</div></div>
                        <div className={`mc ${isDupla ? "dupla" : "fora"}`}>
                          <div className="ml">Modalidade DIFAL</div>
                          <div className="mv" style={{ color: isDupla ? "#6d28d9" : "#0369a1", fontSize: 11 }}>{item.modalidade}</div>
                          <div className="mf">{isDupla ? "gross-up: BC÷(1−ad)" : "DIFAL = BC×(ad−12%)"}</div>
                        </div>
                      </div>

                      {/* Alertas convênio */}
                      {convenio.alertas?.map((al, i) => (
                        <div key={i} className="al al-warn">{al}</div>
                      ))}

                      {/* Alerta ST */}
                      {convenio.st?.aplicavel && (
                        <div className="al al-am">
                          <div className="at">⚠️ Substituição Tributária</div>
                          <div className="ad">{convenio.st.obs}</div>
                        </div>
                      )}

                      {/* Benefício */}
                      {temBeneficio && beneficio && (
                        <div className={`al ${isFonteEstadual ? "al-estadual" : "al-v"}`}>
                          <div className="at">
                            {isFonteEstadual ? "🔎 Benefício Estadual Encontrado (IA + Web Search)" : "✅ Convênio Nacional Confirmado"}
                          </div>
                          <div className="ad"><strong>Tipo:</strong> {beneficio.tipo}</div>
                          {beneficio.descricao && <div className="ad">{beneficio.descricao}</div>}
                          {beneficio.baseLegal && <div className="abl">📋 {beneficio.baseLegal}</div>}
                          {beneficio.urlFonte && (
                            <div className="abl">🔗 <a href={beneficio.urlFonte} target="_blank" rel="noopener noreferrer" style={{ color: isFonteEstadual ? "#7e22ce" : "#166534" }}>{beneficio.urlFonte}</a></div>
                          )}
                          {beneficio.vigencia && <div className="avg">⏳ Vigência: {beneficio.vigencia}</div>}
                          {beneficio.ressalva && <div className="ar">⚠️ {beneficio.ressalva}</div>}
                        </div>
                      )}

                      {!temBeneficio && (
                        <div className="al al-c">
                          ℹ️ Nenhum benefício identificado {item.buscaEstadual?.status === "nao_encontrado" ? "— busca estadual realizada, nenhuma isenção específica encontrada para este NCM neste estado." : "— nenhum convênio nacional aplicável."} DIFAL calculado pela alíquota cheia ({estado.aliq}%).
                        </div>
                      )}

                      {/* FCP */}
                      {estado.fcp > 0 && (
                        <div className="al al-fcp">
                          💰 <strong>FCP — Fundo de Combate à Pobreza:</strong> {estado.uf} cobra {estado.fcp}% sobre a BC do DIFAL. Valor: <strong>{fmt(fcpValor)}</strong>. Recolher separadamente via GNRE.
                        </div>
                      )}

                      {/* Memória de cálculo */}
                      <div className="mem">
                        <div className="mem-title" style={{ cursor: "pointer" }} onClick={() => toggleMem(item.id)}>
                          📐 Memória de Cálculo {memOpen ? "▲" : "▼"}
                        </div>
                        {memOpen && memoria && (
                          <div>
                            {memoria.map((passo, i) => (
                              <div key={i}>
                                {i > 0 && <div className="mem-divider" />}
                                <div className="mem-passo">
                                  <div className="mem-n">{passo.n}</div>
                                  <div className="mem-corpo">
                                    <div className="mem-label">{passo.label}</div>
                                    <div className="mem-formula">{passo.formula}</div>
                                    <div className="mem-resultado">= {fmt(passo.resultado)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {estado.fcp > 0 && (
                              <div>
                                <div className="mem-divider" />
                                <div className="mem-passo">
                                  <div className="mem-n">+</div>
                                  <div className="mem-corpo">
                                    <div className="mem-label">FCP — Fundo de Combate à Pobreza ({estado.fcp}%)</div>
                                    <div className="mem-formula">{`FCP = BC × ${estado.fcp}% = ${fmt(item.bc)} × ${estado.fcp / 100} = ${fmt(fcpValor)}`}</div>
                                    <div className="mem-resultado">= {fmt(fcpValor)}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {!memOpen && (
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>Clique para expandir o passo a passo do cálculo</div>
                        )}
                      </div>

                      {/* Comparativo final */}
                      <div className="comp">
                        <div className="ci"><div className="cl">BC</div><div className="cv" style={{ color: "#64748b", fontSize: 15 }}>{fmt(item.bc)}</div></div>
                        <div className="seta">→</div>
                        <div className="ci"><div className="cl">DIFAL Cheio</div><div className="cv" style={{ color: "#64748b", fontSize: 15 }}>{fmt(difalCheio)}</div></div>
                        {temBeneficio && <>
                          <div className="seta">→</div>
                          <div className="ci"><div className="cl" style={{ color: "#15803d" }}>DIFAL c/ Benefício</div><div className="cv" style={{ color: "#15803d", fontSize: 15 }}>{fmt(difalOtim)}</div></div>
                          <div className="ci"><div className="cl" style={{ color: "#7c3aed" }}>Economia</div><div className="cv" style={{ color: "#7c3aed", fontSize: 15 }}>{fmt(economia)}</div></div>
                        </>}
                        {estado.fcp > 0 && <div className="ci"><div className="cl" style={{ color: "#9d174d" }}>+ FCP</div><div className="cv" style={{ color: "#9d174d", fontSize: 15 }}>{fmt(fcpValor)}</div></div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {items.length === 0 && (
          <div className="vazio">
            <div className="vi">📦</div>
            <strong>Nenhuma análise ainda</strong>
            <p>
              Informe NCM, estado destino e valor.<br />
              <strong>Convênio nacional</strong> → resultado imediato.<br />
              <strong>Sem convênio</strong> → busca automaticamente na legislação estadual via IA + web search.<br />
              <strong>Memória de cálculo</strong> → passo a passo expansível em cada resultado.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
