const rows = [
  ["#2333", "Autre", "243999000001", "Matadi", "moyen", "nouveau"],
  ["#2891", "Corruption", "Douanes - Matadi", "Matadi", "eleve", "nouveau"],
  ["#2890", "Surfacturation", "Mairie - Goma", "Goma", "moyen", "en_cours"],
  ["#2889", "Abus d'autorite", "Police - Kinshasa", "Kinshasa", "critique", "resolu"],
  ["#2888", "Detournement", "Mairie - Lubumbashi", "Lubumbashi", "critique", "en_cours"],
  ["#2887", "Nepotisme", "Direction Generale des Impots", "Kinshasa", "moyen", "nouveau"],
  ["#2886", "Fraude", "BCECO", "Kinshasa", "eleve", "resolu"],
  ["#2885", "Corruption", "Police - Goma", "Goma", "eleve", "resolu"],
  ["#2884", "Surfacturation", "Tribunal - Bukavu", "Bukavu", "faible", "resolu"],
  ["#2883", "Abus d'autorite", "Mairie - Kisangani", "Kisangani", "critique", "en_cours"],
  ["#2882", "Detournement", "HGR - Kinshasa", "Kinshasa", "eleve", "nouveau"],
  ["#2881", "Corruption", "Universite de Kinshasa", "Kinshasa", "moyen", "resolu"],
  ["#2880", "Fraude", "Etat Civil - Mbuji-Mayi", "Mbuji-Mayi", "eleve", "nouveau"],
  ["#2879", "Corruption", "DGI - Matadi", "Matadi", "moyen", "en_cours"]
];

const categoryClass = {
  Autre: "tag-gray",
  Corruption: "tag-red",
  Surfacturation: "tag-orange",
  "Abus d'autorite": "tag-violet",
  Detournement: "tag-cyan",
  Nepotisme: "tag-cyan",
  Fraude: "tag-red"
};

const severityClass = {
  faible: "sev-low",
  moyen: "sev-medium",
  eleve: "sev-high",
  critique: "sev-critical"
};

const statusClass = {
  nouveau: "status-new",
  en_cours: "status-progress",
  resolu: "status-resolved"
};

const statusLabel = {
  nouveau: "nouveau",
  en_cours: "en cours",
  resolu: "resolu"
};

const severityLabel = {
  faible: "faible",
  moyen: "moyen",
  eleve: "eleve",
  critique: "critique"
};

const tbody = document.querySelector("#reportRows");

tbody.innerHTML = rows
  .map(([ref, category, institution, city, severity, status]) => {
    const categoryStyle = categoryClass[category] || "tag-gray";
    const severityStyle = severityClass[severity] || "sev-medium";
    const statusStyle = statusClass[status] || "status-new";

    return `
      <tr>
        <td>${ref}</td>
        <td><span class="tag ${categoryStyle}">${category}</span></td>
        <td>${institution}</td>
        <td>${city}</td>
        <td><span class="sev-pill ${severityStyle}">${severityLabel[severity] || severity}</span></td>
        <td><span class="status ${statusStyle}">${statusLabel[status] || status}</span></td>
      </tr>
    `;
  })
  .join("");

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".nav-item").forEach((link) => link.classList.remove("is-active"));
    item.classList.add("is-active");
  });
});
