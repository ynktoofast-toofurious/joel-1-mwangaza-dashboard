export const incidents = [
  { ref: "#2333", category: "Autre", institution: "243999000001", city: "Matadi", severity: "moyen", status: "nouveau", occurredOn: "2026-05-18" },
  { ref: "#2891", category: "Corruption", institution: "Douanes - Matadi", city: "Matadi", severity: "eleve", status: "nouveau", occurredOn: "2026-05-21" },
  { ref: "#2890", category: "Surfacturation", institution: "Mairie - Goma", city: "Goma", severity: "moyen", status: "en_cours", occurredOn: "2026-05-20" },
  { ref: "#2889", category: "Abus d'autorite", institution: "Police - Kinshasa", city: "Kinshasa", severity: "critique", status: "resolu", occurredOn: "2026-05-19" },
  { ref: "#2888", category: "Detournement", institution: "Mairie - Lubumbashi", city: "Lubumbashi", severity: "critique", status: "en_cours", occurredOn: "2026-05-17" }
];

export const users = [
  { fullName: "Amina Kabeya", email: "amina.kabeya@mwangaza.cd", role: "admin", city: "Kinshasa", status: "Actif" },
  { fullName: "Joel Mutombo", email: "joel.mutombo@mwangaza.cd", role: "agent", city: "Lubumbashi", status: "Actif" },
  { fullName: "Sarah Lufuma", email: "sarah.lufuma@mwangaza.cd", role: "viewer", city: "Goma", status: "Inactif" },
  { fullName: "Patrick Nlandu", email: "patrick.nlandu@mwangaza.cd", role: "agent", city: "Bukavu", status: "Actif" },
  { fullName: "Grace Mbuyi", email: "grace.mbuyi@mwangaza.cd", role: "viewer", city: "Kisangani", status: "Actif" }
];

export const subscriptions = [
  { institution: "DGI", plan: "Pilote", amount: 499, startDate: "2026-01-01", renewalDate: "2026-06-01", state: "Actif" },
  { institution: "Mairie de Goma", plan: "Standard", amount: 1500, startDate: "2025-12-12", renewalDate: "2026-06-12", state: "Actif" },
  { institution: "Police Nationale", plan: "Premium", amount: 7500, startDate: "2026-02-15", renewalDate: "2026-06-15", state: "Actif" },
  { institution: "Douanes Matadi", plan: "Standard", amount: 1500, startDate: "2025-11-03", renewalDate: "2026-05-03", state: "Expire" },
  { institution: "Tribunal Bukavu", plan: "Pilote", amount: 499, startDate: "2026-03-01", renewalDate: "2026-06-01", state: "Actif" }
];

export const plans = [
  { name: "Pilote", monthlyPrice: 499 },
  { name: "Standard", monthlyPrice: 1500 },
  { name: "Premium", monthlyPrice: 7500 }
];

export const statuses = ["nouveau", "en_cours", "resolu"];
export const severities = ["faible", "moyen", "eleve", "critique"];
