const AUTH_KEY = "mwangaza_auth";

const scriptElement = document.currentScript;
const baseUrl = scriptElement ? new URL(".", scriptElement.src).href : new URL("./", window.location.href).href;
const adminUrl = new URL("admin/", baseUrl).href;
const adminPath = new URL(adminUrl).pathname;

const redirectToAdmin = () => {
  localStorage.setItem(AUTH_KEY, "true");
  window.location.assign(adminUrl);
};

const shouldBridgeRoute = (pathname) => {
  if (!pathname || pathname === "/" || pathname === adminPath) return false;
  return pathname.startsWith("/login") || pathname.startsWith("/dashboard");
};

const monitorRoute = () => {
  if (shouldBridgeRoute(window.location.pathname)) {
    redirectToAdmin();
  }
};

const isSignInElement = (el) => {
  if (!el) return false;
  const href = (el.getAttribute("href") || "").toLowerCase();
  const text = (el.textContent || "").trim().toLowerCase();
  return (
    text === "se connecter" ||
    text.includes("se connecter") ||
    href.includes("/login") ||
    href.includes("/dashboard")
  );
};

document.addEventListener(
  "click",
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const action = target.closest("button, a");
    if (!isSignInElement(action)) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }

    redirectToAdmin();
  },
  true
);

const originalPushState = history.pushState.bind(history);
history.pushState = function (...args) {
  originalPushState(...args);
  monitorRoute();
};

const originalReplaceState = history.replaceState.bind(history);
history.replaceState = function (...args) {
  originalReplaceState(...args);
  monitorRoute();
};

window.addEventListener("popstate", monitorRoute);
window.addEventListener("hashchange", monitorRoute);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", monitorRoute);
} else {
  monitorRoute();
}
