import React, { useEffect, useState } from "https://esm.sh/react@18.3.1";
import { createPortal } from "https://esm.sh/react-dom@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(React.createElement);

const AUTH_KEY = "mwangaza_auth";
const adminUrl = new URL("./admin/", import.meta.url).href;

const partnerLogos = ["Ministere", "PNUD", "ONG Congo", "UNDP", "Transparency Intl"];

const problemCards = [
  {
    icon: "⊘",
    title: "La peur du silence",
    text: "Les victimes n'osent pas signaler par peur des represailles. L'impunite s'installe durablement.",
    tone: "red"
  },
  {
    icon: "⌁",
    title: "Aucun canal securise",
    text: "Les boites physiques sont manipulees. Les emails professionnels ne sont pas anonymes.",
    tone: "orange"
  },
  {
    icon: "△",
    title: "Donnees inexploitables",
    text: "Les rares signalements arrivent epars, sans structure. Impossible d'agir vite.",
    tone: "yellow"
  },
  {
    icon: "↘",
    title: "Confiance citoyenne en chute",
    text: "Sans preuve d'action, les citoyens se decouragent. La legitimite institutionnelle s'effrite.",
    tone: "violet"
  }
];

const workflowCards = [
  {
    step: "01",
    icon: "◔",
    title: "Le citoyen envoie un message WhatsApp",
    text: "Aucune app a telecharger. Depuis le numero dedie, il decrit l'abus en quelques lignes.",
    side: "left"
  },
  {
    step: "02",
    icon: "✣",
    title: "L'IA analyse et classe automatiquement",
    text: "Le moteur extrait les faits, evalue la credibilite et categorise le signalement en moins de 2 secondes.",
    side: "right"
  },
  {
    step: "03",
    icon: "⬒",
    title: "L'identite est effacee, les donnees chiffrees",
    text: "Aucune metadonnee personnelle n'est conservee. Le dossier devient anonyme et securise AES-256.",
    side: "left"
  },
  {
    step: "04",
    icon: "▥",
    title: "Le gestionnaire recoit une alerte actionnable",
    text: "Le dashboard presente les faits, la severite, la localisation et la priorite pour agir sans delai.",
    side: "right"
  }
];

const features = [
  {
    tag: "Accessibilite",
    title: "Bot WhatsApp integre",
    text: "Les citoyens signalent comme ils envoient un SMS. Zero friction, zero formation.",
    icon: "◔",
    tone: "green"
  },
  {
    tag: "Intelligence",
    title: "IA de classification",
    text: "Categorisation automatique, detection des doublons, scoring de credibilite. Zero traitement manuel.",
    icon: "✣",
    tone: "violet"
  },
  {
    tag: "Securite",
    title: "Anonymat total garanti",
    text: "Chiffrement AES-256, aucune metadonnee stockee, architecture zero-knowledge.",
    icon: "⬒",
    tone: "blue"
  },
  {
    tag: "Analytics",
    title: "Dashboard analytique",
    text: "Visualisez les tendances, cartographiez les zones a risque et suivez les KPIs en temps reel.",
    icon: "▥",
    tone: "amber"
  },
  {
    tag: "Temps reel",
    title: "Alertes & notifications",
    text: "Recevez une alerte instantanee pour les signalements urgents et priorisez avec le scoring IA.",
    icon: "◌",
    tone: "red"
  },
  {
    tag: "Scalabilite",
    title: "Multi-institutions",
    text: "Gerez plusieurs services, ministeres ou regions depuis un seul tableau de bord.",
    icon: "◎",
    tone: "green"
  }
];

