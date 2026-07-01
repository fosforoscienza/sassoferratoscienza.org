// Markup della landing (generato da index.html). Vedi app/landing.css per gli stili.
export const LANDING_HTML = `
<!-- ===================== HEADER ===================== -->
    <header class="site-header">
      <div class="site-header__inner">
        <a href="#top" class="site-header__brand" aria-label="Sassoferrato Scienza">
          <span class="brand-text">Sassoferrato <span class="brand-text__accent">Scienza</span></span>
        </a>
        <nav class="site-nav" aria-label="Navigazione principale">
          <a href="#programma">Programma</a>
          <a href="#spettacolo">Science Show</a>
          <a href="#musica">Musica</a>
          <a href="#territorio">Territorio</a>
          <a href="#arrivare">Come arrivare</a>
          <a href="#info">Info</a>
        </nav>
        <a href="/prenota" class="btn-book">Prenota</a>
      </div>
    </header>

    <!-- ===================== HERO ===================== -->
    <section id="top" class="hero">
      <div class="hero__grid">
        <div data-reveal>
          <h1 class="hero__title">
            <span>Giochiamo</span>
            <span>con la</span>
            <span>scienza</span>
          </h1>
          <p class="hero__lead">
            Una giornata di laboratori, spettacoli e meraviglia scientifica per tutta la famiglia, tra le piazze di Sassoferrato. Il divertimento e la curiosità sono le chiavi dell'apprendimento.
          </p>
          <div class="hero__chips">
            <span class="chip"><span class="chip__dot" style="background:#e85aa0"></span>24 LUGLIO 2026</span>
            <span class="chip"><span class="chip__dot" style="background:#f08c2e"></span>DALLE 17 ALLE 22</span>
            <span class="chip"><span class="chip__dot" style="background:#16b39a"></span>PIAZZA BARTOLO · CORSO CAVOUR</span>
            <span class="chip chip--accent"><span class="chip__dot" style="background:#0f9bd8"></span>INGRESSO LIBERO</span>
          </div>
          <div class="hero__cta">
            <a href="#programma" class="btn btn--primary">Esplora il programma →</a>
            <a href="/prenota" class="btn btn--ghost">Prenota un laboratorio</a>
          </div>
        </div>

        <div class="hero__art" data-reveal data-reveal-delay="120">
          <div class="hero__spiral-wrap">
            <img class="hero__spiral" src="assets/spiral.png" alt="" aria-hidden="true">
          </div>
          <img class="hero__atom" src="assets/atom.png" alt="" aria-hidden="true">
          <img class="hero__dna" src="assets/dna.png" alt="" aria-hidden="true">
          <div class="portrait portrait--1"><img src="assets/sci-01.png" alt="" aria-hidden="true"></div>
          <div class="portrait portrait--2"><img src="assets/sci-04.png" alt="" aria-hidden="true"></div>
          <div class="portrait portrait--3"><img src="assets/sci-02.png" alt="" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <!-- ===================== INTRO + MARQUEE ===================== -->
    <section class="intro">
      <div class="intro__head" data-reveal>
        <div class="intro__eyebrow">La scienza alla portata di tutti</div>
        <p class="intro__quote">
          Attraverso attività coinvolgenti e stimolanti, la scienza diventa un <span class="c-blue">gioco</span>, una <span class="c-pink">scoperta</span>, una <span class="c-orange">meraviglia</span> da vivere insieme.
        </p>
      </div>
      <div class="marquee" data-reveal>
        <div class="marquee__mask">
          <div class="marquee__track" data-marquee-track>
            <div class="marquee__item"><img src="assets/sci-01.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-02.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-03.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-04.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-05.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-06.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-07.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-08.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-09.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-10.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-11.png" alt="" aria-hidden="true"></div>
            <div class="marquee__item"><img src="assets/sci-12.png" alt="" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== PROGRAMMA / LABORATORI ===================== -->
    <section id="programma" class="section">
      <div class="container">
        <div class="section-head" data-reveal>
          <div class="eyebrow">I laboratori</div>
          <h2 id="laboratori">Mettiti alla prova,<br>esperimento dopo esperimento</h2>
          <p>Cinque laboratori per scoprire la fisica, la matematica, l'astronomia, la natura e i sensi. Ogni pallino indica una replica da cliccare per prenotare il turno.</p>
        </div>

        <!--ORARI_GRID-->

        <div class="lab-grid">

          <article class="lab-card lab-card--blue" data-reveal>
            <div class="lab-card__cat"><span></span>Tinkering</div>
            <h3 class="lab-card__title">Discesa libera</h3>
            <p class="lab-card__sub">Si freni chi può</p>
            <div class="lab-card__meta">
              <span class="tag">17.30–22.00</span>
              <span class="tag tag--age">ETÀ 8+</span>
            </div>
            <p class="lab-card__desc">Usa materiali di uso quotidiano per costruire "qualcosa" da far scivolare su una rampa di legno. L'obiettivo? Arrivare per ultimi al traguardo! Riuscirai a sfruttare la fisica per rallentare?</p>
            <a href="/prenota/__LAB1__" class="lab-card__link">Prenota →</a>
          </article>

          <article class="lab-card lab-card--green" data-reveal data-reveal-delay="70">
            <div class="lab-card__cat"><span></span>Matematica</div>
            <h3 class="lab-card__title">Labirinti matematici</h3>
            <p class="lab-card__sub">Riuscirai a trovare l'uscita?</p>
            <div class="lab-card__meta">
              <span class="tag">17.30–22.00</span>
              <span class="tag tag--age">ETÀ 6+</span>
            </div>
            <p class="lab-card__desc">Preparati a perderti… nella matematica! Tra curve, incroci e scelte da fare, i labirinti matematici giganti mettono alla prova logica, calcoli e strategia. Un gioco a grandezza naturale dove ogni passo è un'operazione.</p>
            <span class="lab-card__libera">Attività a fruizione libera</span>
          </article>

          <article class="lab-card lab-card--indigo" data-reveal data-reveal-delay="140">
            <div class="lab-card__cat"><span></span>Astronomia</div>
            <h3 class="lab-card__title">Costruiamo l'astrolabio</h3>
            <p class="lab-card__sub">Il fascino del cielo visto da vicino</p>
            <div class="lab-card__meta">
              <span class="tag">17.30 &amp; 21.00</span>
              <span class="tag">45 MIN</span>
              <span class="tag tag--age">ETÀ 8+</span>
            </div>
            <p class="lab-card__desc">Portati a casa una notte stellata. Esploriamo le maggiori costellazioni del nostro cielo e i miti che le animano. Costruiamo insieme un astrolabio per orientarci nella volta celeste.</p>
            <a href="/prenota/__LAB3__" class="lab-card__link">Prenota →</a>
          </article>

          <article class="lab-card lab-card--teal" data-reveal>
            <div class="lab-card__cat"><span></span>Natura · VR</div>
            <h3 class="lab-card__title">La natura a 360°</h3>
            <p class="lab-card__sub">Le aree naturalistiche delle Marche nei visori VR</p>
            <div class="lab-card__meta">
              <span class="tag">17.30–18.00 &amp; 21.00–21.45</span>
              <span class="tag">15 MIN</span>
              <span class="tag tag--age">ETÀ 8+</span>
            </div>
            <p class="lab-card__desc">All'interno del progetto "Tra borghi e natura", grazie ai visori di realtà virtuale immersivi a 360°, vivrai un video emozionale girato nei luoghi naturalistici più affascinanti delle Marche.</p>
            <a href="/prenota/__LAB4__" class="lab-card__link">Prenota →</a>
          </article>

          <article class="lab-card lab-card--pink" data-reveal data-reveal-delay="70">
            <div class="lab-card__cat"><span></span>Percezione</div>
            <h3 class="lab-card__title">Occhio all'illusione</h3>
            <p class="lab-card__sub">Lasciamoci ingannare</p>
            <div class="lab-card__meta">
              <span class="tag">17.30 / 18.30 / 19.30 / 21.00</span>
              <span class="tag tag--age">ETÀ 8+</span>
            </div>
            <p class="lab-card__desc">Scopriamo come funzionano occhi e cervello! Tra giochi, esperimenti e illusioni ottiche, seguiamo il viaggio della luce che entra nei nostri occhi e diventa le immagini che vediamo ogni giorno.</p>
            <a href="/prenota/__LAB5__" class="lab-card__link">Prenota →</a>
          </article>

          <article class="lab-card lab-card--cta" data-reveal data-reveal-delay="140">
            <div class="lab-card__kicker">Posti limitati</div>
            <h3>Prenota il tuo laboratorio</h3>
            <p>I laboratori sono gratuiti ma a numero chiuso. Assicurati il posto prenotando online.</p>
            <a href="/prenota" class="btn-cta">Prenota ora →</a>
          </article>

        </div>
      </div>
    </section>

    <!-- ===================== SCIENCE SHOW ===================== -->
    <section id="spettacolo" class="section">
      <div class="container">
        <div class="show-panel">
          <div class="show-panel__grid">
            <div class="show-panel__body" data-reveal>
              <div class="eyebrow show-panel__eyebrow">Science Show</div>
              <h2>La scienza<br>fa spettacolo!</h2>
              <p>Il Dottor Brown stupirà il pubblico con divertenti e interessantissimi esperimenti scientifici di varie forme e colori.</p>
              <div class="show-box">
                <div class="show-box__kicker">Lo spettacolo</div>
                <h3>Cos'ha in testa il Dottor Brown</h3>
                <div class="show-box__meta">
                  <span class="tag tag--hot">ORE 19.00</span>
                  <span class="tag">50 MIN</span>
                  <span class="tag">ETÀ 6+</span>
                  <span class="tag">PARTECIPANTI SENZA LIMITE</span>
                </div>
                <p>Cosa ha in testa uno scienziato mentre cerca di fare una nuova scoperta? Caliamoci nei loro panni per scoprire come gli oggetti più disparati possono nascondere interessantissimi fenomeni scientifici!</p>
              </div>
            </div>
            <div class="show-panel__art" data-reveal data-reveal-delay="120">
              <img src="assets/atom.png" alt="" aria-hidden="true">
              <div class="show-panel__caption">Esperimenti dal vivo · tutte le ore</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== GRAN FINALE ===================== -->
    <section id="musica" class="finale">
      <div class="finale__bg" aria-hidden="true"><img src="assets/spiral.png" alt=""></div>
      <div class="finale__grid">
        <div data-reveal>
          <div class="eyebrow finale__eyebrow">Gran finale in musica</div>
          <h2>“Ancora Tu”</h2>
          <p class="finale__sub">Omaggio a Lucio Battisti con i Big Cedars</p>
          <span class="finale__chip"><span></span>ORE 21:30 · PIAZZA BARTOLO</span>
          <p class="finale__desc">Le più belle canzoni di Lucio Battisti per concludere insieme una giornata all'insegna della curiosità, della scoperta e della condivisione.</p>
        </div>
        <div class="finale__art" data-reveal data-reveal-delay="120">
          <img class="finale__singer" src="assets/singer.png" alt="Cantante dei Big Cedars">
          <div class="finale__logo">
            <img src="assets/logo-bigcedars.png" alt="Big Cedars">
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== TERRITORIO ===================== -->
    <section id="territorio" class="section terr">
      <div class="terr-grid">
        <div data-reveal>
          <div class="eyebrow terr__eyebrow">Tra scienza e territorio</div>
          <h2>I sapori del territorio</h2>
          <p>Tra un laboratorio e una scoperta, concediti una pausa tra i sapori del territorio. Durante tutta la manifestazione saranno presenti stand gastronomici con la tradizionale polenta Ottofile di Mais Rosso di Roccacontrada e altre specialità locali.</p>
          <p>Un'occasione per conoscere una varietà storica recuperata e valorizzata nel territorio di Arcevia: simbolo di una tradizione agricola che continua a vivere ancora oggi.</p>
        </div>
        <div data-reveal data-reveal-delay="120">
          <div class="terr-card">
            <div class="terr-card__kicker">Specialità del giorno</div>
            <div class="terr-card__title">Polenta Ottofile</div>
            <p>di Mais Rosso di Roccacontrada — e altre specialità locali, lungo tutto il percorso della festa.</p>
            <div class="terr-card__tags">
              <span>STAND GASTRONOMICI</span>
              <span>TRADIZIONE DI ARCEVIA</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== COME ARRIVARE ===================== -->
    <section id="arrivare" class="section">
      <div class="container">
        <div class="arrive-head" data-reveal>
          <div class="eyebrow">Come arrivare</div>
          <h2>Dove e quando</h2>
        </div>
        <div class="arrive-grid">
          <div class="info-card" data-reveal>
            <div class="info-card__list">
              <div class="info-row">
                <div class="info-row__label">DATA</div>
                <div class="info-row__value">Venerdì 24 luglio 2026</div>
              </div>
              <div class="info-divider"></div>
              <div class="info-row">
                <div class="info-row__label">ORARIO</div>
                <div class="info-row__value">Dalle 17:00 alle 22:00<br><span>Gran finale in musica alle 21:30</span></div>
              </div>
              <div class="info-divider"></div>
              <div class="info-row">
                <div class="info-row__label">LUOGO</div>
                <div class="info-row__value">Piazza Bartolo e Corso Cavour<br><span>Centro storico di Sassoferrato (AN)</span></div>
              </div>
              <div class="info-divider"></div>
              <div class="info-row">
                <div class="info-row__label">INGRESSO</div>
                <div class="info-row__value info-row__value--accent">Libero e gratuito</div>
              </div>
            </div>
            <a class="btn btn--primary" href="https://www.google.com/maps/search/?api=1&amp;query=Piazza+Gaspare+Bartolo+Sassoferrato" target="_blank" rel="noopener">Apri in Google Maps →</a>
          </div>

          <div class="map" data-reveal data-reveal-delay="120" role="img" aria-label="Mappa stilizzata di Piazza Bartolo a Sassoferrato">
            <div class="map__road--1"></div>
            <div class="map__road--2"></div>
            <div class="map__road--3"></div>
            <div class="map__pin"><div class="map__pin-mark"><span></span></div></div>
            <div class="map__label">Piazza Bartolo</div>
            <div class="map__credit">Sassoferrato · AN</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== FAQ ===================== -->
    <section id="info" class="section">
      <div class="faq-wrap">
        <div class="faq-head" data-reveal>
          <div class="eyebrow">Info pratiche</div>
          <h2>Domande frequenti</h2>
        </div>
        <div class="faq-list" data-reveal>

          <div class="faq-item" data-faq>
            <button class="faq-q" type="button" data-faq-q>Quanto costa l'ingresso?<span class="faq-icon" data-faq-ic aria-hidden="true">+</span></button>
            <div class="faq-a" data-faq-a>L'ingresso è completamente libero e gratuito, per tutta la durata della manifestazione. Non serve biglietto.</div>
          </div>

          <div class="faq-item" data-faq>
            <button class="faq-q" type="button" data-faq-q>Devo prenotare i laboratori?<span class="faq-icon" data-faq-ic aria-hidden="true">+</span></button>
            <div class="faq-a" data-faq-a>Sì, è possibile prenotare i laboratori su <strong>sassoferratoscienza.org</strong>. I posti sono limitati: ti consigliamo di prenotare in anticipo. Lo Science Show e il concerto sono invece a ingresso libero senza prenotazione.</div>
          </div>

          <div class="faq-item" data-faq>
            <button class="faq-q" type="button" data-faq-q>A che età sono adatte le attività?<span class="faq-icon" data-faq-ic aria-hidden="true">+</span></button>
            <div class="faq-a" data-faq-a>Ci sono attività dai 6 anni in su. Ogni laboratorio indica l'età consigliata (6+ o 8+). Lo spettacolo del Dottor Brown è adatto a partire dai 6 anni, ed è pensato per tutta la famiglia.</div>
          </div>

          <div class="faq-item" data-faq>
            <button class="faq-q" type="button" data-faq-q>Si può mangiare sul posto?<span class="faq-icon" data-faq-ic aria-hidden="true">+</span></button>
            <div class="faq-a" data-faq-a>Sì! Saranno presenti stand gastronomici con la tradizionale polenta Ottofile di Mais Rosso di Roccacontrada e altre specialità locali lungo tutto il percorso della festa.</div>
          </div>

          <div class="faq-item" data-faq>
            <button class="faq-q" type="button" data-faq-q>Dove si svolge la festa?<span class="faq-icon" data-faq-ic aria-hidden="true">+</span></button>
            <div class="faq-a" data-faq-a>In Piazza Bartolo e lungo Corso Cavour, nel cuore del centro storico di Sassoferrato (AN), uno dei Borghi più belli d'Italia.</div>
          </div>

        </div>
      </div>
    </section>

    <!-- ===================== PRENOTA — CTA ===================== -->
    <section id="prenota" class="book-band">
      <div class="container">
        <div class="book-card" data-reveal>
          <div class="book-card__bg" aria-hidden="true"><img src="assets/spiral.png" alt=""></div>
          <div class="book-card__inner">
            <div class="book-card__kicker">Ti aspettiamo il 24 luglio</div>
            <h2>Prenota il tuo posto<br>alla festa della scienza</h2>
            <p>I laboratori sono gratuiti ma a posti limitati. Prenota online e vivi una giornata di scoperte tra le piazze di Sassoferrato.</p>
            <a href="/prenota" class="btn-cta">Prenota un laboratorio →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== PARTNER ===================== -->
    <section class="partners">
      <div class="container" data-reveal>
        <div class="partners__strip">
          <div class="partner-item"><div class="partner-logo"><img src="assets/logo-parrocchie.png" alt="Parrocchie di Sassoferrato" style="max-height:64px"></div></div>
          <div class="partner-item"><span class="partner-cap">con il patrocinio</span><div class="partner-logo"><img src="assets/crest-sassoferrato.png" alt="Comune di Sassoferrato" style="max-height:60px"></div></div>
          <div class="partner-item"><div class="partner-logo"><img src="assets/logo-borghi.png" alt="Uno dei Borghi più belli d'Italia" style="max-height:70px"></div></div>
          <div class="partner-item"><div class="partner-logo"><img src="assets/logo-proloco.png" alt="Pro Loco Sassoferrato" style="max-height:64px"></div></div>
          <div class="partner-item"><div class="partner-logo" style="min-width:172px"><img src="assets/logo-fosforo.png" alt="Fosforo, la festa della scienza" style="max-height:40px"></div></div>
          <div class="partner-item"><span class="partner-cap">con il contributo di</span><div class="partner-logo" style="min-width:182px"><img src="assets/logo-fondazionecr.png" alt="Fondazione CR Fabriano e Cupramontana" style="max-height:46px"></div></div>
          <div class="partner-item"><div class="partner-logo" style="min-width:140px"><img src="assets/logo-epic.png" alt="EPIC" style="max-height:52px"></div></div>
          <div class="partner-item"><div class="partner-logo"><img src="assets/logo-ambito.png" alt="Ambito Territoriale" style="max-height:50px"></div></div>
          <div class="partner-item"><div class="partner-logo" style="min-width:150px"><img src="assets/logo-teatropirata.png" alt="Teatro Giovani Teatro Pirata" style="max-height:54px"></div></div>
          <div class="partner-item"><div class="partner-logo" style="min-width:140px"><img src="assets/logo-itinera.png" alt="Itinera" style="max-height:56px"></div></div>
          <div class="partner-item"><span class="partner-cap">con il sostegno di</span><div class="partner-logo"><img src="assets/logo-cariverona.png" alt="Fondazione Cariverona" style="max-height:44px"></div></div>
        </div>
      </div>
    </section>

    <!-- ===================== FOOTER ===================== -->
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <span class="footer-brand">Sassoferrato <span class="footer-brand__accent">Scienza</span></span>
            <p class="footer__about">La festa della scienza arriva a Sassoferrato. Una giornata di laboratori, spettacoli e meraviglia per tutta la famiglia.</p>
          </div>
          <div>
            <div class="footer__h">Esplora</div>
            <div class="footer__links">
              <a href="#programma">Programma</a>
              <a href="#spettacolo">Science Show</a>
              <a href="#musica">Gran finale in musica</a>
              <a href="#info">Info pratiche</a>
            </div>
          </div>
          <div>
            <div class="footer__h">Quando &amp; dove</div>
            <div class="footer__where">Venerdì 24 luglio 2026<br>Dalle 17:00 alle 22:00<br>Piazza Bartolo e Corso Cavour<br>Sassoferrato (AN)<br><strong>Ingresso libero</strong></div>
          </div>
          <div>
            <div class="footer__h">Prenotazioni</div>
            <p class="footer__note">Prenota i laboratori online.</p>
            <a href="/prenota" class="footer__book">Prenota →</a>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-bottom__copy">© 2026 Sassoferrato Scienza · Fosforo — la festa della scienza</div>
          <div class="footer-bottom__url">sassoferratoscienza.org</div>
        </div>
      </div>
    </footer>
`
