/* =====================================================================
   Peças do agendamento de CONSULTA — carrega ANTES de agenda.js.
   Etapas na tela: Consulta (modalidade → objetivo → 1ª ou retorno)
   → Dia e horário → Seus dados + pré-anamnese → WhatsApp.
   - modalidade filtra as consultas (CFG.filtroServico)
   - pré-anamnese curta junto dos dados (some no retorno)
   - entrega tudo ao motor como observação (CFG.montaObs / resumoProjeto)
   - no fim, abre o WhatsApp do Victor com o resumo copiado
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.TV;
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  if (!$('#agendar-app')) return;

  var SEM = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];
  var modalidade = null, objetivo = null;
  var ICONES = {
    online: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/></svg>',
    presencial: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  };

  function cfgDe(s) { return CFG.servicoPor(s.slug || s.id) || CFG.servicoPor(s.nome) || s; }
  CFG.filtroServico = function (s) { return !modalidade || cfgDe(s).modalidade === modalidade.id; };

  /* ---- modalidade ---- */
  var boxMod = $('#mod-cards');
  CFG.modalidades.forEach(function (m) {
    var b = el('button', 'mod');
    b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-mod', m.id);
    var ic = el('span', 'mod-ic'); ic.innerHTML = ICONES[m.id] || ''; b.appendChild(ic);
    var t = el('span'); t.appendChild(el('strong', null, m.nome)); t.appendChild(el('span', null, m.linha)); b.appendChild(t);
    b.addEventListener('click', function () { escolheModalidade(m); });
    boxMod.appendChild(b);
  });
  function escolheModalidade(m, quieto) {
    modalidade = m;
    $$('#mod-cards .mod').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mod') === m.id ? 'true' : 'false'); });
    $('#obj-box').hidden = false;
    if (objetivo) $('#trat-box').hidden = false;
    if (CFG.repintaServicos) CFG.repintaServicos();
    if (!quieto) (objetivo ? $('#trat-box') : $('#obj-box')).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---- objetivo ---- */
  var boxObj = $('#obj-chips');
  CFG.objetivos.forEach(function (o) {
    var b = el('button', 'obj');
    b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-obj', o.id);
    b.appendChild(el('span', 'obj-ic', o.icone));
    b.appendChild(el('span', null, o.nome));
    b.addEventListener('click', function () { escolheObjetivo(o); });
    boxObj.appendChild(b);
  });
  function escolheObjetivo(o, quieto) {
    objetivo = o;
    $$('#obj-chips .obj').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-obj') === o.id ? 'true' : 'false'); });
    $('#obj-box').hidden = false;
    if (modalidade) {
      $('#trat-box').hidden = false;
      if (!quieto) $('#trat-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  CFG.escolheObjetivo = function (id) {
    var o = CFG.objetivos.filter(function (x) { return x.id === id; })[0];
    if (o) escolheObjetivo(o, true);
  };
  // "Reservar esse horário" da capa: a modalidade vem da consulta escolhida
  CFG.preparaDireto = function (s) {
    var m = CFG.modalidadePor(cfgDe(s).modalidade);
    if (m) escolheModalidade(m, true);
  };

  /* ---- chips (escolha única; data-multi = várias) ---- */
  $$('[data-grupo]').forEach(function (box) {
    box.addEventListener('click', function (ev) {
      var c = ev.target.closest('.chip'); if (!c) return;
      var ligado = c.getAttribute('aria-pressed') === 'true';
      if (!box.hasAttribute('data-multi')) Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', ligado ? 'false' : 'true');
    });
  });
  function respostas() {
    if (ehRetorno()) return [];
    return $$('[data-grupo]').map(function (g) {
      var cs = Array.prototype.map.call(g.querySelectorAll('.chip[aria-pressed="true"]'), function (c) { return c.textContent; });
      return cs.length ? g.getAttribute('data-rotulo') + ': ' + cs.join(', ') : '';
    }).filter(Boolean);
  }
  function ehRetorno() { var s = CFG.servicoAtual && CFG.servicoAtual(); return !!(s && cfgDe(s).tipo === 'retorno'); }

  /* ---- a etapa muda conforme a consulta ---- */
  document.addEventListener('tv:etapa', function (ev) {
    var n = ev.detail.etapa, s = ev.detail.servico;
    if (n === 4 && s) {
      var c = cfgDe(s), dias = c.dias || [];
      $('#dica-dia').textContent = c.modalidade === 'presencial'
        ? 'Presencial atende ' + dias.map(function (d) { return SEM[d]; }).join(', ').replace(/, ([^,]*)$/, ' e $1') + '. Os outros dias aparecem apagados.'
        : 'On-line: o link da chamada chega pelo WhatsApp. Escolha o dia e o horário.';
    }
    if (n === 5) {
      var ret = ehRetorno();
      $$('#pre-anamnese .pergunta, #pre-anamnese .campos-2').forEach(function (x) { x.hidden = ret; });
      $('#pre-anamnese .anamnese-tit').firstChild.textContent = ret ? 'Para o retorno ' : 'Pré-anamnese rápida ';
      $('#cli-obs-rot').textContent = ret ? 'Como foi desde a última consulta?' : 'O que mais te atrapalha hoje?';
    }
  });

  /* ---- ganchos do motor ---- */
  CFG.anexos = function () { return []; };
  CFG.montaObs = function () {
    var relato = $('#cli-obs').value.trim();
    var peso = $('#pa-peso').value, alt = $('#pa-altura').value;
    var s = CFG.servicoAtual && CFG.servicoAtual();
    var m = modalidade || (s && CFG.modalidadePor(cfgDe(s).modalidade));
    return [
      'Modalidade: ' + (m ? m.nome : 'não informada'),
      'Objetivo: ' + (objetivo ? objetivo.nome : 'não informado')
    ].concat(respostas(), [
      !ehRetorno() && peso ? 'Peso aproximado: ' + peso + ' kg' : '',
      !ehRetorno() && alt ? 'Altura: ' + alt + ' cm' : '',
      relato ? (ehRetorno() ? 'Desde a última consulta: ' : 'O que atrapalha: ') + relato : ''
    ]).filter(Boolean).join('\n');
  };
  CFG.resumoProjeto = function () { return ['Objetivo', objetivo ? objetivo.nome : 'A conversar na consulta']; };
  CFG.limpaProjeto = function () {
    $$('#pre-anamnese .chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    $('#pa-peso').value = ''; $('#pa-altura').value = '';
    modalidade = null; objetivo = null;
    $$('#mod-cards .mod, #obj-chips .obj').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    $('#obj-box').hidden = true; $('#trat-box').hidden = true;
  };

  /* ---- fim: WhatsApp do Victor (link da bio não aceita texto pronto) ---- */
  function copia(aviso) {
    var txt = CFG.ultimoResumo || '', saida = $('#ok-copiado');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { saida.textContent = aviso; }, function () { saida.textContent = txt; });
    } else saida.textContent = txt;
  }
  document.addEventListener('tv:agendado', function () {
    var zap = $('#ok-zap');
    if (!(CFG.ultimoDestino || {}).zap && CFG.whatsappLink) {
      zap.href = CFG.whatsappLink;
      zap.textContent = 'Copiar resumo e abrir o WhatsApp';
      zap.classList.remove('btn-direct');
      CFG.ultimoDestino = { zap: '', link: CFG.whatsappLink };
    }
  });
  $('#ok-zap').addEventListener('click', function () {
    if (!(CFG.ultimoDestino || {}).zap) copia('Resumo copiado. É só colar na conversa do WhatsApp que abriu.');
  });
  $('#ok-copiar').addEventListener('click', function () { copia('Resumo copiado.'); });

  /* ---- chegou de outra página: ?objetivo=emagrecer&modalidade=online ---- */
  document.addEventListener('tv:dados', function () {
    var q = new URLSearchParams(location.search);
    var obj = q.get('objetivo'), mod = q.get('modalidade');
    if (obj) CFG.escolheObjetivo(obj);
    if (mod && CFG.modalidadePor(mod)) escolheModalidade(CFG.modalidadePor(mod), true);
  });
})();
