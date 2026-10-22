/* =====================================================================
   Victor Latif · Nutricionista Clínico & Esportivo — configuração
   Único arquivo que precisa ser editado para o site sair do modo de
   demonstração e entrar no ar de verdade.
   Fonte: Instagram @victorlatif.oficial e bio.site/victorlatif.nutri
   (coletados em 22/10/2026). O que não estava lá: "A CONFIRMAR".
   ===================================================================== */

window.TV = {

  /* ---- Profissional ------------------------------------------------ */
  nome:        'Victor Latif · Nutricionista',
  nomeCurto:   'Victor Latif',
  slogan:      'Nutricionista Clínico & Esportivo',
  instagram:   'victorlatif.oficial',
  prefixoDemo: 'vl_',   // chaves da demo no navegador (agenda.js, demo.js e admin.js usam o mesmo)
  logo:        'assets/marca.svg',

  // CRN: A CONFIRMAR. Um post de 31/08/2026 parece mostrar "CRN-5 24126",
  // mas a imagem é pequena. Só preencher depois que o Victor confirmar.
  crn: '',

  // textos que o motor (agenda.js) usa
  textoPreco: 'Valor no WhatsApp',   // valor da consulta: A CONFIRMAR (nada inventado)
  rotServico: 'Consulta',
  textoSite:  'Marquei minha consulta pelo site do Victor.',
  contatoTxt: 'chame o Victor no WhatsApp',

  // Link de WhatsApp da bio (wa.me/message: abre a conversa, mas não aceita
  // texto pronto; o site copia o resumo para colar). Número: A CONFIRMAR.
  // Com o número (55 + DDD + número, só dígitos) em "whatsapp", o resumo
  // passa a ir já escrito.
  whatsappLink:    'https://wa.me/message/JOFDRP4GDZAZM1',
  whatsapp:        '',
  whatsappVisivel: '',

  outrosPerfis: [
    { rede: 'Instagram', arroba: '@victorlatif.oficial', url: 'https://www.instagram.com/victorlatif.oficial/' },
    { rede: 'Instagram', arroba: '@vlatif.nutri',        url: 'https://www.instagram.com/vlatif.nutri/' },
    { rede: 'TikTok',    arroba: '@vlatifnutri',         url: 'https://www.tiktok.com/@vlatifnutri' },
    { rede: 'Threads',   arroba: '@vlatif.nutri',        url: 'https://www.threads.net/@vlatif.nutri' }
  ],

  // Cidade e endereço do consultório: A CONFIRMAR (o perfil não diz).
  endereco: {
    linha1: 'Consultório: endereço a confirmar',
    linha2: 'Cidade a confirmar',
    maps:   '',
    embed:  '',
    busca:  ''
  },
  funcionamento: 'On-line para todo o Brasil e presencial com hora marcada',

  /* ---- Supabase ---------------------------------------------------
     Vazios = MODO DEMONSTRAÇÃO (tudo funciona, mas fica no navegador).
  ------------------------------------------------------------------ */
  supabaseUrl: '',
  supabaseKey: '',

  regras: { passoMin: 30, antecedenciaMin: 120, janelaDias: 30, cancelamentoH: 12 },
  semPreferencia: false,
  semEtapa3: true,     // o agendamento daqui não usa a etapa "projeto" do motor

  /* ---- Expediente (0 = domingo) — A CONFIRMAR -------------------- */
  expediente: {
    0: { aberto: false },
    1: { aberto: true, abre: '07:00', fecha: '20:00', pausa: ['12:00', '14:00'] },
    2: { aberto: true, abre: '07:00', fecha: '20:00', pausa: ['12:00', '14:00'] },
    3: { aberto: true, abre: '07:00', fecha: '20:00', pausa: ['12:00', '14:00'] },
    4: { aberto: true, abre: '07:00', fecha: '20:00', pausa: ['12:00', '14:00'] },
    5: { aberto: true, abre: '07:00', fecha: '20:00', pausa: ['12:00', '14:00'] },
    6: { aberto: true, abre: '08:00', fecha: '12:00' }
  },

  /* ---- Profissional (um só: a etapa "com quem" some sozinha) ------- */
  artistas: [
    { slug: 'victor', nome: 'Victor Latif', apelido: 'Victor', instagram: 'victorlatif.oficial', whatsapp: '',
      foto: 'fotos/perfil.jpg', oficio: 'Nutricionista', linha: 'Nutricionista Clínico & Esportivo',
      estilos: ['Nutrição clínica', 'Nutrição esportiva', 'Fitoterapia', 'Antropometria'] }
  ],

  /* ---- Modalidades (1ª escolha do agendamento) ---------------------
     dias: dias da semana em que a modalidade atende (0 = domingo).
     Presencial só em alguns dias: provisório, A CONFIRMAR.
  ------------------------------------------------------------------ */
  modalidades: [
    { id: 'online',     nome: 'On-line',    linha: 'Por vídeo, de qualquer lugar do Brasil', dias: [1,2,3,4,5,6] },
    { id: 'presencial', nome: 'Presencial', linha: 'No consultório, com avaliação física completa', dias: [1,3,5] }
  ],

  /* ---- Objetivos (2ª escolha do agendamento) ----------------------- */
  objetivos: [
    { id: 'emagrecer',   nome: 'Emagrecer sem sofrer',           icone: '↘' },
    { id: 'performance', nome: 'Render mais no esporte',         icone: '⚡' },
    { id: 'massa',       nome: 'Ganhar massa muscular',          icone: '↗' },
    { id: 'saude',       nome: 'Saúde, exames e doenças',        icone: '✚' },
    { id: 'relacao',     nome: 'Melhorar a relação com a comida', icone: '◎' },
    { id: 'retencao',    nome: 'Desinchar / retenção',           icone: '≈' },
    { id: 'todos',       nome: 'Ainda não sei',                  icone: '?' }
  ],

  /* ---- Consultas = serviços do motor -------------------------------
     preco_centavos 0 = valor A CONFIRMAR (o site mostra textoPreco).
     Durações (60 min a 1ª, 30 min o retorno): A CONFIRMAR.
     sem_projeto: pula a etapa 3 do motor (a pré-anamnese vai junto dos dados).
  ------------------------------------------------------------------ */
  servicosDemo: [
    { id:'primeira-online', nome:'1ª consulta on-line', categoria:'Primeira consulta', modalidade:'online', tipo:'primeira',
      descricao:'Anamnese completa, plano alimentar e acompanhamento', preco_centavos:0, a_partir_de:false, duracao_min:60,
      sem_projeto:true, dias:[1,2,3,4,5,6] },
    { id:'primeira-presencial', nome:'1ª consulta presencial', categoria:'Primeira consulta', modalidade:'presencial', tipo:'primeira',
      descricao:'Anamnese, antropometria completa e plano alimentar', preco_centavos:0, a_partir_de:false, duracao_min:60,
      sem_projeto:true, dias:[1,3,5] },
    { id:'retorno-online', nome:'Retorno on-line', categoria:'Retorno', modalidade:'online', tipo:'retorno',
      descricao:'Para quem já é paciente: ajuste do plano', preco_centavos:0, a_partir_de:false, duracao_min:30,
      sem_projeto:true, dias:[1,2,3,4,5,6] },
    { id:'retorno-presencial', nome:'Retorno presencial', categoria:'Retorno', modalidade:'presencial', tipo:'retorno',
      descricao:'Para quem já é paciente: novas medidas e ajuste do plano', preco_centavos:0, a_partir_de:false, duracao_min:30,
      sem_projeto:true, dias:[1,3,5] }
  ],

  /* ---- Especialidades (especialidades.html e capa) ------------------
     Da bio.site ("nutrição clínica, esportiva, fitoterapia e
     antropometria") e das legendas/destaques. Textos curtos e gerais:
     A CONFIRMAR com o Victor.
  ------------------------------------------------------------------ */
  especialidades: [
    { id:'clinica', nome:'Nutrição clínica', curto:'Clínica', fonte:'Bio e bio.site', objetivo:'saude',
      resumo:'Alimentação pensada para a sua saúde: exames, rotina, histórico e o que o seu corpo precisa agora.',
      paraQuem:['Quem tem exames alterados ou alguma condição de saúde','Quem quer comer melhor sem viver de dieta','Quem precisa de um plano que caiba na rotina real'],
      como:'Na consulta o Victor olha seus exames, seu histórico e seus hábitos. O plano nasce disso, com alimentos de verdade e não só calorias.' },
    { id:'esportiva', nome:'Nutrição esportiva', curto:'Esportiva', fonte:'Bio e destaques "Cross" e "FTV"', objetivo:'performance',
      resumo:'Comer para treinar melhor e recuperar mais rápido: do Cross ao futevôlei, do iniciante a quem compete.',
      paraQuem:['Praticantes de Cross, futevôlei, musculação e corrida','Quem quer ganhar massa ou definir sem perder rendimento','Quem treina pesado e sente que falta energia'],
      como:'O plano considera seus treinos, horários e objetivo: o que comer antes, durante e depois, e como ajustar nos dias de competição.',
      modalidades:['Cross','Futevôlei','Musculação','Corrida'] },
    { id:'emagrecimento', nome:'Emagrecimento sustentável', curto:'Emagrecimento', fonte:'Legendas ("2kg por mês NÃO é fracasso")', objetivo:'emagrecer',
      resumo:'Perder peso sem fome, sem terrorismo alimentar e sem efeito sanfona. Constância vale mais que pressa.',
      paraQuem:['Quem já começou dieta na segunda e parou na sexta','Quem quer emagrecer comendo volume, sem passar fome','Quem cansou do efeito sanfona'],
      como:'Metas realistas, trocas inteligentes e acompanhamento de perto. Doce não é proibido: o plano tem espaço para ele.' },
    { id:'relacao', nome:'Relação com a comida', curto:'Relação com a comida', fonte:'Bio ("mudando sua relação com a comida") e legendas', objetivo:'relacao',
      resumo:'Comer sem culpa e se enxergar com mais gentileza. Nem tudo é sobre o corpo: muito é sobre como você aprendeu a se ver.',
      paraQuem:['Quem vive no ciclo restrição e exagero','Quem se olha no espelho e só vê defeito','Quem quer leveza para comer, sem regras absurdas'],
      como:'Conversa franca, um plano flexível e combinados possíveis. O objetivo é você conseguir seguir, não ser perfeito.' },
    { id:'fitoterapia', nome:'Fitoterapia', curto:'Fitoterapia', fonte:'bio.site', objetivo:'retencao',
      resumo:'Plantas medicinais e chás como aliados do plano, sempre com indicação individual e segura.',
      paraQuem:['Quem sente retenção de líquidos e inchaço','Quem quer apoio natural no sono, digestão ou disposição','Quem quer usar chás com orientação de verdade'],
      como:'Quando faz sentido para o seu caso, o Victor inclui fitoterápicos no plano, com dose, horário e tempo de uso.' },
    { id:'antropometria', nome:'Antropometria', curto:'Antropometria', fonte:'bio.site', objetivo:'massa',
      resumo:'Medidas que mostram o que a balança esconde: circunferências, dobras e composição corporal.',
      paraQuem:['Quem quer acompanhar gordura e massa magra, não só o peso','Atletas e praticantes que querem números de verdade','Quem precisa ver a evolução para continuar motivado'],
      como:'Na consulta presencial: peso, circunferências e dobras cutâneas. A cada retorno, a evolução fica registrada e comparada.' }
  ],

  /* ---- Perguntas frequentes (consulta.html) -------------------------
     Respostas a partir das legendas do Instagram. A CONFIRMAR.
  ------------------------------------------------------------------ */
  faq: [
    ['Posso comer doce na dieta?', 'Pode sim. O problema não é comer um doce: é transformar o doce em motivo para desistir de todo o planejamento. O plano já prevê espaço para ele.'],
    ['Perder só 2 kg por mês é pouco?', 'Não é fracasso. 2 kg por mês são 24 kg no ano, de um jeito sustentável e sem efeito sanfona. Resultado rápido demais costuma voltar rápido também.'],
    ['Como evitar o efeito sanfona?', 'Com um plano que funcione na sua vida de verdade, e não uma dieta absurda que dura uma semana. Metas realistas, comida de verdade e acompanhamento nos retornos.'],
    ['Vou passar fome?', 'Não. Dá para aumentar o volume das refeições com trocas inteligentes, sem extrapolar nas calorias. Comer mais e continuar emagrecendo é possível.'],
    ['A consulta on-line funciona igual?', 'Sim: anamnese, plano e acompanhamento são os mesmos. A diferença é a avaliação física, que no on-line usa as medidas que você mesmo tira com orientação, e no presencial é feita pelo Victor.'],
    ['Preciso levar exames?', 'Se tiver exames de sangue recentes (até uns 6 meses), leve ou mande antes. Se não tiver, o Victor avalia na consulta se vale pedir.'],
    ['Retenção de líquidos tem solução?', 'Tem, e começa com escolhas simples no dia a dia: água na medida certa, chás aliados, atividade física e boas escolhas alimentares.'],
    ['E se eu sair do plano no fim de semana?', 'Faz parte. Ninguém é perfeito, e o plano não exige isso. O importante é voltar na refeição seguinte, sem culpa e sem "começar de novo na segunda".'],
    ['De quanto em quanto tempo é o retorno?', 'Em geral, a cada 30 dias, para medir de novo e ajustar o plano. O intervalo exato o Victor combina com você na primeira consulta.']
  ]
};

window.TV.barbeirosDemo = window.TV.artistas.map(function (a) {
  return { id: a.slug, slug: a.slug, nome: a.nome, foto: a.foto, instagram: a.instagram,
           whatsapp: a.whatsapp, cargo: a.linha };
});
window.TV.artistaPor = function (chave) {
  return window.TV.artistas.filter(function (a) {
    return a.slug === chave || a.nome === chave || a.instagram === chave;
  })[0] || null;
};
window.TV.servicoPor = function (id) {
  return window.TV.servicosDemo.filter(function (s) { return s.id === id || s.nome === id; })[0] || null;
};
window.TV.modalidadePor = function (id) {
  return window.TV.modalidades.filter(function (m) { return m.id === id; })[0] || null;
};
// local do atendimento (calendário .ics): on-line vira "link pelo WhatsApp"
window.TV.localDe = function (servicoNome) {
  return /on-line/i.test(servicoNome || '') ? 'On-line (o link chega pelo WhatsApp)'
    : window.TV.endereco.linha1 + ', ' + window.TV.endereco.linha2;
};
window.TV.modoDemo = !(window.TV.supabaseUrl && window.TV.supabaseKey);
