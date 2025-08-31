export function setDarkMode(enabled) {
  const html = document.documentElement;
  if (enabled) {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

export function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  setDarkMode(!isDark);
}

export function initDarkMode() {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  if (
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}