const demoTabs = {
  whatsapp: {
    label: "Citoyen — WhatsApp",
    leftTitle: "MwangazaMail Bot",
    leftStatus: "En ligne",
    messages: [
      { tone: "sent", text: "Bonjour, je souhaite signaler un abus.", time: "14:32" },
      { tone: "received", text: "Bienvenue sur MwangazaMail. Votre signalement est anonyme et securise. Decrivez l'incident en quelques mots.", time: "14:32" },
      { tone: "sent", text: "L'agent a la douane de Matadi m'a demande 50$ pour passer sans inspection.", time: "14:33" },
      { tone: "received", text: "Signalement recu et enregistre. Reference #2891. Une equipe analyse votre dossier sous 24h.", time: "14:33" }
    ],
    bullets: [
      "Anonymisation immediate — aucun numero stocke",
      "Analyse IA en < 2 secondes",
      "Scoring de severite automatique",
      "Transmission chiffree au dashboard gestionnaire"
    ],
    cta: "Tester le bot en live"
  },
  dashboard: {
    label: "Gestionnaire — Dashboard",
    metrics: [
      ["Signalements", "1,284", "+12%"],
      ["Traites", "1,091", "+8%"],
      ["En cours", "143", "stable"],
      ["Taux resolution", "85%", "+5pts"]
    ],
    bars: [36, 48, 33, 61, 52, 70, 42, 78, 65, 74, 58, 86, 77, 81],
    incidents: [
      ["Corruption", "Douanes — Matadi · Il y a 3 min", "Nouveau"],
      ["Surfacturation", "Mairie — Goma · Il y a 18 min", "En cours"],
      ["Abus autorite", "Police — Kinshasa · Il y a 45 min", "Resolu"]
    ]
  },
  reports: {
    label: "Analyste — Rapports",
    stats: [
      ["50+", "Institutions deployees"],
      ["15k+", "Signalements traites"],
      ["85%", "Taux de resolution moyen"],
      ["< 18h", "Temps de reponse moyen"]
    ],
    quotes: [
      "En 3 mois d'utilisation, nous avons recu 4x plus de signalements exploitables qu'avec notre ancienne boite a suggestions.",
      "La facilite d'utilisation est remarquable. Nos agents de terrain signalent maintenant via WhatsApp sans formation.",
      "Ce que j'apprecie le plus : la protection totale des lanceurs d'alerte. C'est un changement culturel reel."
    ]
  }
};

const pricing = [
  ["Pilote", "$499/mois", ["1 institution", "Support standard", "Rapports de base"]],
  ["Standard", "$1,500/mois", ["3 institutions", "Automatisation IA complete", "Dashboard avance"]],
  ["Premium", "$7,500/mois", ["Illimite", "SLA dedie", "Integrations sur mesure"]]
];

const faqItems = [
  ["Combien de temps pour le deploiement ?", "Moins de 7 jours pour une institution, avec onboarding et configuration inclus."],
  ["Faut-il une application mobile ?", "Non. Tout se passe via WhatsApp pour les citoyens et via navigateur pour les gestionnaires."],
  ["Les donnees sont-elles securisees ?", "Oui, avec chiffrement, anonymisation et controle d'acces strict selon les roles."],
  ["Peut-on connecter plusieurs institutions ?", "Oui, la plateforme est concue pour des structures multi-services et multi-regions."]
];

function LoginPortal({ isOpen, onClose, onSubmit }) {
  const [email, setEmail] = useState("admin@mwangaza.cd");
  const [password, setPassword] = useState("demo123");

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    html`
      <div className="portal-backdrop" onClick=${onClose}>
        <div className="portal-card" onClick=${(event) => event.stopPropagation()}>
          <button className="portal-close" type="button" onClick=${onClose}>×</button>
          <div className="portal-badge">Portail admin</div>
          <h3>Connexion espace admin</h3>
          <p>Connectez-vous pour acceder au dashboard, aux utilisateurs, aux abonnements et aux analytics.</p>
          <form
            className="portal-form"
            onSubmit=${(event) => {
              event.preventDefault();
              if (!email.trim() || !password.trim()) return;
              onSubmit();
            }}
          >
            <label htmlFor="portal-email">Email</label>
            <input id="portal-email" type="email" value=${email} onInput=${(event) => setEmail(event.target.value)} />
            <label htmlFor="portal-password">Mot de passe</label>
            <input id="portal-password" type="password" value=${password} onInput=${(event) => setPassword(event.target.value)} />
            <div className="portal-footer">
              <span>Demo credentials pre-remplies pour tester rapidement.</span>
              <button className="btn btn-solid" type="submit">Entrer dans le dashboard</button>
            </div>
          </form>
        </div>
      </div>
    `,
    document.body
  );
}

