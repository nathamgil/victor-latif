/* =====================================================================
   Vitrine do Victor Latif (todas as páginas) — não depende do motor.
   - faixa de demo, ano, menu do celular, página atual no menu
   - faixa de frases, barras "2 kg por mês", cards de especialidade
   - fichas completas (especialidades.html) e FAQ (consulta.html)
   - calculadora de hidratação (35 ml/kg)
   - "próxima consulta livre" na capa (usa o motor quando ele carrega)
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

  $$('.ano').forEach(function (n) { n.textContent = new Date().getFullYear(); });
  if (CFG.modoDemo && $('#faixa-demo')) $('#faixa-demo').hidden = false;
  $$('[data-zap]').forEach(function (a) { a.href = CFG.whatsapp ? 'https://wa.me/' + CFG.whatsapp : CFG.whatsappLink; });

  /* ---- menu ---- */
  var bm = $('#btn-menu'), menu = $('#menu');
  if (bm && menu) {
    bm.addEventListener('click', function () {
      var ab = bm.getAttribute('aria-expanded') === 'true';
      bm.setAttribute('aria-expanded', ab ? 'false' : 'true');
      menu.classList.toggle('aberto', !ab);
    });
    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) { bm.setAttribute('aria-expanded', 'false'); menu.classList.remove('aberto'); }
    });
  }
  var aqui = location.pathname.split('/').pop() || 'index.html';
  $$('#menu a').forEach(function (a) { if (a.getAttribute('href') === aqui) a.setAttribute('aria-current', 'page'); });

  /* ---- faixa de frases (das legendas e da bio) ---- */
  var tk = $('#ticker');
  if (tk) {
    var frases = ['Sem dieta sofrida', 'Não faço terrorismo alimentar', '2 kg por mês não é fracasso', 'Doce na dieta? Pode sim',
                  'Comida de verdade, não só calorias', 'Equilíbrio, prazer e contexto estratégico', 'Sem desistências'];
    frases.concat(frases).forEach(function (f) { tk.appendChild(el('span', null, f)); });
  }

  /* ---- barras: 2 kg × 12 meses ---- */
  var barras = $('#barras'), leg = $('#barras-leg');
  if (barras) {
    for (var m = 1; m <= 12; m++) {
      var b = el('div', 'barra');
      b.style.height = (m / 12 * 100) + '%';
      b.style.animationDelay = (m * 0.05) + 's';
      b.appendChild(el('span', null, '−' + (m * 2) + ' kg'));
      barras.appendChild(b);
      leg.appendChild(el('span', null, m + 'º'));
    }
  }

  /* ---- especialidades: cards da capa ---- */
  var grade = $('#grade-esp');
  if (grade) {
    CFG.especialidades.forEach(function (s, i) {
      var a = el('a', 'esp-card');
      a.href = 'especialidades.html#' + s.id;
      a.appendChild(el('span', 'num', String(i + 1).padStart(2, '0')));
      a.appendChild(el('h3', null, s.nome));
      a.appendChild(el('p', null, s.resumo));
      a.appendChild(el('span', 'mais', 'Para quem é e como funciona →'));
      grade.appendChild(a);
    });
  }

  /* ---- fichas completas (especialidades.html) ---- */
  var fichas = $('#fichas'), indice = $('#indice');
  if (fichas) {
    var fotos = { esportiva: 'fotos/palestra.jpg', emagrecimento: 'fotos/prato.jpg', clinica: 'fotos/consultorio.jpg' };
    CFG.especialidades.forEach(function (s, i) {
      var ia = el('a', null, s.curto); ia.href = '#' + s.id; indice.appendChild(ia);
      var f = el('article', 'ficha'); f.id = s.id;
      var lado = el('div', 'ficha-lado');
      lado.appendChild(el('span', 'ficha-num', String(i + 1).padStart(2, '0')));
      lado.appendChild(el('span', 'ficha-tag', s.curto));
      if (fotos[s.id]) { var im = el('img'); im.src = fotos[s.id]; im.alt = ''; im.loading = 'lazy'; lado.appendChild(im); }
      f.appendChild(lado);
      var corpo = el('div');
      corpo.appendChild(el('h2', null, s.nome));
      corpo.appendChild(el('p', 'ficha-resumo', s.resumo));
      var blocos = el('div', 'ficha-blocos');
      var b1 = el('div', 'ficha-bloco'); b1.appendChild(el('h3', null, 'Para quem é'));
      var ul = el('ul'); s.paraQuem.forEach(function (x) { ul.appendChild(el('li', null, x)); }); b1.appendChild(ul);
      var b2 = el('div', 'ficha-bloco'); b2.appendChild(el('h3', null, 'Como funciona')); b2.appendChild(el('p', null, s.como));
      blocos.appendChild(b1); blocos.appendChild(b2);
      corpo.appendChild(blocos);
      if (s.modalidades) {
        var tg = el('div', 'tags');
        s.modalidades.forEach(function (x) { tg.appendChild(el('span', null, x)); });
        corpo.appendChild(tg);
      }
      var ac = el('div', 'acoes');
      var ag = el('a', 'btn btn-azul', 'Marcar consulta');
      ag.href = 'index.html?objetivo=' + s.objetivo + '#agendar';
      ac.appendChild(ag);
      var cs = el('a', 'btn btn-linha', 'Como é a consulta'); cs.href = 'consulta.html'; ac.appendChild(cs);
      corpo.appendChild(ac);
      corpo.appendChild(el('p', 'fonte', 'De onde veio: ' + s.fonte + '.'));
      f.appendChild(corpo);
      fichas.appendChild(f);
    });
    if (location.hash) setTimeout(function () { var x = document.getElementById(location.hash.slice(1)); if (x) x.scrollIntoView(); }, 60);
  }

  /* ---- FAQ (consulta.html) ---- */
  var faq = $('#faq');
  if (faq) {
    CFG.faq.forEach(function (q) {
      var d = el('details');
      d.appendChild(el('summary', null, q[0]));
      d.appendChild(el('p', null, q[1]));
      faq.appendChild(d);
    });
    $$('.faq details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) $$('.faq details').forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  /* ---- objetivos na capa: levam ao agendamento já filtrado ---- */
  var objCapa = $('#objetivos-capa');
  if (objCapa) {
    CFG.objetivos.forEach(function (o) {
      var b = el('a', 'obj-capa');
      b.href = 'index.html?objetivo=' + o.id + '#agendar';
      b.appendChild(el('span', 'obj-ic', o.icone));
      b.appendChild(el('span', null, o.nome));
      b.addEventListener('click', function (ev) {
        if (!CFG.escolheObjetivo || !$('#agendar-app')) return;
        ev.preventDefault();
        CFG.escolheObjetivo(o.id);
        $('#agendar').scrollIntoView({ behavior: 'smooth' });
      });
      objCapa.appendChild(b);
    });
  }

  /* ---- redes ---- */
  var redes = $('#outros-perfis');
  if (redes) {
    CFG.outrosPerfis.forEach(function (p, i) {
      if (i) redes.appendChild(document.createTextNode(' · '));
      var a = el('a', null, p.rede + ' ' + p.arroba); a.href = p.url; a.target = '_blank'; a.rel = 'noopener';
      redes.appendChild(a);
    });
  }

  /* ---- hidratação: 35 ml por kg ---- */
  var fAgua = $('#form-agua');
  if (fAgua) {
    var calcula = function () {
      var kg = parseFloat(String($('#agua-peso').value).replace(',', '.'));
      if (!(kg >= 30 && kg <= 250)) {
        $('#agua-litros').textContent = '— L';
        $('#agua-det').textContent = 'Digite um peso entre 30 e 250 kg.';
        $('#agua-nivel').style.height = '0';
        return;
      }
      var ml = Math.round(kg * 35 / 50) * 50;
      $('#agua-litros').textContent = (ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' L';
      $('#agua-det').textContent = 'por dia ≈ ' + Math.round(ml / 250) + ' copos de 250 ml ou ' +
        (Math.round(ml / 500 * 2) / 2).toLocaleString('pt-BR') + ' garrafinhas de 500 ml.';
      $('#agua-nivel').style.height = Math.min(100, ml / 4500 * 100) + '%';
    };
    fAgua.addEventListener('submit', function (ev) { ev.preventDefault(); calcula(); });
    $('#agua-peso').addEventListener('input', function () { if (this.value.length >= 2) calcula(); });
  }

  /* ---- próxima consulta livre (capa) ---- */
  var prox = $('#prox-vaga');
  if (prox) {
    document.addEventListener('tv:dados', function (ev) {
      var b = ev.detail.barbeiros[0];
      var s = ev.detail.servicos.filter(function (x) { return (x.slug || x.id) === 'primeira-online'; })[0] || ev.detail.servicos[0];
      if (!b || !s || !CFG.proximoLivre) return;
      CFG.proximoLivre(b, s).then(function (v) {
        if (!v) return;
        $('#prox-quando').textContent = CFG.diaRelativo(v.dia) + ' · ' + v.hora;
        $('#prox-reservar').onclick = function () {
          if (CFG.preparaDireto) CFG.preparaDireto(s);
          CFG.agendarDireto(b.id, s.id, v.dia, v.hora);
          $('#agendar').scrollIntoView({ behavior: 'smooth' });
        };
        prox.hidden = false;
      });
    });
  }

  /* ---- botão flutuante ---- */
  var flutua = $('.flutua'), agendar = $('#agendar');
  if (flutua) {
    var visto = false;
    var atualiza = function () { flutua.hidden = window.scrollY < window.innerHeight * 0.7 || visto; };
    if (agendar && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visto = es[0].isIntersecting; atualiza(); }, { threshold: 0.05 }).observe(agendar);
    }
    window.addEventListener('scroll', atualiza, { passive: true });
    atualiza();
  }
  window.addEventListener('load', function () {
    var alvo = location.hash === '#agendar' && document.getElementById('agendar');
    if (alvo) setTimeout(function () { alvo.scrollIntoView(); }, 150);
  });
})();
