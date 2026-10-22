/* =====================================================================
   Victor Latif — dados de EXEMPLO do modo demonstração.
   Só roda com o Supabase desligado. Pacientes fictícios, marcados
   "(exemplo)": nomes, medidas, anamneses e planos inventados só para
   mostrar o CRM funcionando. Nenhum preço: o valor da consulta fica
   vazio ("a confirmar") em Ajustes.
   Grava duas coisas no navegador (prefixo vl_):
   - vl_agendamentos_demo  consultas (o mesmo formato do motor agenda.js)
   - vl_crm                pacientes/leads, medidas, anamnese, plano, notas
   Carrega depois de config.js e antes de agenda.js / admin.js.
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.TV;
  if (!CFG || !CFG.modoDemo) return;
  var PFX = CFG.prefixoDemo || 'vl_';
  var VERSAO = PFX + 'semeado_v5';
  try { if (localStorage.getItem(VERSAO)) return; } catch (e) { return; }

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function min(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function hora(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function criado(off, h) { var d = new Date(); d.setDate(d.getDate() + off); d.setHours(h || 10, 15, 0, 0); return d.toISOString(); }
  var HOJE = iso(new Date());

  // dia válido para a modalidade, perto de "off" dias a partir de hoje
  function dia(off, mod) {
    var dias = (CFG.modalidadePor(mod) || {}).dias || [1, 2, 3, 4, 5, 6];
    var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off);
    for (var i = 0; i < 7 && dias.indexOf(d.getDay()) < 0; i++) d.setDate(d.getDate() + (off < 0 ? -1 : 1));
    return iso(d);
  }

  /* ---- pacientes ----------------------------------------------------
     c: consultas [dias a partir de hoje, hora, modalidade]; a primeira é a 1ª consulta.
     m: medidas por consulta realizada [peso, %gordura, cintura, quadril, braço, coxa]
  ------------------------------------------------------------------ */
  var P = [
    { n: 'Juliana Prado', sx: 'F', id: 34, alt: 164, org: 'Instagram', et: 'ativo', obj: 'emagrecer', mod: 'presencial', esp: 'Musculação 3x',
      c: [[-118, '08:00'], [-90, '08:00'], [-61, '08:30'], [-33, '08:00'], [-3, '08:00'], [4, '08:00']],
      m: [[82.4, 34.1, 92, 108, 31, 61], [80.1, 32.8, 89.5, 106.5, 30.5, 60], [78.3, 31.5, 87, 105, 30, 59], [76.6, 30.2, 85, 103.5, 29.5, 58.5], [74.9, 29.0, 83, 102, 29, 57.5]],
      q: 'Quer emagrecer sem passar fome. Já fez várias dietas restritivas e sempre voltou o peso.',
      plano: 'Café: pão integral + ovos mexidos + fruta\nLanche: iogurte natural + aveia\nAlmoço: prato "metade salada", arroz + feijão, proteína\nLanche da tarde: fruta + castanhas (antes do treino)\nJantar: omelete de legumes ou sopa com frango\nLivre: 1 doce por dia (até ~150 kcal), sem culpa\nÁgua: 2,6 L/dia',
      notas: [[-33, 'Relatou menos beliscos à noite. Ajustei o lanche da tarde para antes do treino.'], [-3, 'Bateu −7,5 kg desde o início. Quer manter o ritmo até o fim do ano.']] },
    { n: 'Rafael Monteiro', sx: 'M', id: 29, alt: 178, org: 'Indicação', et: 'ativo', obj: 'performance', mod: 'presencial', esp: 'Cross 5x',
      c: [[-96, '18:00'], [-68, '18:00'], [-40, '17:30'], [-12, '18:00'], [1, '18:00']],
      m: [[84.0, 18.5, 86, 99, 36, 58], [84.6, 17.2, 85, 99, 36.8, 58.5], [85.1, 16.4, 84.5, 99.5, 37.4, 59], [85.8, 15.6, 84, 100, 38, 59.5]],
      q: 'Treina Cross 5x por semana e sente falta de energia nos WODs da noite. Quer ganhar massa sem perder rendimento.',
      plano: 'Pré-treino (16h30): banana + pasta de amendoim + café\nPós-treino: shake de whey + fruta, jantar em até 1h\nCarboidrato maior no almoço e no jantar dos dias de treino pesado\nDia de competição: protocolo separado (ver anotação)\nÁgua: 3 L/dia + 500 ml por hora de treino',
      notas: [[-40, 'Competição em 6 semanas. Montado protocolo do dia de prova.'], [-12, 'Ganhou 1,8 kg com queda de gordura. Rendimento melhor nos WODs.']] },
    { n: 'Bruna Teixeira', sx: 'F', id: 26, alt: 168, org: 'Instagram', et: 'ativo', obj: 'performance', mod: 'online', esp: 'Futevôlei 4x',
      c: [[-64, '07:30'], [-34, '07:30'], [-6, '07:00'], [1, '07:30']],
      m: [[63.0, 24.0, 70, 96, 27, 55], [62.4, 23.1, 69, 95.5, 27, 54.5], [62.1, 22.4, 68.5, 95, 27.5, 54.5]],
      q: 'Joga futevôlei 4x por semana, sente cãibras e cansaço no fim dos jogos de sábado.',
      plano: 'Hidratação com reposição de sódio nos jogos longos\nLanche pré-jogo leve (fruta + torrada)\nRefeição de recuperação até 1h depois\nÁgua: 2,2 L/dia + reposição nos jogos',
      notas: [[-6, 'Sem cãibras nas últimas 3 semanas.']] },
    { n: 'Larissa Andrade', sx: 'F', id: 31, alt: 160, org: 'TikTok', et: 'ativo', obj: 'relacao', mod: 'online', esp: 'Caminhada',
      c: [[-70, '19:00'], [-41, '19:00'], [-2, '19:00'], [5, '19:00']],
      m: [[71.2, 31.0, 82, 104, 29, 58], [70.6, 30.4, 81, 103, 29, 57.5], [69.8, 29.7, 80, 102.5, 28.5, 57]],
      q: 'Vive no ciclo restrição e exagero. Se olha no espelho e só vê defeito. Quer comer sem culpa.',
      plano: 'Sem contagem de calorias nesta fase\nTrês refeições principais + dois lanches, sem pular\nDoce combinado: depois do almoço, sem compensar\nDiário de fome e saciedade (escala 0–10)',
      notas: [[-41, 'Relata menos episódios de compulsão. Seguir sem contagem de calorias.'], [-2, 'Primeira semana sem "começar de novo na segunda".']] },
    { n: 'Marcos Vieira', sx: 'M', id: 47, alt: 175, org: 'Google', et: 'ativo', obj: 'saude', mod: 'presencial', esp: 'Sedentário',
      c: [[-130, '09:00'], [-100, '09:00'], [-69, '09:30'], [-38, '09:00']],
      m: [[96.5, 30.2, 108, 110, 35, 60], [94.8, 29.4, 105, 109, 34.5, 59.5], [93.6, 28.6, 103, 108, 34.5, 59], [92.7, 28.0, 101.5, 107.5, 34, 58.5]],
      q: 'Glicemia de jejum alterada nos últimos exames. Médico pediu acompanhamento nutricional.',
      plano: 'Fibras em todas as refeições\nTroca de pão branco por integral\nJantar com proteína + legumes, carboidrato menor\nCaminhada de 20 min depois do jantar\nReavaliar exames em 90 dias',
      notas: [[-38, 'Exames novos: glicemia de jejum melhorou. Pedir retorno com hemoglobina glicada.']] },
    { n: 'Patrícia Lemos', sx: 'F', id: 38, alt: 162, org: 'Indicação', et: 'ativo', obj: 'retencao', mod: 'online', esp: 'Pilates 2x',
      c: [[-63, '14:00'], [-33, '14:30']],
      m: [[68.4, 29.5, 78, 101, 28, 57], [67.2, 29.0, 76, 100, 28, 56.5]],
      q: 'Sente muito inchaço no fim do dia e depois do fim de semana.',
      plano: 'Água: 2,4 L/dia, distribuída\nChá de hibisco à tarde (fitoterapia, 30 dias)\nReduzir ultraprocessados no fim de semana\nPotássio: fruta em 3 refeições',
      notas: [[-33, 'Inchaço bem menor. Fitoterápico por mais 30 dias.']] },
    { n: 'Thiago Ramos', sx: 'M', id: 24, alt: 181, org: 'Instagram', et: 'ativo', obj: 'massa', mod: 'presencial', esp: 'Musculação 5x',
      c: [[-55, '17:00'], [-27, '17:00']],
      m: [[72.0, 14.0, 78, 94, 32, 54], [73.4, 14.2, 78.5, 94.5, 33, 55]],
      q: 'Treina há 1 ano e não consegue ganhar peso. Pula refeições por falta de tempo.',
      plano: 'Cinco refeições com proteína em todas\nShake prático para os dias corridos\nCarboidrato no pré e no pós-treino',
      notas: [] },
    { n: 'Camila Duarte', sx: 'F', id: 27, alt: 170, org: 'Instagram', et: 'ativo', obj: 'emagrecer', mod: 'online', esp: 'Beach tennis 2x',
      c: [[-58, '16:00'], [-29, '16:00'], [0, '16:00']],
      m: [[69.8, 28.4, 79, 101, 28, 57], [68.5, 27.6, 77.5, 100, 28, 56.5]],
      q: 'Quer secar para o verão sem cortar o happy hour de sexta.',
      plano: 'Café reforçado com proteína\nAlmoço livre com prato montado (metade salada)\nHappy hour: combinado de 2 drinks + petisco de proteína\nÁgua: 2,4 L/dia',
      notas: [[-29, 'Retenção menor depois que regularizou a água.']] },
    { n: 'Bruno Carvalho', sx: 'M', id: 35, alt: 183, org: 'Google', et: 'ativo', obj: 'saude', mod: 'presencial', esp: 'Sedentário',
      c: [[-47, '10:00']],
      m: [[101.3, 31.5, 109, 112, 36, 62]],
      q: 'Colesterol alto e muito cansaço à tarde.', plano: 'Fibras e gorduras boas; trocar refrigerante por água com gás e limão', notas: [] },
    { n: 'Mariana Lopes', sx: 'F', id: 41, alt: 161, org: 'TikTok', et: 'inativo', obj: 'relacao', mod: 'online', esp: '',
      c: [[-88, '20:00']], m: [[66.0, 30.0, 76, 99, 27, 56]],
      q: 'Come escondido e sente culpa depois.', plano: 'Plano sem contagem, foco em regularidade', notas: [[-88, 'Não respondeu os lembretes de retorno.']] },
    { n: 'Ana Beatriz Lima', sx: 'F', id: 23, alt: 163, org: 'Site', et: 'ativo', obj: 'emagrecer', mod: 'online', esp: 'Dança 2x',
      c: [[-16, '19:00'], [14, '19:00']], m: [[71.5, 30.8, 80, 102, 28.5, 58]],
      q: 'Quer emagrecer sem largar o docinho depois do almoço.', plano: 'Plano com doce combinado no almoço; jantar leve com proteína', notas: [] },
    { n: 'Felipe Santos', sx: 'M', id: 31, alt: 179, org: 'Indicação', et: 'ativo', obj: 'performance', mod: 'presencial', esp: 'Futevôlei 3x',
      c: [[-9, '17:00']], m: [[82.3, 19.4, 88, 99, 35, 58]],
      q: 'Indicado pelo Rafael (exemplo). Quer mais fôlego no futevôlei.', plano: 'Pré-jogo com carboidrato de fácil digestão; reposição de sódio', notas: [] },
    { n: 'Fernanda Costa', sx: 'F', id: 42, alt: 158, org: 'Instagram', et: 'inativo', obj: 'emagrecer', mod: 'online', esp: 'Não treina',
      c: [[-140, '20:00'], [-110, '19:30'], [-76, '20:00']],
      m: [[88.0, 38.0, 98, 114, 33, 63], [86.2, 37.1, 96, 112, 32.5, 62], [85.5, 36.8, 95, 111.5, 32.5, 62]],
      q: 'Quer emagrecer para ter mais disposição com os filhos.',
      plano: 'Plano de 3 refeições + 1 lanche, receitas rápidas',
      notas: [[-76, 'Mudança de emprego, ficou de remarcar.']] },
    { n: 'Diego Martins', sx: 'M', id: 33, alt: 176, org: 'TikTok', et: 'inativo', obj: 'performance', mod: 'presencial', esp: 'Corrida',
      c: [[-95, '07:00'], [-62, '07:00']],
      m: [[77.0, 17.0, 84, 97, 33, 56], [76.1, 16.2, 83, 96.5, 33, 56]],
      q: 'Preparação para meia maratona.', plano: 'Periodização do carboidrato por volume de treino', notas: [] },
    { n: 'Gabriela Nunes', sx: 'F', id: 28, alt: 166, org: 'Site', et: 'marcada', obj: 'emagrecer', mod: 'online', esp: 'Musculação 3x',
      c: [[1, '18:30']], m: [],
      q: 'Belisco muito à noite e já tentei várias dietas.', viaSite: true,
      pre: ['Atividade física: 3x ou mais', 'Esporte: Musculação', 'Dieta antes: Já, e voltou tudo', 'Peso aproximado: 74 kg', 'Altura: 166 cm', 'O que atrapalha: belisco muito à noite e já tentei várias dietas'] },
    { n: 'Lucas Ferreira', sx: 'M', id: 30, alt: 174, org: 'Site', et: 'marcada', obj: 'performance', mod: 'presencial', esp: 'Cross 4x',
      c: [[3, '17:30']], m: [],
      q: 'Quer melhorar o rendimento no Cross e entender suplementação.', viaSite: true,
      pre: ['Atividade física: 3x ou mais', 'Esporte: Cross', 'Dieta antes: Nunca', 'Condição de saúde / medicação: Não', 'O que atrapalha: treino cedo e fico sem energia'] },
    { n: 'Renata Oliveira', sx: 'F', id: 36, org: 'Instagram', et: 'conversa', obj: 'emagrecer', mod: 'online', criado: -3,
      q: 'Chamou no Direct depois do post "2kg por mês não é fracasso".', c: [], m: [] },
    { n: 'Pedro Henrique', sx: 'M', id: 22, org: 'TikTok', et: 'conversa', obj: 'performance', mod: 'presencial', criado: -4, esp: 'Futevôlei',
      q: 'Joga futevôlei e quer perder barriga sem perder força.', c: [], m: [] },
    { n: 'Isabela Freitas', sx: 'F', org: 'Instagram', et: 'novo', obj: 'relacao', mod: 'online', criado: 0,
      q: 'Respondeu o story do "espelho": quer ajuda com autoimagem.', c: [], m: [] },
    { n: 'Carolina Mendes', sx: 'F', org: 'Indicação', et: 'novo', obj: 'emagrecer', mod: 'presencial', criado: -1,
      q: 'Indicada pela Juliana (exemplo).', c: [], m: [] },
    { n: 'Vinícius Alves', sx: 'M', org: 'Google', et: 'novo', obj: 'saude', mod: 'online', criado: -2,
      q: 'Colesterol alto, procurou "nutricionista on-line" no Google.', c: [], m: [] },
    { n: 'Aline Souza', sx: 'F', org: 'Instagram', et: 'perdido', obj: 'emagrecer', mod: 'online', criado: -26,
      q: 'Pediu informações e não respondeu depois de dois contatos.', motivo: 'Parou de responder', c: [], m: [] }
  ];

  var ocupado = {}, ags = [], pacs = [], n = 0;
  function encaixa(d, ini, dur, mod) {
    for (var t = 0; t < 8; t++) {
      var livre = !(ocupado[d] || []).some(function (o) { return ini < o[1] && ini + dur > o[0]; });
      if (livre) break;
      ini += 30;
    }
    (ocupado[d] = ocupado[d] || []).push([ini, ini + dur]);
    return ini;
  }
  function nomeServ(tipo, mod) { return (tipo === 'primeira' ? '1ª consulta ' : 'Retorno ') + (mod === 'online' ? 'on-line' : 'presencial'); }

  P.forEach(function (p, i) {
    var tel = '719000000' + String(10 + i);
    var nome = p.n + ' (exemplo)';
    var consultas = [];
    p.c.forEach(function (c, k) {
      var d = dia(c[0], p.mod), tipo = k === 0 ? 'primeira' : 'retorno', dur = tipo === 'primeira' ? 60 : 30;
      var ini = encaixa(d, min(c[1]), dur);
      n++;
      var status = d < HOJE ? 'concluido' : 'confirmado';
      var obs = p.viaSite ? ['Modalidade: ' + (p.mod === 'online' ? 'On-line' : 'Presencial'),
        'Objetivo: ' + (CFG.objetivos.filter(function (o) { return o.id === p.obj; })[0] || {}).nome].concat(p.pre || []).join('\n') : '';
      ags.push({ codigo: 'EX' + String(1000 + n), barbeiro_id: 'victor', barbeiro: 'Victor Latif',
        servico: nomeServ(tipo, p.mod), preco_centavos: 0, nome: nome, telefone: tel, dia: d,
        inicio: hora(ini), fim: hora(ini + dur), obs: obs, status: status, anexos: [], exemplo: true,
        origem: p.viaSite ? 'site' : 'painel', criado_em: p.viaSite ? criado(-1, 21) : criado(c[0] - 3) });
      consultas.push({ dia: d, status: status });
    });
    // uma falta no histórico (relatório e agenda mostram)
    if (p.n === 'Thiago Ramos') {
      var df = dia(-13, 'presencial'); n++;
      ags.push({ codigo: 'EX' + String(1000 + n), barbeiro_id: 'victor', barbeiro: 'Victor Latif', servico: 'Retorno presencial',
        preco_centavos: 0, nome: nome, telefone: tel, dia: df, inicio: '17:00', fim: '17:30', obs: '', status: 'faltou',
        anexos: [], exemplo: true, origem: 'painel', criado_em: criado(-45) });
    }
    var feitas = consultas.filter(function (c) { return c.status === 'concluido'; });
    var medidas = p.m.map(function (v, k) {
      return { data: feitas[k] ? feitas[k].dia : HOJE, peso: v[0], gordura: v[1], cintura: v[2], quadril: v[3], braco: v[4], coxa: v[5] };
    });
    var criadoEm = p.c.length ? criado(p.c[0][0] - (p.viaSite ? 1 : 6)) : criado(p.criado || 0);
    var primeiraData = p.c.length ? dia(p.c[0][0], p.mod) : null;
    pacs.push({
      id: 'p' + (i + 1), nome: nome, telefone: tel, sexo: p.sx, idade: p.id || null, altura: p.alt || null,
      origem: p.org, etapa: p.et, etapaEm: p.c.length ? criado(Math.min(0, p.c[p.c.length - 1][0])) : criadoEm,
      criado: criadoEm, objetivo: p.obj, modalidade: p.mod, esporte: p.esp || '',
      motivo: p.motivo || '', retornoDias: 30, exemplo: true, medidas: medidas,
      anamnese: {
        queixa: p.q || '',
        rotina: p.c.length > 1 ? 'Trabalha em horário comercial; refeições fora de casa no almoço.' : '',
        sono: p.c.length > 1 ? '6 a 7 horas, acorda cansado(a) às vezes' : '',
        agua: p.c.length > 1 ? 'Menos de 1,5 L por dia no início' : '',
        intestino: p.c.length > 1 ? 'Regular' : '',
        saude: p.obj === 'saude' ? 'Pré-diabetes (glicemia de jejum alterada)' : (p.c.length > 1 ? 'Sem doenças relatadas' : ''),
        medicamentos: p.obj === 'saude' ? 'Metformina (prescrição médica)' : '',
        alergias: '', preferencias: p.c.length > 1 ? 'Não gosta de peixe; ama doce depois do almoço' : '',
        exames: p.obj === 'saude' ? 'Glicemia de jejum e perfil lipídico (trazidos na 1ª consulta)' : ''
      },
      plano: p.plano ? { texto: p.plano, atualizado: feitas.length ? feitas[feitas.length - 1].dia : HOJE } : { texto: '', atualizado: '' },
      notas: (p.notas || []).map(function (x) { return { data: dia(x[0], p.mod), texto: x[1] }; }),
      primeira: primeiraData
    });
  });

  var bloqueios = [
    { id: 'b1', barbeiro_id: 'victor', data: dia(9, 'online'), hora_inicio: '00:00', hora_fim: '23:59', motivo: 'Congresso de nutrição esportiva (exemplo)' },
    { id: 'b2', barbeiro_id: 'victor', data: dia(2, 'online'), hora_inicio: '07:00', hora_fim: '09:00', motivo: 'Treino de futevôlei (exemplo)' }
  ];
  var crm = { pacientes: pacs, ajustes: { valorPrimeira: '', valorRetorno: '', retornoDias: 30 } };
  try {
    localStorage.setItem(PFX + 'agendamentos_demo', JSON.stringify(ags));
    localStorage.setItem(PFX + 'bloqueios_demo', JSON.stringify(bloqueios));
    localStorage.setItem(PFX + 'crm', JSON.stringify(crm));
    localStorage.removeItem(PFX + 'artistas_demo');
    localStorage.setItem(PFX + 'demo_semeado_v1', '1');
    localStorage.setItem(VERSAO, '1');
  } catch (e) {}
})();
