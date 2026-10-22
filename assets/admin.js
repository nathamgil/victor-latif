/* =====================================================================
   Painel do Victor Latif — CRM de nutrição
   Visão geral · Funil (Novo → Em conversa → Consulta marcada → Paciente
   ativo → Inativo / Perdido) · Pacientes (ficha com anamnese, evolução
   com gráfico, plano, consultas, anotações) · Agenda semanal com
   bloqueios · Retornos/follow-up · Relatório do mês · Ajustes.
   Demo: lê e grava no localStorage (prefixo vl_), o mesmo que o motor
   do site usa. Quem marca pelo site entra no funil sozinho.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.TV || {};
  var PFX = CFG.prefixoDemo || 'vl_';
  var K_AG = PFX + 'agendamentos_demo', K_BL = PFX + 'bloqueios_demo', K_CRM = PFX + 'crm';

  var SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  var SEM_C = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var ETAPAS = [
    { id: 'novo',     nome: 'Novo' },
    { id: 'conversa', nome: 'Em conversa' },
    { id: 'marcada',  nome: 'Consulta marcada' },
    { id: 'ativo',    nome: 'Paciente ativo' },
    { id: 'inativo',  nome: 'Inativo' },
    { id: 'perdido',  nome: 'Perdido' }
  ];
  var ORIGENS = ['Instagram', 'Indicação', 'Site', 'TikTok', 'Google', 'WhatsApp', 'Outro'];
  var METRICAS = [
    { id: 'peso', nome: 'Peso', un: 'kg' }, { id: 'gordura', nome: '% gordura', un: '%' },
    { id: 'cintura', nome: 'Cintura', un: 'cm' }, { id: 'quadril', nome: 'Quadril', un: 'cm' },
    { id: 'braco', nome: 'Braço', un: 'cm' }, { id: 'coxa', nome: 'Coxa', un: 'cm' }
  ];

  /* ---------------- utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function minutos(t) { var p = String(t).split(':'); return (+p[0]) * 60 + (+p[1]); }
  function deMin(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function hoje() { return iso(new Date()); }
  function soma(s, n) { var d = deIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function difDias(a, b) { return Math.round((deIso(b) - deIso(a)) / 86400000); }
  function curto(s) { var d = deIso(s); return SEM_C[d.getDay()] + ' ' + d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
  function dm(s) { var d = deIso(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
  function relativo(s) { var h = hoje(); return s === h ? 'Hoje' : s === soma(h, 1) ? 'Amanhã' : curto(s); }
  function telFmt(t) { var d = String(t || '').replace(/\D/g, ''); return d.length === 11 ? '(' + d.slice(0, 2) + ') ' + d[2] + ' ' + d.slice(3, 7) + '-' + d.slice(7) : (t || '—'); }
  function num(v, c) { return v == null || v === '' || isNaN(v) ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: c || 0, maximumFractionDigits: c == null ? 1 : c }); }
  function primeiroNome(n) { return String(n || '').replace(/\s*\(exemplo\)/, '').split(' ')[0]; }
  function semExemplo(n) { return String(n || '').replace(/\s*\(exemplo\)/, ''); }
  function iniciais(n) { return semExemplo(n).split(/\s+/).slice(0, 2).map(function (p) { return p[0] || ''; }).join('').toUpperCase(); }
  function lsLe(k, pad) { try { return JSON.parse(localStorage.getItem(k) || pad); } catch (e) { return JSON.parse(pad); } }
  function lsGrava(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function aviso(cx, cls, txt) { cx.innerHTML = ''; cx.appendChild(el('div', 'aviso ' + cls, txt)); }
  function nomeEtapa(id) { return (ETAPAS.filter(function (e) { return e.id === id; })[0] || {}).nome || id; }
  function nomeObj(id) { return (CFG.objetivos.filter(function (o) { return o.id === id; })[0] || {}).nome || 'A definir'; }
  function ehOnline(a) { return /on-line/i.test(a.servico || ''); }
  function ehPrimeira(a) { return /1ª/.test(a.servico || ''); }
  function tagMod(mod) { return el('span', 'tag ' + (mod === 'online' ? 'tag-on' : 'tag-pr'), mod === 'online' ? 'On-line' : 'Presencial'); }

  /* ---------------- dados ---------------- */
  var ags = [], bloqueios = [], crm = { pacientes: [], ajustes: {} };
  function carrega() {
    ags = lsLe(K_AG, '[]').filter(function (a) { return !a.barbeiro_id || a.barbeiro_id === 'victor'; });
    bloqueios = lsLe(K_BL, '[]');
    crm = lsLe(K_CRM, '{"pacientes":[],"ajustes":{}}');
    crm.pacientes = crm.pacientes || [];
    crm.ajustes = Object.assign({ valorPrimeira: '', valorRetorno: '', retornoDias: 30 }, crm.ajustes || {});
    sincroniza();
  }
  function grava() { lsGrava(K_CRM, crm); }
  function gravaAgs() {
    // preserva consultas de outro profissional (não há, mas o motor é compartilhado)
    lsGrava(K_AG, ags);
  }

  // quem marcou pelo site e ainda não está no CRM entra como "Consulta marcada"
  function sincroniza() {
    var mudou = false;
    ags.forEach(function (a) {
      if (a.status === 'cancelado') return;
      var p = pacPorTel(a.telefone);
      if (!p) {
        var linhas = String(a.obs || '').split('\n'), objNome = '', relato = [];
        linhas.forEach(function (l) {
          if (/^Objetivo: /.test(l)) objNome = l.slice(10);
          else if (!/^Modalidade: /.test(l)) relato.push(l);
        });
        var obj = CFG.objetivos.filter(function (o) { return o.nome === objNome; })[0];
        p = {
          id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          nome: a.nome, telefone: a.telefone, origem: 'Site', etapa: 'marcada', etapaEm: a.criado_em || new Date().toISOString(),
          criado: a.criado_em || new Date().toISOString(), objetivo: obj ? obj.id : 'todos', modalidade: ehOnline(a) ? 'online' : 'presencial',
          esporte: '', retornoDias: crm.ajustes.retornoDias, anamnese: { queixa: relato.join('\n') }, plano: { texto: '', atualizado: '' },
          notas: [{ data: hoje(), texto: 'Entrou pelo agendamento do site (código ' + a.codigo + ').' }], medidas: []
        };
        crm.pacientes.push(p); mudou = true;
      } else if ((p.etapa === 'novo' || p.etapa === 'conversa' || p.etapa === 'perdido') && a.status === 'confirmado' && a.dia >= hoje()) {
        p.etapa = 'marcada'; p.etapaEm = new Date().toISOString(); mudou = true;
      }
    });
    if (mudou) grava();
  }

  function pacPorTel(t) { var d = String(t || '').replace(/\D/g, ''); return crm.pacientes.filter(function (p) { return p.telefone === d; })[0] || null; }
  function pacPorId(id) { return crm.pacientes.filter(function (p) { return p.id === id; })[0] || null; }
  function consultasDe(p) { return ags.filter(function (a) { return a.telefone === p.telefone; }).sort(function (a, b) { return (a.dia + a.inicio) < (b.dia + b.inicio) ? -1 : 1; }); }
  function feitasDe(p) { return consultasDe(p).filter(function (a) { return a.status === 'concluido'; }); }
  function ultimaDe(p) { var f = feitasDe(p); return f.length ? f[f.length - 1] : null; }
  function proximaDe(p) { var h = hoje(); return consultasDe(p).filter(function (a) { return a.status === 'confirmado' && a.dia >= h; })[0] || null; }
  function medidasDe(p) { return (p.medidas || []).slice().sort(function (a, b) { return a.data < b.data ? -1 : 1; }); }
  function retornoPrevisto(p) { var u = ultimaDe(p); return u ? soma(u.dia, +(p.retornoDias || crm.ajustes.retornoDias || 30)) : null; }

  /* ---------------- mensagens prontas ---------------- */
  function mensagem(p, tipo) {
    var n = primeiroNome(p.nome), prox = proximaDe(p);
    var t = {
      novo: 'Oi, ' + n + '! Aqui é o Victor Latif, nutricionista. Vi que você se interessou pela consulta 😊 Me conta: qual é o seu objetivo hoje?',
      conversa: 'Oi, ' + n + '! Separei os horários livres desta semana. Atendo on-line (para todo o Brasil) e presencial. Qual fica melhor para você? Também dá para marcar direto pelo site.',
      marcada: prox ? 'Oi, ' + n + '! Passando para confirmar sua consulta ' + relativo(prox.dia).toLowerCase() + ' às ' + prox.inicio + ' (' + (ehOnline(prox) ? 'on-line: te mando o link aqui antes' : 'presencial') + '). Se tiver exames recentes, pode trazer. Até lá!'
        : 'Oi, ' + n + '! Tudo certo para a sua consulta? Qualquer coisa me chama aqui.',
      ativo: 'Oi, ' + n + '! Como estão as coisas com o plano? Lembra: sem desistências. Se travou em alguma parte, me conta aqui que a gente ajusta.',
      inativo: 'Oi, ' + n + ', tudo bem? Faz um tempinho da nossa última consulta. Que tal um retorno para medir de novo e ajustar o plano? Tenho horários esta semana.',
      perdido: 'Oi, ' + n + '! Passando só para dizer que a porta segue aberta. Quando quiser começar, sem dieta sofrida, é só me chamar.',
      retorno: 'Oi, ' + n + '! Já faz ' + (ultimaDe(p) ? difDias(ultimaDe(p).dia, hoje()) + ' dias' : 'um tempo') + ' da sua última consulta. Bora marcar o retorno para medir a evolução e ajustar o plano? Me diz o melhor dia que eu reservo.'
    };
    return t[tipo] || t.ativo;
  }
  var dlgMsg = $('#dlg-msg');
  function abreMensagem(p, tipo) {
    $('#msg-tit').textContent = tipo === 'retorno' ? 'Lembrete de retorno' : 'Mensagem · ' + nomeEtapa(tipo);
    $('#msg-para').textContent = 'Para ' + semExemplo(p.nome) + ' · ' + telFmt(p.telefone);
    $('#msg-txt').value = mensagem(p, tipo);
    $('#msg-ok').textContent = '';
    atualizaZap(p);
    $('#msg-txt').oninput = function () { atualizaZap(p); };
    dlgMsg.showModal();
  }
  function atualizaZap(p) { $('#msg-zap').href = 'https://wa.me/55' + p.telefone + '?text=' + encodeURIComponent($('#msg-txt').value); }
  $('#msg-copiar').addEventListener('click', function () {
    var t = $('#msg-txt').value;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { $('#msg-ok').textContent = 'Copiado.'; }, function () {});
    else { $('#msg-txt').select(); $('#msg-ok').textContent = 'Selecionado: Ctrl+C para copiar.'; }
  });
  $('#msg-fechar').addEventListener('click', function () { dlgMsg.close(); });

  /* ---------------- abas ---------------- */
  var aba = 'geral';
  function irAba(a) {
    aba = a;
    $$('.adm-aba').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-aba') === a ? 'true' : 'false'); });
    $$('.adm-painel').forEach(function (s) { if (s.getAttribute('data-painel') === a) s.setAttribute('data-ativa', ''); else s.removeAttribute('data-ativa'); });
    pinta();
    window.scrollTo({ top: 0 });
  }
  $$('.adm-aba').forEach(function (b) { b.addEventListener('click', function () { irAba(b.getAttribute('data-aba')); }); });
  $$('[data-ir]').forEach(function (b) { b.addEventListener('click', function () { irAba(b.getAttribute('data-ir')); }); });

  function pinta() {
    carrega();
    $('#bolha-novos').textContent = crm.pacientes.filter(function (p) { return p.etapa === 'novo'; }).length || '';
    $('#bolha-ret').textContent = paraChamar(25).length || '';
    ({ geral: pintaGeral, funil: pintaFunil, pacientes: pintaPacientes, agenda: pintaAgenda,
       retornos: pintaRetornos, relatorio: pintaRelatorio, ajustes: pintaAjustes })[aba]();
  }

  /* ---------------- visão geral ---------------- */
  function inicioSemana(d) { var x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
  function kpi(cx, rot, n, sub) {
    var k = el('div', 'kpi');
    k.appendChild(el('div', 'k-rot', rot)); k.appendChild(el('div', 'k-num', String(n))); k.appendChild(el('div', 'k-sub', sub));
    cx.appendChild(k);
  }
  function taxaRetorno() {
    // de quem fez a 1ª consulta há mais tempo que o intervalo de retorno, quantos voltaram (ou já marcaram)
    var com1 = 0, com2 = 0;
    crm.pacientes.forEach(function (p) {
      var f = feitasDe(p);
      if (!f.length || difDias(f[0].dia, hoje()) < +(p.retornoDias || 30)) return;
      var todas = consultasDe(p).filter(function (a) { return a.status !== 'cancelado' && a.status !== 'faltou'; });
      com1++;
      if (todas.length >= 2) com2++;
    });
    return [com1 ? Math.round(com2 / com1 * 100) : 0, com2, com1];
  }
  function pintaGeral() {
    var h = hoje(), d = new Date();
    $('#geral-tit').textContent = SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
    var ini = iso(inicioSemana(d)), fim = soma(ini, 6);
    var sem = ags.filter(function (a) { return a.dia >= ini && a.dia <= fim && a.status !== 'cancelado'; });
    var on = sem.filter(ehOnline).length;
    var novos = crm.pacientes.filter(function (p) { return p.criado && p.criado.slice(0, 10) >= soma(h, -7) && ['novo', 'conversa', 'marcada'].indexOf(p.etapa) >= 0; });
    var cx = $('#kpis'); cx.innerHTML = '';
    kpi(cx, 'Consultas na semana', sem.length, on + ' on-line · ' + (sem.length - on) + ' presencial');
    kpi(cx, 'Novos leads', novos.length, 'nos últimos 7 dias');
    kpi(cx, 'Retornos vencendo', paraChamar(23).length, 'sem horário marcado');
    var tr = taxaRetorno();
    kpi(cx, 'Taxa de retorno', tr[0] + '%', tr[1] + ' de ' + tr[2] + ' pacientes voltaram');

    var lh = $('#lista-hoje'); lh.innerHTML = '';
    var doDia = ags.filter(function (a) { return a.dia === h && a.status !== 'cancelado'; }).sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; });
    if (!doDia.length) {
      var prox = ags.filter(function (a) { return a.dia > h && a.status === 'confirmado'; }).sort(function (a, b) { return (a.dia + a.inicio) < (b.dia + b.inicio) ? -1 : 1; })[0];
      lh.appendChild(el('p', 'vazio', 'Nenhuma consulta hoje.' + (prox ? ' Próxima: ' + relativo(prox.dia) + ' às ' + prox.inicio + ' com ' + primeiroNome(prox.nome) + '.' : '')));
    }
    doDia.forEach(function (a) { lh.appendChild(linhaConsulta(a)); });

    var ln = $('#lista-novos'); ln.innerHTML = '';
    var abertos = crm.pacientes.filter(function (p) { return p.etapa === 'novo' || p.etapa === 'conversa'; });
    if (!abertos.length) ln.appendChild(el('p', 'vazio', 'Nenhum lead esperando resposta.'));
    abertos.slice(0, 5).forEach(function (p) {
      var b = el('div', 'linha');
      var meio = el('button', 'meio'); meio.type = 'button'; meio.style.textAlign = 'left';
      meio.appendChild(el('b', null, p.nome)); meio.appendChild(el('span', null, nomeEtapa(p.etapa) + ' · ' + p.origem + ' · ' + nomeObj(p.objetivo)));
      meio.addEventListener('click', function () { abreFicha(p.id); });
      b.appendChild(meio);
      var z = el('button', 'btn-ic', 'WhatsApp'); z.type = 'button';
      z.addEventListener('click', function () { abreMensagem(p, p.etapa); });
      b.appendChild(z);
      ln.appendChild(b);
    });

    var lr = $('#lista-ret-geral'); lr.innerHTML = '';
    var pc = paraChamar(23);
    if (!pc.length) lr.appendChild(el('p', 'vazio', 'Ninguém atrasado. 👏'));
    pc.slice(0, 4).forEach(function (x) { lr.appendChild(linhaRetorno(x)); });

    var mf = $('#mini-funil'); mf.innerHTML = '';
    var bh = el('div', 'barras-h'), maxi = 1;
    var cont = ETAPAS.map(function (e) { var c = crm.pacientes.filter(function (p) { return p.etapa === e.id; }).length; maxi = Math.max(maxi, c); return [e.nome, c]; });
    cont.forEach(function (c) { bh.appendChild(barra(c[0], c[1], maxi)); });
    mf.appendChild(bh);
  }
  function barra(rot, v, maxi, txt) {
    var l = el('div', 'bh'); l.appendChild(el('span', null, rot));
    var t = el('div', 'bh-trilho'), i = el('i'); i.style.width = (maxi ? v / maxi * 100 : 0) + '%'; t.appendChild(i); l.appendChild(t);
    l.appendChild(el('b', null, txt != null ? txt : String(v)));
    return l;
  }
  function linhaConsulta(a) {
    var b = el('button', 'linha'); b.type = 'button';
    b.appendChild(el('span', 'hora', a.inicio));
    var m = el('span', 'meio'); m.appendChild(el('b', null, a.nome)); m.appendChild(el('span', null, a.servico + (a.status === 'concluido' ? ' · realizada' : a.status === 'faltou' ? ' · faltou' : '')));
    b.appendChild(m);
    var f = el('span', 'fim'); f.appendChild(tagMod(ehOnline(a) ? 'online' : 'presencial')); b.appendChild(f);
    b.addEventListener('click', function () { abreConsulta(a); });
    return b;
  }

  /* ---------------- funil ---------------- */
  var etapaMobile = 'novo';
  function pintaFunil() {
    var nav = $('#etapas-nav'), kb = $('#kanban');
    nav.innerHTML = ''; kb.innerHTML = '';
    ETAPAS.forEach(function (e, i) {
      var doEt = crm.pacientes.filter(function (p) { return p.etapa === e.id; })
        .sort(function (a, b) { return (b.etapaEm || '') < (a.etapaEm || '') ? -1 : 1; });
      var t = el('button', null, e.nome + ' (' + doEt.length + ')'); t.type = 'button';
      t.setAttribute('aria-selected', etapaMobile === e.id ? 'true' : 'false');
      t.addEventListener('click', function () { etapaMobile = e.id; pintaFunil(); });
      nav.appendChild(t);
      var col = el('div', 'coluna'); if (etapaMobile === e.id) col.setAttribute('data-visivel', '');
      var cab = el('div', 'coluna-cab'); cab.appendChild(document.createTextNode(e.nome)); cab.appendChild(el('span', null, String(doEt.length)));
      col.appendChild(cab);
      if (!doEt.length) col.appendChild(el('p', 'vazio', 'Ninguém aqui.'));
      doEt.forEach(function (p) {
        var c = el('div', 'card'); c.setAttribute('data-et', e.id);
        var ab = el('button', 'card-abre'); ab.type = 'button';
        ab.appendChild(el('b', null, p.nome));
        var dias = p.etapaEm ? Math.max(0, difDias(p.etapaEm.slice(0, 10), hoje())) : 0;
        var prox = proximaDe(p);
        ab.appendChild(el('small', null, nomeObj(p.objetivo) + (e.id === 'marcada' && prox ? ' · ' + relativo(prox.dia) + ' ' + prox.inicio : (dias === 0 ? ' · hoje' : ' · há ' + dias + (dias === 1 ? ' dia' : ' dias')))));
        ab.addEventListener('click', function () { abreFicha(p.id); });
        c.appendChild(ab);
        var tg = el('div', 'card-tags'); tg.appendChild(el('span', 'tag', p.origem)); tg.appendChild(tagMod(p.modalidade));
        c.appendChild(tg);
        var ac = el('div', 'card-acoes');
        var z = el('button', 'zap', 'WhatsApp'); z.type = 'button'; z.addEventListener('click', function () { abreMensagem(p, e.id); }); ac.appendChild(z);
        if (i > 0 && i < 4) { var v = el('button', null, '←'); v.type = 'button'; v.title = 'Voltar etapa'; v.setAttribute('aria-label', 'Voltar para ' + ETAPAS[i - 1].nome); v.addEventListener('click', function () { mudaEtapa(p, ETAPAS[i - 1].id); }); ac.appendChild(v); }
        if (i < 3) { var a = el('button', 'avanca', ETAPAS[i + 1].nome + ' →'); a.type = 'button'; a.addEventListener('click', function () { mudaEtapa(p, ETAPAS[i + 1].id); }); ac.appendChild(a); }
        if (i === 3) { var ina = el('button', null, 'Inativo'); ina.type = 'button'; ina.addEventListener('click', function () { mudaEtapa(p, 'inativo'); }); ac.appendChild(ina); }
        if (i === 4) { var vo = el('button', 'avanca', 'Voltou → ativo'); vo.type = 'button'; vo.addEventListener('click', function () { mudaEtapa(p, 'ativo'); }); ac.appendChild(vo); }
        if (i < 2) { var pe = el('button', null, 'Perdido'); pe.type = 'button'; pe.addEventListener('click', function () { mudaEtapa(p, 'perdido'); }); ac.appendChild(pe); }
        if (i === 5) { var re = el('button', 'avanca', 'Reabrir'); re.type = 'button'; re.addEventListener('click', function () { mudaEtapa(p, 'conversa'); }); ac.appendChild(re); }
        c.appendChild(ac);
        col.appendChild(c);
      });
      kb.appendChild(col);
    });
  }
  function mudaEtapa(p, et) {
    p.etapa = et; p.etapaEm = new Date().toISOString();
    (p.notas = p.notas || []).push({ data: hoje(), texto: 'Etapa: ' + nomeEtapa(et) + '.' });
    grava();
    etapaMobile = et;
    pinta();
  }

  /* ---------------- pacientes ---------------- */
  var filtroPac = 'ativos';
  $$('#filtro-pac button').forEach(function (b) {
    b.addEventListener('click', function () {
      filtroPac = b.getAttribute('data-f');
      $$('#filtro-pac button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      pintaPacientes();
    });
  });
  $('#busca-pac').addEventListener('input', function () { pintaPacientes(); });
  function pintaPacientes() {
    var q = $('#busca-pac').value.trim().toLowerCase();
    var l = crm.pacientes.filter(function (p) {
      if (q && p.nome.toLowerCase().indexOf(q) < 0) return false;
      if (filtroPac === 'ativos') return p.etapa === 'ativo' || p.etapa === 'marcada';
      if (filtroPac === 'inativos') return p.etapa === 'inativo' || p.etapa === 'perdido';
      return true;
    }).sort(function (a, b) { return a.nome < b.nome ? -1 : 1; });
    var cx = $('#lista-pac'); cx.innerHTML = '';
    if (!l.length) cx.appendChild(el('p', 'vazio', 'Ninguém encontrado.'));
    l.forEach(function (p) {
      var b = el('button', 'pac'); b.type = 'button';
      var top = el('div', 'pac-top'); top.appendChild(el('span', 'ini', iniciais(p.nome)));
      var t = el('div'); t.appendChild(el('b', null, p.nome)); t.appendChild(el('small', null, nomeObj(p.objetivo) + ' · ' + nomeEtapa(p.etapa)));
      top.appendChild(t); b.appendChild(top);
      var md = medidasDe(p), f = feitasDe(p), prox = proximaDe(p);
      var nums = el('div', 'pac-nums');
      var dp = md.length > 1 ? md[md.length - 1].peso - md[0].peso : null;
      [['Consultas', String(f.length)], ['Peso', dp == null ? (md.length ? num(md[0].peso) + ' kg' : '—') : (dp > 0 ? '+' : '') + num(dp) + ' kg'],
       ['Retorno', prox ? dm(prox.dia) : (retornoPrevisto(p) ? 'prev. ' + dm(retornoPrevisto(p)) : '—')]].forEach(function (x, i) {
        var d = el('div'); d.appendChild(el('small', null, x[0]));
        var bb = el('b', null, x[1]); if (i === 1 && dp != null) bb.className = dp < 0 ? 'desce' : 'sobe';
        d.appendChild(bb); nums.appendChild(d);
      });
      b.appendChild(nums);
      var tg = el('div', 'card-tags'); tg.appendChild(tagMod(p.modalidade)); tg.appendChild(el('span', 'tag', p.origem));
      if (p.esporte) tg.appendChild(el('span', 'tag', p.esporte));
      b.appendChild(tg);
      b.addEventListener('click', function () { abreFicha(p.id); });
      cx.appendChild(b);
    });
  }

  /* ---------------- ficha do paciente ---------------- */
  var ficha = $('#ficha'), fichaId = null, fichaAba = 'resumo', metrica = 'peso';
  $('#fc-fechar').addEventListener('click', function () { ficha.close(); });
  ficha.addEventListener('close', function () { pinta(); });
  $$('#fc-abas button').forEach(function (b) { b.addEventListener('click', function () { fichaAba = b.getAttribute('data-fa'); pintaFicha(); }); });
  function abreFicha(id, parte) {
    fichaId = id; fichaAba = parte || 'resumo'; metrica = 'peso';
    pintaFicha();
    if (!ficha.open) ficha.showModal();
    $('#fc-corpo').scrollTop = 0;
  }
  function pintaFicha() {
    var p = pacPorId(fichaId); if (!p) return;
    $('#fc-nome').textContent = p.nome;
    var ch = $('#fc-chips'); ch.innerHTML = '';
    ch.appendChild(el('span', 'tag ' + (p.etapa === 'ativo' ? 'tag-ok' : p.etapa === 'perdido' ? 'tag-er' : p.etapa === 'inativo' ? 'tag-al' : 'tag-on'), nomeEtapa(p.etapa)));
    ch.appendChild(tagMod(p.modalidade)); ch.appendChild(el('span', 'tag', p.origem));
    $$('#fc-abas button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-fa') === fichaAba ? 'true' : 'false'); });
    var c = $('#fc-corpo'); c.innerHTML = '';
    ({ resumo: fResumo, evolucao: fEvolucao, anamnese: fAnamnese, plano: fPlano, consultas: fConsultas, notas: fNotas })[fichaAba](p, c);
  }
  function bloco(c, tit) { var b = el('div', 'bloco'); if (tit) { var h = el('div', 'bloco-cab'); h.appendChild(el('h2', null, tit)); b.appendChild(h); } c.appendChild(b); return b; }
  function deltas(p, cx) {
    var md = medidasDe(p);
    if (md.length < 2) return false;
    var a = md[0], z = md[md.length - 1], d = el('div', 'deltas');
    [['Peso', z.peso - a.peso, 'kg'], ['% gordura', z.gordura - a.gordura, 'pontos'], ['Cintura', z.cintura - a.cintura, 'cm']].forEach(function (x) {
      var k = el('div', 'delta'); k.appendChild(el('small', null, x[0]));
      k.appendChild(el('b', null, (x[1] > 0 ? '+' : '') + num(x[1])));
      k.appendChild(el('span', null, x[2] + ' desde ' + dm(a.data))); d.appendChild(k);
    });
    cx.appendChild(d);
    return true;
  }
  function fResumo(p, c) {
    var ac = el('div', 'acoes'); ac.style.marginTop = '0'; ac.style.marginBottom = '.9rem';
    var z = el('button', 'btn btn-zap mini', 'Mensagem: ' + nomeEtapa(p.etapa)); z.type = 'button'; z.addEventListener('click', function () { abreMensagem(p, p.etapa); }); ac.appendChild(z);
    var mr = el('button', 'btn btn-azul mini', 'Marcar consulta'); mr.type = 'button'; mr.addEventListener('click', function () { fichaAba = 'consultas'; pintaFicha(); }); ac.appendChild(mr);
    var mm = el('button', 'btn btn-linha mini', 'Registrar medidas'); mm.type = 'button'; mm.addEventListener('click', function () { fichaAba = 'evolucao'; pintaFicha(); }); ac.appendChild(mm);
    c.appendChild(ac);
    if (deltas(p, c)) {
      var bg = bloco(c, 'Evolução do peso');
      bg.appendChild(grafico(medidasDe(p), 'peso'));
    }
    var b = bloco(c, 'Dados');
    var prox = proximaDe(p), ult = ultimaDe(p), md = medidasDe(p), ultM = md[md.length - 1];
    var imc = ultM && p.altura ? ultM.peso / Math.pow(p.altura / 100, 2) : null;
    var d = el('div', 'dados');
    [['WhatsApp', telFmt(p.telefone)], ['Objetivo', nomeObj(p.objetivo)], ['Esporte / treino', p.esporte || '—'],
     ['Idade', p.idade ? p.idade + ' anos' : '—'], ['Altura', p.altura ? p.altura + ' cm' : '—'], ['IMC atual', imc ? num(imc) : '—'],
     ['Origem', p.origem], ['Paciente desde', p.primeira ? dm(p.primeira) + '/' + p.primeira.slice(0, 4) : (p.criado ? 'lead em ' + dm(p.criado.slice(0, 10)) : '—')],
     ['Última consulta', ult ? curto(ult.dia) + ' (há ' + difDias(ult.dia, hoje()) + ' dias)' : '—'],
     ['Próxima consulta', prox ? relativo(prox.dia) + ' às ' + prox.inicio : (retornoPrevisto(p) ? 'Prevista para ' + dm(retornoPrevisto(p)) + ' (sem horário)' : '—')]
    ].forEach(function (x) { var k = el('div'); k.appendChild(el('small', null, x[0])); k.appendChild(el('span', null, x[1])); d.appendChild(k); });
    b.appendChild(d);
    var be = bloco(c, 'Etapa e retorno');
    var f = el('div', 'campos-2');
    var c1 = el('div', 'campo'); c1.appendChild(el('label', null, 'Etapa no funil'));
    var se = el('select'); ETAPAS.forEach(function (e) { var o = el('option', null, e.nome); o.value = e.id; if (e.id === p.etapa) o.selected = true; se.appendChild(o); });
    se.addEventListener('change', function () { p.etapa = se.value; p.etapaEm = new Date().toISOString(); grava(); pintaFicha(); });
    c1.appendChild(se); f.appendChild(c1);
    var c2 = el('div', 'campo'); c2.appendChild(el('label', null, 'Retorno a cada (dias)'));
    var ir = el('input'); ir.type = 'number'; ir.min = 7; ir.max = 120; ir.value = p.retornoDias || crm.ajustes.retornoDias;
    ir.addEventListener('change', function () { p.retornoDias = +ir.value || 30; grava(); pintaFicha(); });
    c2.appendChild(ir); f.appendChild(c2);
    be.appendChild(f);
    if (p.etapa === 'perdido') {
      var c3 = el('div', 'campo'); c3.style.marginTop = '.8rem'; c3.appendChild(el('label', null, 'Motivo da perda'));
      var mi = el('input'); mi.value = p.motivo || ''; mi.addEventListener('change', function () { p.motivo = mi.value; grava(); });
      c3.appendChild(mi); be.appendChild(c3);
    }
    if (p.plano && p.plano.texto) {
      var bp = bloco(c, 'Plano atual');
      bp.appendChild(el('p', 'plano-txt', p.plano.texto.split('\n').slice(0, 4).join('\n') + (p.plano.texto.split('\n').length > 4 ? '\n…' : '')));
      var vp = el('button', 'lnk', 'Ver plano completo →'); vp.type = 'button'; vp.style.marginTop = '.5rem';
      vp.addEventListener('click', function () { fichaAba = 'plano'; pintaFicha(); }); bp.appendChild(vp);
    }
  }

  // gráfico SVG simples: uma métrica ao longo das consultas
  function grafico(md, met) {
    var info = METRICAS.filter(function (m) { return m.id === met; })[0];
    var pts = md.filter(function (m) { return m[met] != null && m[met] !== ''; });
    var estreito = window.innerWidth < 640;
    var W = estreito ? 360 : 640, H = estreito ? 230 : 250, L = estreito ? 36 : 46, R = 20, T = 26, B = 34;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'grafico');
    svg.setAttribute('role', 'img');
    function sv(t, a, txt) { var n = document.createElementNS(ns, t); Object.keys(a).forEach(function (k) { n.setAttribute(k, a[k]); }); if (txt != null) n.textContent = txt; svg.appendChild(n); return n; }
    if (!pts.length) { sv('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle', fill: '#44506A', 'font-size': 16 }, 'Sem medidas registradas ainda'); return svg; }
    svg.setAttribute('aria-label', info.nome + ': de ' + num(pts[0][met]) + ' para ' + num(pts[pts.length - 1][met]) + ' ' + info.un);
    var vals = pts.map(function (m) { return +m[met]; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = Math.max((hi - lo) * 0.25, 1); lo -= pad; hi += pad;
    function X(i) { return pts.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1); }
    function Y(v) { return T + (hi - v) / (hi - lo) * (H - T - B); }
    var defs = sv('defs', {});
    var g = document.createElementNS(ns, 'linearGradient'); g.setAttribute('id', 'gr-' + met); g.setAttribute('x1', 0); g.setAttribute('x2', 0); g.setAttribute('y1', 0); g.setAttribute('y2', 1);
    [['0', '#2E6BFF', '.28'], ['1', '#2E6BFF', '0']].forEach(function (s) { var st = document.createElementNS(ns, 'stop'); st.setAttribute('offset', s[0]); st.setAttribute('stop-color', s[1]); st.setAttribute('stop-opacity', s[2]); g.appendChild(st); });
    defs.appendChild(g);
    for (var k = 0; k <= 3; k++) {
      var v = lo + (hi - lo) * k / 3, y = Y(v);
      sv('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: '#D5DDEA', 'stroke-width': 1 });
      sv('text', { x: L - 8, y: y + 4, 'text-anchor': 'end', fill: '#44506A', 'font-size': 12 }, num(v, 0));
    }
    var linha = pts.map(function (m, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(+m[met]).toFixed(1); }).join(' ');
    if (pts.length > 1) {
      sv('path', { d: linha + ' L' + X(pts.length - 1) + ' ' + (H - B) + ' L' + X(0) + ' ' + (H - B) + ' Z', fill: 'url(#gr-' + met + ')' });
      sv('path', { d: linha, fill: 'none', stroke: '#1D4ED8', 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    }
    pts.forEach(function (m, i) {
      var ul = i === pts.length - 1;
      sv('circle', { cx: X(i), cy: Y(+m[met]), r: ul ? 8 : 5.5, fill: ul ? '#C8F03C' : '#fff', stroke: ul ? '#0B1F44' : '#1D4ED8', 'stroke-width': 3 });
      sv('text', { x: X(i), y: Y(+m[met]) - 13, 'text-anchor': 'middle', fill: '#0B1F44', 'font-size': 13, 'font-weight': 700 }, num(m[met]));
      sv('text', { x: X(i), y: H - 12, 'text-anchor': 'middle', fill: '#44506A', 'font-size': 12 }, dm(m.data));
    });
    return svg;
  }

  function fEvolucao(p, c) {
    var md = medidasDe(p);
    deltas(p, c);
    var b = bloco(c, 'Gráfico de evolução');
    var ms = el('div', 'metricas');
    METRICAS.forEach(function (m) {
      var bt = el('button', null, m.nome); bt.type = 'button'; bt.setAttribute('aria-pressed', metrica === m.id ? 'true' : 'false');
      bt.addEventListener('click', function () { metrica = m.id; pintaFicha(); });
      ms.appendChild(bt);
    });
    b.appendChild(ms);
    b.appendChild(grafico(md, metrica));
    if (md.length) {
      var rol = el('div', 'tabela-rolagem'), t = el('table', 'tabela');
      var th = el('tr'); ['Data', 'Peso', 'IMC', '% gord.', 'Cintura', 'Quadril', 'Braço', 'Coxa'].forEach(function (x) { th.appendChild(el('th', null, x)); });
      var thead = el('thead'); thead.appendChild(th); t.appendChild(thead);
      var tb = el('tbody');
      md.slice().reverse().forEach(function (m) {
        var tr = el('tr');
        [dm(m.data) + '/' + m.data.slice(2, 4), num(m.peso), p.altura && m.peso ? num(m.peso / Math.pow(p.altura / 100, 2)) : '—', num(m.gordura), num(m.cintura), num(m.quadril), num(m.braco), num(m.coxa)]
          .forEach(function (x) { tr.appendChild(el('td', null, x)); });
        tb.appendChild(tr);
      });
      t.appendChild(tb); rol.appendChild(t); b.appendChild(rol);
    }
    var bf = bloco(c, 'Registrar medidas da consulta');
    var f = el('form'); f.noValidate = true;
    var g = el('div', 'campos');
    var lin1 = el('div', 'campos-2');
    function campo(cx, id, rot, tipo, val) {
      var d = el('div', 'campo'); var l = el('label', null, rot); l.htmlFor = id; d.appendChild(l);
      var i = el('input'); i.id = id; i.type = tipo || 'number'; i.step = '0.1'; i.inputMode = 'decimal'; if (val != null) i.value = val;
      d.appendChild(i); cx.appendChild(d); return i;
    }
    var iData = campo(lin1, 'md-data', 'Data', 'date', hoje());
    var iPeso = campo(lin1, 'md-peso', 'Peso (kg)');
    g.appendChild(lin1);
    var lin2 = el('div', 'campos-2'); var iG = campo(lin2, 'md-gord', '% gordura'); var iCi = campo(lin2, 'md-cint', 'Cintura (cm)'); g.appendChild(lin2);
    var lin3 = el('div', 'campos-2'); var iQ = campo(lin3, 'md-quad', 'Quadril (cm)'); var iB = campo(lin3, 'md-braco', 'Braço (cm)'); g.appendChild(lin3);
    var lin4 = el('div', 'campos-2'); var iCo = campo(lin4, 'md-coxa', 'Coxa (cm)'); g.appendChild(lin4);
    var bt = el('button', 'btn btn-azul', 'Salvar medidas'); bt.type = 'submit'; g.appendChild(bt);
    var msg = el('div');
    f.appendChild(g); f.appendChild(msg); bf.appendChild(f);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      function v(i) { var x = parseFloat(String(i.value).replace(',', '.')); return isNaN(x) ? null : x; }
      if (!iData.value || v(iPeso) == null) return aviso(msg, 'aviso-erro', 'Preencha pelo menos a data e o peso.');
      p.medidas = (p.medidas || []).filter(function (m) { return m.data !== iData.value; });
      p.medidas.push({ data: iData.value, peso: v(iPeso), gordura: v(iG), cintura: v(iCi), quadril: v(iQ), braco: v(iB), coxa: v(iCo) });
      grava(); metrica = 'peso'; pintaFicha();
    });
  }

  var CAMPOS_ANAM = [['queixa', 'Queixa principal / objetivo'], ['rotina', 'Rotina e horários'], ['sono', 'Sono'], ['agua', 'Água'],
    ['intestino', 'Intestino'], ['saude', 'Condições de saúde'], ['medicamentos', 'Medicamentos e suplementos'], ['alergias', 'Alergias e intolerâncias'],
    ['preferencias', 'Preferências e aversões'], ['exames', 'Exames']];
  function fAnamnese(p, c) {
    var b = bloco(c, 'Anamnese');
    var f = el('form'); var g = el('div', 'campos');
    var cEsp = el('div', 'campo'); cEsp.appendChild(el('label', null, 'Esporte / treino')); var iEsp = el('input'); iEsp.value = p.esporte || ''; cEsp.appendChild(iEsp); g.appendChild(cEsp);
    var lin = el('div', 'campos-2');
    var cI = el('div', 'campo'); cI.appendChild(el('label', null, 'Idade')); var iI = el('input'); iI.type = 'number'; iI.value = p.idade || ''; cI.appendChild(iI); lin.appendChild(cI);
    var cA = el('div', 'campo'); cA.appendChild(el('label', null, 'Altura (cm)')); var iA = el('input'); iA.type = 'number'; iA.value = p.altura || ''; cA.appendChild(iA); lin.appendChild(cA);
    g.appendChild(lin);
    var tas = {};
    CAMPOS_ANAM.forEach(function (x) {
      var d = el('div', 'campo'); var l = el('label', null, x[1]); l.htmlFor = 'an-' + x[0]; d.appendChild(l);
      var t = el('textarea'); t.id = 'an-' + x[0]; t.rows = 2; t.value = (p.anamnese || {})[x[0]] || ''; t.style.minHeight = '64px';
      d.appendChild(t); g.appendChild(d); tas[x[0]] = t;
    });
    var bt = el('button', 'btn btn-azul', 'Salvar anamnese'); bt.type = 'submit'; g.appendChild(bt);
    var msg = el('div');
    f.appendChild(g); f.appendChild(msg); b.appendChild(f);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      p.anamnese = p.anamnese || {};
      Object.keys(tas).forEach(function (k) { p.anamnese[k] = tas[k].value.trim(); });
      p.esporte = iEsp.value.trim(); p.idade = +iI.value || null; p.altura = +iA.value || null;
      grava(); aviso(msg, 'aviso-ok', 'Anamnese salva.');
    });
  }

  function fPlano(p, c) {
    var b = bloco(c, 'Plano alimentar atual');
    if (p.plano && p.plano.atualizado) b.appendChild(el('p', 'adm-sub', 'Atualizado em ' + dm(p.plano.atualizado) + '/' + p.plano.atualizado.slice(0, 4) + '.'));
    var d = el('div', 'campo'); d.style.marginTop = '.6rem';
    var l = el('label', null, 'Plano (uma linha por refeição ou orientação)'); l.htmlFor = 'pl-txt'; d.appendChild(l);
    var t = el('textarea'); t.id = 'pl-txt'; t.rows = 10; t.style.minHeight = '220px'; t.value = (p.plano || {}).texto || '';
    t.placeholder = 'Café: …\nAlmoço: …\nLanche: …\nJantar: …\nÁgua: …';
    d.appendChild(t); b.appendChild(d);
    var ac = el('div', 'acoes');
    var s = el('button', 'btn btn-azul', 'Salvar plano'); s.type = 'button';
    var msg = el('div');
    s.addEventListener('click', function () { p.plano = { texto: t.value.trim(), atualizado: hoje() }; grava(); aviso(msg, 'aviso-ok', 'Plano salvo.'); });
    ac.appendChild(s);
    var z = el('button', 'btn btn-zap', 'Mandar no WhatsApp'); z.type = 'button';
    z.addEventListener('click', function () {
      abreMensagem(p, 'ativo');
      $('#msg-tit').textContent = 'Plano alimentar';
      $('#msg-txt').value = 'Oi, ' + primeiroNome(p.nome) + '! Segue o seu plano atualizado:\n\n' + t.value.trim() + '\n\nQualquer dúvida, me chama aqui. Sem desistências!';
      atualizaZap(p);
    });
    ac.appendChild(z);
    b.appendChild(ac); b.appendChild(msg);
  }

  function slotsLivres(dia, dur, mod) {
    var e = (CFG.expediente || {})[deIso(dia).getDay()];
    var dias = (CFG.modalidadePor(mod) || {}).dias || [];
    if (!e || !e.aberto || dias.indexOf(deIso(dia).getDay()) < 0) return [];
    var out = [], ocup = ags.filter(function (a) { return a.dia === dia && a.status !== 'cancelado'; });
    var bl = bloqueios.filter(function (b) { return b.data === dia; });
    for (var m = minutos(e.abre); m + dur <= minutos(e.fecha); m += 30) {
      var f = m + dur;
      if (e.pausa && m < minutos(e.pausa[1]) && f > minutos(e.pausa[0])) continue;
      if (ocup.some(function (a) { return m < minutos(a.fim) && f > minutos(a.inicio); })) continue;
      if (bl.some(function (b) { return m < minutos(b.hora_fim) && f > minutos(b.hora_inicio); })) continue;
      if (dia === hoje() && m < new Date().getHours() * 60 + new Date().getMinutes()) continue;
      out.push(deMin(m));
    }
    return out;
  }
  function fConsultas(p, c) {
    var b = bloco(c, 'Marcar consulta');
    var temFeita = feitasDe(p).length > 0;
    var g = el('div', 'campos');
    var l1 = el('div', 'campos-2');
    var cT = el('div', 'campo'); cT.appendChild(el('label', null, 'Tipo'));
    var sT = el('select'); [['retorno', 'Retorno'], ['primeira', '1ª consulta']].forEach(function (x) { var o = el('option', null, x[1]); o.value = x[0]; sT.appendChild(o); });
    sT.value = temFeita ? 'retorno' : 'primeira'; cT.appendChild(sT); l1.appendChild(cT);
    var cM = el('div', 'campo'); cM.appendChild(el('label', null, 'Modalidade'));
    var sM = el('select'); CFG.modalidades.forEach(function (m) { var o = el('option', null, m.nome); o.value = m.id; sM.appendChild(o); });
    sM.value = p.modalidade || 'online'; cM.appendChild(sM); l1.appendChild(cM);
    g.appendChild(l1);
    var l2 = el('div', 'campos-2');
    var cD = el('div', 'campo'); cD.appendChild(el('label', null, 'Dia'));
    var iD = el('input'); iD.type = 'date'; iD.min = hoje();
    var prev = retornoPrevisto(p); iD.value = prev && prev > hoje() ? prev : soma(hoje(), 1);
    cD.appendChild(iD); l2.appendChild(cD);
    var cH = el('div', 'campo'); cH.appendChild(el('label', null, 'Horário livre')); var sH = el('select'); cH.appendChild(sH); l2.appendChild(cH);
    g.appendChild(l2);
    var bt = el('button', 'btn btn-azul', 'Marcar na agenda'); bt.type = 'button'; g.appendChild(bt);
    var msg = el('div'); g.appendChild(msg);
    b.appendChild(g);
    function dur() { return sT.value === 'primeira' ? 60 : 30; }
    function horas() {
      sH.innerHTML = '';
      var l = slotsLivres(iD.value, dur(), sM.value);
      if (!l.length) { var o = el('option', null, 'Sem horário nesse dia'); o.value = ''; sH.appendChild(o); }
      l.forEach(function (h) { var o = el('option', null, h); o.value = h; sH.appendChild(o); });
    }
    [sT, sM, iD].forEach(function (x) { x.addEventListener('change', horas); });
    horas();
    bt.addEventListener('click', function () {
      if (!sH.value) return aviso(msg, 'aviso-erro', 'Escolha um dia com horário livre (presencial atende só em alguns dias).');
      var nome = (sT.value === 'primeira' ? '1ª consulta ' : 'Retorno ') + (sM.value === 'online' ? 'on-line' : 'presencial');
      var l = lsLe(K_AG, '[]');
      var novo = { codigo: 'P' + Math.random().toString(16).slice(2, 7).toUpperCase(), barbeiro_id: 'victor', barbeiro: 'Victor Latif',
        servico: nome, preco_centavos: 0, nome: p.nome, telefone: p.telefone, dia: iD.value, inicio: sH.value,
        fim: deMin(minutos(sH.value) + dur()), obs: 'Marcado pelo painel', status: 'confirmado', anexos: [], origem: 'painel', criado_em: new Date().toISOString() };
      l.push(novo); lsGrava(K_AG, l); ags = l;
      if (p.etapa !== 'ativo') { p.etapa = temFeita ? 'ativo' : 'marcada'; p.etapaEm = new Date().toISOString(); }
      grava();
      pintaFicha();
      var b0 = $('#fc-corpo .bloco');
      if (b0) b0.appendChild(el('div', 'aviso aviso-ok', 'Marcado: ' + nome + ', ' + relativo(novo.dia).toLowerCase() + ' às ' + novo.inicio + '. Já aparece na agenda e o site não oferece mais esse horário.'));
    });

    var bh = bloco(c, 'Histórico de consultas');
    var l = consultasDe(p).slice().reverse();
    if (!l.length) bh.appendChild(el('p', 'vazio', 'Nenhuma consulta ainda.'));
    l.forEach(function (a) {
      var ln = el('div', 'linha');
      ln.appendChild(el('span', 'hora', dm(a.dia)));
      var m = el('span', 'meio'); m.appendChild(el('b', null, a.servico)); m.appendChild(el('span', null, curto(a.dia) + ' · ' + a.inicio + '–' + a.fim));
      ln.appendChild(m);
      var st = { concluido: ['Realizada', 'tag-ok'], confirmado: ['Marcada', 'tag-on'], faltou: ['Faltou', 'tag-er'], cancelado: ['Cancelada', 'tag-er'] }[a.status] || [a.status, ''];
      var f = el('span', 'fim'); f.appendChild(el('span', 'tag ' + st[1], st[0])); ln.appendChild(f);
      ln.style.cursor = 'pointer';
      ln.addEventListener('click', function () { abreConsulta(a); });
      bh.appendChild(ln);
    });
  }

  function fNotas(p, c) {
    var b = bloco(c, 'Nova anotação');
    var t = el('textarea'); t.rows = 3; t.placeholder = 'Ex: relatou mais disposição nos treinos; ajustar lanche da tarde'; t.style.width = '100%';
    var d = el('div', 'campo'); d.appendChild(t); b.appendChild(d);
    var s = el('button', 'btn btn-azul', 'Salvar anotação'); s.type = 'button'; s.style.marginTop = '.6rem';
    s.addEventListener('click', function () {
      if (!t.value.trim()) return;
      (p.notas = p.notas || []).push({ data: hoje(), texto: t.value.trim() }); grava(); pintaFicha();
    });
    b.appendChild(s);
    var bl = bloco(c, 'Anotações');
    var ns = (p.notas || []).slice().sort(function (a, b2) { return a.data < b2.data ? 1 : -1; });
    if (!ns.length) bl.appendChild(el('p', 'vazio', 'Nenhuma anotação.'));
    ns.forEach(function (n) { var x = el('div', 'nota'); x.appendChild(el('small', null, curto(n.data) + '/' + n.data.slice(0, 4))); x.appendChild(el('span', null, n.texto)); bl.appendChild(x); });
  }

  /* ---------------- consulta (dialog) ---------------- */
  var dlgAg = $('#dlg-ag');
  function abreConsulta(a) {
    $('#ag-tit').textContent = a.servico;
    var c = $('#ag-corpo'); c.innerHTML = '';
    var d = el('div', 'dados');
    [['Paciente', a.nome], ['Quando', curto(a.dia) + ' · ' + a.inicio + '–' + a.fim], ['WhatsApp', telFmt(a.telefone)], ['Código', a.codigo],
     ['Situação', { concluido: 'Realizada', confirmado: 'Marcada', faltou: 'Faltou', cancelado: 'Cancelada' }[a.status] || a.status],
     ['Origem', a.origem === 'site' || !a.origem ? 'Site' : 'Painel']].forEach(function (x) {
      var k = el('div'); k.appendChild(el('small', null, x[0])); k.appendChild(el('span', null, x[1])); d.appendChild(k);
    });
    c.appendChild(d);
    if (a.obs) { var o = el('p', 'plano-txt', a.obs); o.style.cssText = 'margin-top:.8rem;background:#F3F6FB;padding:.7rem .8rem;border-radius:10px;font-size:.95rem'; c.appendChild(o); }
    var ac = $('#ag-acoes'); ac.innerHTML = '';
    function bt(txt, cls, fn) { var b = el('button', 'btn mini ' + cls, txt); b.type = 'button'; b.addEventListener('click', fn); ac.appendChild(b); }
    var p = pacPorTel(a.telefone);
    if (a.status === 'confirmado') {
      bt('Consulta realizada', 'btn-azul', function () { status(a, 'concluido'); });
      bt('Faltou', 'btn-linha', function () { status(a, 'faltou'); });
      bt('Cancelar', 'btn-perigo', function () { if (confirm('Cancelar esta consulta? O horário volta para a agenda.')) status(a, 'cancelado'); });
    }
    if (p) bt('Abrir ficha', 'btn-linha', function () { dlgAg.close(); abreFicha(p.id, a.status === 'concluido' ? 'evolucao' : 'resumo'); });
    if (p && a.status === 'confirmado') bt('Confirmar no WhatsApp', 'btn-zap', function () { dlgAg.close(); abreMensagem(p, 'marcada'); });
    bt('Fechar', 'btn-linha', function () { dlgAg.close(); });
    dlgAg.showModal();
  }
  function status(a, st) {
    var l = lsLe(K_AG, '[]');
    l.forEach(function (x) { if (x.codigo === a.codigo) x.status = st; });
    lsGrava(K_AG, l); ags = l;
    var p = pacPorTel(a.telefone);
    if (p && st === 'concluido' && p.etapa !== 'ativo') { p.etapa = 'ativo'; p.etapaEm = new Date().toISOString(); p.primeira = p.primeira || a.dia; grava(); }
    dlgAg.close();
    pinta();
    if (ficha.open) pintaFicha();
    if (p && st === 'concluido') abreFicha(p.id, 'evolucao');
  }

  /* ---------------- agenda ---------------- */
  var semanaIni = inicioSemana(new Date());
  $('#sem-menos').addEventListener('click', function () { semanaIni.setDate(semanaIni.getDate() - 7); pintaAgenda(); });
  $('#sem-mais').addEventListener('click', function () { semanaIni.setDate(semanaIni.getDate() + 7); pintaAgenda(); });
  $('#sem-hoje').addEventListener('click', function () { semanaIni = inicioSemana(new Date()); pintaAgenda(); });
  function pintaAgenda() {
    var ini = iso(semanaIni), fim = soma(ini, 6);
    $('#sem-titulo').textContent = dm(ini) + ' a ' + dm(fim);
    var cx = $('#semana'); cx.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      var d = soma(ini, i), dt = deIso(d), e = (CFG.expediente || {})[dt.getDay()];
      var col = el('div', 'dia-col' + (d === hoje() ? ' hoje' : ''));
      var cab = el('div', 'dia-cab'); cab.appendChild(document.createTextNode(SEM_C[dt.getDay()] + ' ' + dm(d)));
      var doDia = ags.filter(function (a) { return a.dia === d; }).sort(function (a, b) { return a.inicio < b.inicio ? -1 : 1; });
      var bls = bloqueios.filter(function (b) { return b.data === d; });
      cab.appendChild(el('small', null, doDia.filter(function (a) { return a.status !== 'cancelado'; }).length + ' cons.'));
      col.appendChild(cab);
      bls.forEach(function (b) {
        var x = el('div', 'ev bloq'); x.appendChild(el('b', null, b.hora_inicio === '00:00' ? 'Dia bloqueado' : b.hora_inicio + '–' + b.hora_fim));
        x.appendChild(el('span', null, b.motivo || 'Bloqueio')); col.appendChild(x);
      });
      doDia.forEach(function (a) {
        var x = el('button', 'ev' + (ehOnline(a) ? ' on' : '') + (a.status === 'concluido' ? ' feito' : '') + (a.status === 'faltou' ? ' faltou' : '') + (a.status === 'cancelado' ? ' cancelado' : ''));
        x.type = 'button';
        x.appendChild(el('b', null, a.inicio + ' · ' + (ehPrimeira(a) ? '1ª' : 'Retorno')));
        x.appendChild(el('span', null, semExemplo(a.nome)));
        x.addEventListener('click', function () { abreConsulta(a); });
        col.appendChild(x);
      });
      if (!doDia.length && !bls.length) { col.classList.add('vazio-dia'); col.appendChild(el('span', 'fechado', e && e.aberto ? 'Livre' : 'Fechado')); }
      cx.appendChild(col);
    }
    var lb = $('#lista-bloqueios'); lb.innerHTML = '';
    var fut = bloqueios.filter(function (b) { return b.data >= hoje(); }).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    if (!fut.length) lb.appendChild(el('p', 'vazio', 'Nenhum bloqueio futuro.'));
    fut.forEach(function (b) {
      var ln = el('div', 'linha');
      ln.appendChild(el('span', 'hora', dm(b.data)));
      var m = el('span', 'meio'); m.appendChild(el('b', null, b.motivo || 'Bloqueio')); m.appendChild(el('span', null, b.hora_inicio === '00:00' ? 'Dia inteiro' : b.hora_inicio + ' às ' + b.hora_fim));
      ln.appendChild(m);
      var r = el('button', 'btn-ic', 'Remover'); r.type = 'button'; r.style.borderColor = 'var(--erro)'; r.style.color = 'var(--erro)';
      r.addEventListener('click', function () { lsGrava(K_BL, bloqueios.filter(function (x) { return x.id !== b.id; })); pinta(); });
      ln.appendChild(r);
      lb.appendChild(ln);
    });
  }
  $('#bl-tipo').addEventListener('change', function () { $('#bl-horas').hidden = this.value !== 'horas'; });
  $('#form-bloqueio').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var msg = $('#msg-bloqueio'), d = $('#bl-data').value, horas = $('#bl-tipo').value === 'horas';
    if (!d) return aviso(msg, 'aviso-erro', 'Escolha o dia.');
    var hi = horas ? $('#bl-ini').value : '00:00', hf = horas ? $('#bl-fim').value : '23:59';
    if (horas && hi >= hf) return aviso(msg, 'aviso-erro', 'O fim precisa ser depois do início.');
    var choque = ags.filter(function (a) { return a.dia === d && a.status === 'confirmado' && a.inicio < hf && a.fim > hi; });
    var l = lsLe(K_BL, '[]');
    l.push({ id: 'b' + Date.now(), barbeiro_id: 'victor', data: d, hora_inicio: hi, hora_fim: hf, motivo: $('#bl-motivo').value.trim() || 'Bloqueio' });
    lsGrava(K_BL, l);
    $('#bl-motivo').value = '';
    pinta();
    aviso(msg, choque.length ? 'aviso-erro' : 'aviso-ok', choque.length
      ? 'Bloqueado. Atenção: ' + choque.length + ' consulta(s) já marcada(s) nesse período: ' + choque.map(function (a) { return primeiroNome(a.nome) + ' ' + a.inicio; }).join(', ') + '. Avise no WhatsApp.'
      : 'Bloqueado. O site não oferece mais esse horário.');
  });

  /* ---------------- retornos ---------------- */
  function paraChamar(limite) {
    var h = hoje();
    return crm.pacientes.filter(function (p) { return (p.etapa === 'ativo' || p.etapa === 'inativo') && !proximaDe(p) && ultimaDe(p); })
      .map(function (p) { return { p: p, dias: difDias(ultimaDe(p).dia, h), prev: retornoPrevisto(p) }; })
      .filter(function (x) { return x.dias > limite; })
      .sort(function (a, b) { return b.dias - a.dias; });
  }
  function linhaRetorno(x) {
    var p = x.p, ln = el('div', 'linha');
    ln.appendChild(el('span', 'hora', x.dias + 'd'));
    var m = el('button', 'meio'); m.type = 'button'; m.style.textAlign = 'left';
    m.appendChild(el('b', null, p.nome));
    var atraso = difDias(x.prev, hoje());
    m.appendChild(el('span', null, 'Última: ' + curto(ultimaDe(p).dia) + ' · ' + (atraso > 0 ? 'retorno vencido há ' + atraso + ' dias' : atraso === 0 ? 'retorno vence hoje' : 'retorno vence em ' + (-atraso) + ' dias')));
    m.addEventListener('click', function () { abreFicha(p.id, 'consultas'); });
    ln.appendChild(m);
    var f = el('span', 'fim'); f.style.display = 'flex'; f.style.gap = '.35rem'; f.style.alignItems = 'center';
    f.appendChild(el('span', 'tag ' + (atraso > 0 ? 'tag-er' : 'tag-al'), atraso > 0 ? 'Vencido' : 'Vencendo'));
    var z = el('button', 'btn-ic', 'Lembrete'); z.type = 'button'; z.addEventListener('click', function () { abreMensagem(p, 'retorno'); });
    f.appendChild(z); ln.appendChild(f);
    return ln;
  }
  $('#ret-dias').addEventListener('change', function () { pintaRetornos(); });
  function pintaRetornos() {
    var lim = +$('#ret-dias').value;
    var cx = $('#lista-ret'); cx.innerHTML = '';
    var b = el('div', 'bloco'), l = paraChamar(lim);
    var cab = el('div', 'bloco-cab'); cab.appendChild(el('h2', null, l.length + (l.length === 1 ? ' paciente' : ' pacientes') + ' para chamar')); b.appendChild(cab);
    if (!l.length) b.appendChild(el('p', 'vazio', 'Ninguém sem consulta há mais de ' + lim + ' dias.'));
    l.forEach(function (x) { b.appendChild(linhaRetorno(x)); });
    cx.appendChild(b);
    var mc = $('#lista-ret-marcados'); mc.innerHTML = '';
    var h = hoje();
    var marc = ags.filter(function (a) { return a.status === 'confirmado' && a.dia >= h && !ehPrimeira(a); }).sort(function (a, b2) { return (a.dia + a.inicio) < (b2.dia + b2.inicio) ? -1 : 1; });
    if (!marc.length) mc.appendChild(el('p', 'vazio', 'Nenhum retorno marcado.'));
    marc.forEach(function (a) { var x = linhaConsulta(a); x.querySelector('.hora').textContent = dm(a.dia); mc.appendChild(x); });
  }

  /* ---------------- relatório ---------------- */
  var mesRef = new Date(); mesRef.setDate(1);
  $('#mes-menos').addEventListener('click', function () { mesRef.setMonth(mesRef.getMonth() - 1); pintaRelatorio(); });
  $('#mes-mais').addEventListener('click', function () { mesRef.setMonth(mesRef.getMonth() + 1); pintaRelatorio(); });
  function reais(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function valor(s) { var x = parseFloat(String(s || '').replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')); return isNaN(x) ? null : x; }
  function pintaRelatorio() {
    var ano = mesRef.getFullYear(), mes = mesRef.getMonth();
    var pref = ano + '-' + String(mes + 1).padStart(2, '0');
    $('#mes-titulo').textContent = MESES[mes] + ' de ' + ano;
    var doMes = ags.filter(function (a) { return a.dia.slice(0, 7) === pref; });
    var feitas = doMes.filter(function (a) { return a.status === 'concluido'; });
    var marcadas = doMes.filter(function (a) { return a.status === 'confirmado'; });
    var faltas = doMes.filter(function (a) { return a.status === 'faltou'; }).length;
    var prim = feitas.filter(ehPrimeira).length, ret = feitas.length - prim;
    var novosPac = crm.pacientes.filter(function (p) { var f = feitasDe(p)[0]; return f && f.dia.slice(0, 7) === pref; }).length;
    // retenção: de quem já era paciente antes do mês e tinha retorno previsto no mês, quantos voltaram
    var base = 0, voltaram = 0;
    crm.pacientes.forEach(function (p) {
      var antes = feitasDe(p).filter(function (a) { return a.dia < pref + '-01'; });
      if (!antes.length) return;
      var prev = soma(antes[antes.length - 1].dia, +(p.retornoDias || 30));
      if (prev.slice(0, 7) !== pref) return;   // retorno previsto para este mês
      base++;
      if (consultasDe(p).some(function (a) { return a.dia.slice(0, 7) === pref && a.status !== 'cancelado' && a.status !== 'faltou'; })) voltaram++;
    });
    var cx = $('#rel-kpis'); cx.innerHTML = '';
    kpi(cx, 'Consultas realizadas', feitas.length, prim + ' primeiras · ' + ret + ' retornos' + (marcadas.length ? ' · +' + marcadas.length + ' marcadas' : ''));
    kpi(cx, 'Novos pacientes', novosPac, '1ª consulta realizada no mês');
    kpi(cx, 'Retenção', base ? Math.round(voltaram / base * 100) + '%' : '—', base ? voltaram + ' de ' + base + ' com retorno previsto no mês voltaram' : 'sem retornos previstos no mês');
    kpi(cx, 'Faltas', faltas, doMes.length ? Math.round(faltas / Math.max(1, feitas.length + faltas) * 100) + '% das consultas' : '—');

    var leads = crm.pacientes.filter(function (p) { return p.criado && p.criado.slice(0, 7) === pref; });
    var ro = $('#rel-origem'); ro.innerHTML = '';
    if (!leads.length) ro.appendChild(el('p', 'vazio', 'Nenhum lead registrado neste mês.'));
    else {
      ro.appendChild(el('p', 'adm-sub', leads.length + ' leads no mês'));
      var bh = el('div', 'barras-h'); bh.style.marginTop = '.6rem';
      var cont = {}; leads.forEach(function (p) { cont[p.origem] = (cont[p.origem] || 0) + 1; });
      var mx = Math.max.apply(null, Object.keys(cont).map(function (k) { return cont[k]; }));
      Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; }).forEach(function (k) { bh.appendChild(barra(k, cont[k], mx)); });
      ro.appendChild(bh);
    }
    var rm = $('#rel-mod'); rm.innerHTML = '';
    var tot = feitas.concat(marcadas), on = tot.filter(ehOnline).length;
    if (!tot.length) rm.appendChild(el('p', 'vazio', 'Sem consultas neste mês.'));
    else { var b2 = el('div', 'barras-h'); b2.appendChild(barra('On-line', on, tot.length)); b2.appendChild(barra('Presencial', tot.length - on, tot.length)); rm.appendChild(b2); }
    var rob = $('#rel-obj'); rob.innerHTML = '';
    var atend = {}; tot.forEach(function (a) { var p = pacPorTel(a.telefone); if (p) atend[p.id] = p; });
    var co = {}; Object.keys(atend).forEach(function (id) { var n = nomeObj(atend[id].objetivo); co[n] = (co[n] || 0) + 1; });
    if (!Object.keys(co).length) rob.appendChild(el('p', 'vazio', 'Sem pacientes atendidos neste mês.'));
    else { var b3 = el('div', 'barras-h'), mx3 = Math.max.apply(null, Object.keys(co).map(function (k) { return co[k]; }));
      Object.keys(co).sort(function (a, b) { return co[b] - co[a]; }).forEach(function (k) { b3.appendChild(barra(k, co[k], mx3)); }); rob.appendChild(b3); }
    var rf = $('#rel-fat'); rf.innerHTML = '';
    var vp = valor(crm.ajustes.valorPrimeira), vr = valor(crm.ajustes.valorRetorno);
    if (vp == null && vr == null) {
      rf.appendChild(el('p', 'vazio', 'O valor da consulta ainda está "a confirmar". Preencha em Ajustes e o painel calcula o faturamento do mês.'));
      var ir = el('button', 'btn btn-linha mini', 'Ir para Ajustes'); ir.type = 'button'; ir.addEventListener('click', function () { irAba('ajustes'); }); rf.appendChild(ir);
    } else {
      var real = prim * (vp || 0) + ret * (vr || 0);
      var prev2 = marcadas.filter(ehPrimeira).length * (vp || 0) + marcadas.filter(function (a) { return !ehPrimeira(a); }).length * (vr || 0);
      var k = el('div', 'kpis'); k.style.gridTemplateColumns = '1fr 1fr';
      kpi(k, 'Realizado', reais(real), prim + ' × 1ª + ' + ret + ' × retorno');
      kpi(k, 'Marcado', reais(prev2), marcadas.length + ' consultas ainda por vir');
      rf.appendChild(k);
    }
  }

  /* ---------------- ajustes ---------------- */
  function pintaAjustes() {
    $('#aj-primeira').value = crm.ajustes.valorPrimeira || '';
    $('#aj-retorno').value = crm.ajustes.valorRetorno || '';
    $('#aj-dias').value = crm.ajustes.retornoDias || 30;
  }
  $('#form-ajustes').addEventListener('submit', function (ev) {
    ev.preventDefault();
    crm.ajustes.valorPrimeira = $('#aj-primeira').value.trim();
    crm.ajustes.valorRetorno = $('#aj-retorno').value.trim();
    crm.ajustes.retornoDias = +$('#aj-dias').value || 30;
    grava(); aviso($('#msg-ajustes'), 'aviso-ok', 'Salvo.');
  });
  $('#btn-zerar').addEventListener('click', function () {
    if (!confirm('Recomeçar a demonstração? Tudo o que foi mexido neste aparelho volta ao exemplo inicial.')) return;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PFX) === 0) localStorage.removeItem(k); }); } catch (e) {}
    location.reload();
  });

  /* ---------------- novo lead ---------------- */
  var dlgLead = $('#dlg-lead');
  ORIGENS.forEach(function (o) { var x = el('option', null, o); x.value = o; $('#ld-origem').appendChild(x); });
  CFG.objetivos.forEach(function (o) { var x = el('option', null, o.nome); x.value = o.id; $('#ld-obj').appendChild(x); });
  $('#ld-tel').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 11), out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 3) + ' ' + d.slice(3, 7) + '-' + d.slice(7);
    this.value = out;
  });
  $('#btn-novo-lead').addEventListener('click', function () { $('#form-lead').reset(); $('#msg-lead').innerHTML = ''; dlgLead.showModal(); });
  $('#lead-fechar').addEventListener('click', function () { dlgLead.close(); });
  $('#form-lead').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var nome = $('#ld-nome').value.trim(), tel = $('#ld-tel').value.replace(/\D/g, '');
    if (nome.length < 2) return aviso($('#msg-lead'), 'aviso-erro', 'Escreva o nome.');
    if (tel.length !== 11) return aviso($('#msg-lead'), 'aviso-erro', 'WhatsApp com DDD + 9 dígitos.');
    if (pacPorTel(tel)) return aviso($('#msg-lead'), 'aviso-erro', 'Esse WhatsApp já está no CRM.');
    var agora = new Date().toISOString();
    crm.pacientes.push({ id: 'p' + Date.now().toString(36), nome: nome, telefone: tel, origem: $('#ld-origem').value, etapa: 'novo', etapaEm: agora, criado: agora,
      objetivo: $('#ld-obj').value, modalidade: 'online', esporte: '', retornoDias: crm.ajustes.retornoDias,
      anamnese: { queixa: $('#ld-nota').value.trim() }, plano: { texto: '', atualizado: '' }, notas: $('#ld-nota').value.trim() ? [{ data: hoje(), texto: $('#ld-nota').value.trim() }] : [], medidas: [] });
    grava(); dlgLead.close(); etapaMobile = 'novo'; irAba('funil');
  });

  /* ---------------- partida ---------------- */
  if (CFG.modoDemo) $('#faixa-demo').hidden = false;
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf(PFX) === 0 && !ficha.open) pinta(); });
  var pede = new URLSearchParams(location.search).get('aba');
  irAba(pede && $('[data-aba="' + pede + '"]') ? pede : 'geral');
})();