function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [demoTab, setDemoTab] = useState("whatsapp");

  const goToAdmin = () => {
    localStorage.setItem(AUTH_KEY, "true");
    window.location.assign(adminUrl);
  };

  return html`
    <div className="landing-shell">
      <header className="site-header">
        <a className="brand" href="#hero">
          <span className="brand-mark"></span>
          <span className="brand-text">MwangazaMail</span>
        </a>
        <nav className="header-nav">
          <a href="#solution">Solution</a>
          <a href="#fonctionnalites">Fonctionnalites</a>
          <a href="#demo">Demo</a>
          <a href="#tarification">Tarification</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="header-actions">
          <button className="btn btn-outline" type="button" onClick=${() => setLoginOpen(true)}>Se connecter</button>
          <a className="btn btn-solid" href="#contact">Demander une demo →</a>
        </div>
      </header>

      <main>
        <section className="hero hero-rich" id="hero">
          <div className="hero-headline">
            <div className="trust-pill">★★★★★ Utilise par +50 institutions en RDC</div>
            <h1>
              Signalez la corruption
              <span>via WhatsApp, en securite</span>
            </h1>
            <p className="lead lead-large">
              MwangazaMail permet aux citoyens de signaler anonymement fraudes et abus d'autorite.
              Les institutions recoivent des rapports actionnables en temps reel <strong>sans risque, sans friction.</strong>
            </p>
            <div className="hero-actions hero-actions-large">
              <a className="btn btn-solid btn-large" href="#contact">Demander une demo gratuite →</a>
              <a className="btn btn-outline btn-large" href="#demo">Voir la demo</a>
            </div>
            <ul className="security-points security-points-large">
              <li>Anonymat total</li>
              <li>Chiffrement AES-256</li>
              <li>Via WhatsApp</li>
              <li>Dashboard temps reel</li>
            </ul>
          </div>

          <div className="browser-mock">
            <div className="browser-top">
              <div className="browser-dots"><span></span><span></span><span></span></div>
              <div className="browser-url">app.mwangazamail.cd/dashboard</div>
            </div>
            <div className="browser-body">
              <div className="browser-kpis">
                ${demoTabs.dashboard.metrics.map(
                  ([label, value, delta]) => html`
                    <article className="browser-kpi" key=${label}>
                      <span>${label}</span>
                      <strong>${value}</strong>
                      <em>${delta}</em>
                    </article>
                  `
                )}
              </div>
              <div className="browser-chart-card">
                <div className="browser-chart-head">
                  <b>Signalements par semaine</b>
                  <span>Derniers 30 jours</span>
                </div>
                <div className="browser-bars">
                  ${demoTabs.dashboard.bars.map(
                    (value, index) => html`<span key=${index} style=${{ height: `${value}%` }}></span>`
                  )}
                </div>
              </div>
              <div className="browser-incidents">
                <h3>Derniers signalements</h3>
                ${demoTabs.dashboard.incidents.map(
                  ([title, meta, state]) => html`
                    <div className="browser-incident" key=${title}>
                      <div>
                        <b>${title}</b>
                        <small>${meta}</small>
                      </div>
                      <span>${state}</span>
                    </div>
                  `
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="support-strip" aria-label="Partenaires">
          <p>DEPLOYE AVEC LE SOUTIEN DE</p>
          <div className="support-logos">
            ${partnerLogos.map((name) => html`<span key=${name}>${name}</span>`)}
          </div>
        </section>

        <section className="problem problem-dark" id="problem">
          <div className="section-head section-head-centered section-head-light">
            <p className="eyebrow eyebrow-red">Le probleme</p>
            <h2>
              La corruption prospere dans le <span>silence force</span>
            </h2>
            <p>
              En RDC, 78% des abus ne sont jamais signales. Pas parce que les citoyens ne voient pas,
              mais parce qu'ils n'ont <strong>aucun moyen sur d'agir.</strong>
            </p>
          </div>
          <div className="problem-grid stats-only">
            <article><strong>78%</strong><span>abus non signales</span></article>
            <article><strong>3M+</strong><span>citoyens affectes</span></article>
            <article><strong>0</strong><span>canal securise existant</span></article>
          </div>
          <div className="pain-grid">
            ${problemCards.map(
              (card) => html`
                <article className=${`pain-card pain-${card.tone}`} key=${card.title}>
                  <div className="pain-icon">${card.icon}</div>
                  <div>
                    <h3>${card.title}</h3>
                    <p>${card.text}</p>
                  </div>
                </article>
              `
            )}
          </div>
        </section>

        <section className="workflow workflow-timeline" id="solution">
          <div className="section-head section-head-centered">
            <p className="eyebrow">La solution</p>
            <h2>
              Un signalement en 30 secondes,
              <span>une reponse en 24h</span>
            </h2>
            <p>MwangazaMail transforme WhatsApp en canal officiel de signalement — structure, securise, exploitable par votre equipe.</p>
          </div>
          <div className="timeline-shell">
            <div className="timeline-line"></div>
            ${workflowCards.map(
              (card) => html`
                <article className=${`timeline-card timeline-${card.side}`} key=${card.step}>
                  <div className="timeline-node"></div>
                  <div className="timeline-content">
                    <div className="timeline-step">${card.step}</div>
                    <div className="timeline-icon">${card.icon}</div>
                    <h3>${card.title}</h3>
                    <p>${card.text}</p>
                  </div>
                </article>
              `
            )}
          </div>
          <div className="section-cta">
            <a className="btn btn-solid btn-large" href="#demo">Voir la solution en action →</a>
          </div>
        </section>

        <section className="features features-expanded" id="fonctionnalites">
          <div className="section-head section-head-centered">
            <p className="eyebrow">Fonctionnalites</p>
            <h2>
              Tout ce dont vous avez besoin,
              <span>rien de superflu</span>
            </h2>
            <p>MwangazaMail est concu pour les equipes qui veulent agir — pas gerer un outil complexe.</p>
          </div>
          <div className="feature-grid feature-grid-rich">
            ${features.map(
              (feature) => html`
                <article className="feature-card-rich" key=${feature.title}>
                  <div className=${`feature-icon feature-${feature.tone}`}>${feature.icon}</div>
                  <div className=${`feature-tag feature-${feature.tone}`}>${feature.tag}</div>
                  <h3>${feature.title}</h3>
                  <p>${feature.text}</p>
                </article>
              `
            )}
          </div>
        </section>

        <section className="demo-section" id="demo">
          <div className="section-head section-head-centered">
            <p className="eyebrow">Demonstration</p>
            <h2>
              Voyez MwangazaMail
              <span>en conditions reelles</span>
            </h2>
          </div>
          <div className="demo-tabs">
            ${Object.entries(demoTabs).map(([key, tab]) => html`
              <button
                key=${key}
                className=${`demo-tab ${demoTab === key ? "is-active" : ""}`}
                type="button"
                onClick=${() => setDemoTab(key)}
              >
                ${tab.label}
              </button>
            `)}
          </div>
          <div className="demo-panel">
            ${demoTab === "whatsapp" && html`
              <div className="whatsapp-demo">
                <div className="chat-window">
                  <div className="chat-header">
                    <div className="chat-avatar">◔</div>
                    <div>
                      <strong>${demoTabs.whatsapp.leftTitle}</strong>
                      <small>• ${demoTabs.whatsapp.leftStatus}</small>
                    </div>
                  </div>
                  ${demoTabs.whatsapp.messages.map(
                    (message, index) => html`
                      <div className=${`chat-bubble ${message.tone}`} key=${index}>
                        <p>${message.text}</p>
                        <span>${message.time}</span>
                      </div>
                    `
                  )}
                </div>
                <div className="demo-copy">
                  <h3>Ce qui se passe en coulisses</h3>
                  <ul className="demo-bullets">
                    ${demoTabs.whatsapp.bullets.map((bullet) => html`<li key=${bullet}>${bullet}</li>`)}
                  </ul>
                  <a className="text-link" href="#contact">Tester le bot en live →</a>
                </div>
              </div>
            `}
            ${demoTab === "dashboard" && html`
              <div className="dashboard-demo">
                <div className="browser-kpis browser-kpis-demo">
                  ${demoTabs.dashboard.metrics.map(
                    ([label, value, delta]) => html`
                      <article className="browser-kpi" key=${label}>
                        <span>${label}</span>
                        <strong>${value}</strong>
                        <em>${delta}</em>
                      </article>
                    `
                  )}
                </div>
                <div className="browser-chart-card">
                  <div className="browser-chart-head">
                    <b>Signalements par semaine</b>
                    <span>Derniers 30 jours</span>
                  </div>
                  <div className="browser-bars">
                    ${demoTabs.dashboard.bars.map(
                      (value, index) => html`<span key=${index} style=${{ height: `${value}%` }}></span>`
                    )}
                  </div>
                </div>
                <div className="browser-incidents browser-incidents-demo">
                  <h3>Derniers signalements</h3>
                  ${demoTabs.dashboard.incidents.map(
                    ([title, meta, state]) => html`
                      <div className="browser-incident" key=${title}>
                        <div>
                          <b>${title}</b>
                          <small>${meta}</small>
                        </div>
                        <span>${state}</span>
                      </div>
                    `
                  )}
                </div>
              </div>
            `}
            ${demoTab === "reports" && html`
              <div className="reports-demo">
                <div className="report-stats">
                  ${demoTabs.reports.stats.map(
                    ([value, label]) => html`
                      <article className="report-stat" key=${label}>
                        <strong>${value}</strong>
                        <span>${label}</span>
                      </article>
                    `
                  )}
                </div>
                <div className="quote-grid">
                  ${demoTabs.reports.quotes.map(
                    (quote, index) => html`
                      <article className="quote-card" key=${index}>
                        <div className="quote-mark">❞</div>
                        <div className="quote-stars">★★★★★</div>
                        <p>${quote}</p>
                      </article>
                    `
                  )}
                </div>
              </div>
            `}
          </div>
        </section>

        <section className="testimonials-section">
          <div className="section-head section-head-centered">
            <p className="eyebrow">Temoignages</p>
            <h2>
              Ils ont transforme leur institution.
              <span>Avec des resultats mesurables.</span>
            </h2>
          </div>
          <div className="report-stats report-stats-large">
            ${demoTabs.reports.stats.map(
              ([value, label]) => html`
                <article className="report-stat" key=${label}>
                  <strong>${value}</strong>
                  <span>${label}</span>
                </article>
              `
            )}
          </div>
          <div className="quote-grid quote-grid-large">
            ${demoTabs.reports.quotes.map(
              (quote, index) => html`
                <article className="quote-card" key=${index}>
                  <div className="quote-mark">❞</div>
                  <div className="quote-stars">★★★★★</div>
                  <p>${quote}</p>
                </article>
              `
            )}
          </div>
        </section>

        <section className="pricing" id="tarification">
          <div className="section-head section-head-centered">
            <p className="eyebrow">Tarification</p>
            <h2>Plans simples pour institutions de toutes tailles</h2>
          </div>
          <div className="pricing-grid">
            ${pricing.map(([name, amount, bullets], index) => html`
              <article className=${index === 1 ? "featured" : ""} key=${name}>
                <h3>${name}</h3>
                <p className="price">${amount}</p>
                <ul>
                  ${bullets.map((bullet) => html`<li key=${bullet}>${bullet}</li>`)}
                </ul>
              </article>
            `)}
          </div>
        </section>

        <section className="faq" id="faq">
          <div className="section-head section-head-centered">
            <p className="eyebrow">FAQ</p>
            <h2>Questions frequentes</h2>
          </div>
          <div className="faq-grid">
            ${faqItems.map(([question, answer], index) => html`
              <details open=${index === 0} key=${question}>
                <summary>${question}</summary>
                <p>${answer}</p>
              </details>
            `)}
          </div>
        </section>

        <section className="cta" id="contact">
          <h2>Pret a lancer votre canal de signalement securise ?</h2>
          <div className="cta-actions">
            <button className="btn btn-solid btn-large" type="button" onClick=${() => setLoginOpen(true)}>Se connecter et acceder au dashboard</button>
            <a className="btn btn-outline btn-large" href="mailto:contact@mwangazamail.cd">Parler a l'equipe</a>
          </div>
        </section>
      </main>

      <${LoginPortal} isOpen=${loginOpen} onClose=${() => setLoginOpen(false)} onSubmit=${goToAdmin} />
    </div>
  `;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);
