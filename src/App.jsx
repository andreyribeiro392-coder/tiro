// App layer (menus, settings, future integrations)

export const AppState = {
  initialized: false,
  user: null,
  settings: {
    sensitivity: 0.0025,
    volume: 1.0
  }
};

export function initApp() {
  if (AppState.initialized) return;

  AppState.initialized = true;

  console.log("App initialized successfully");

  setupBasicUI();
}

function setupBasicUI() {
  const ui = document.getElementById("ui");

  if (!ui) return;

  const info = document.createElement("div");
  info.style.marginTop = "10px";
  info.style.opacity = "0.7";
  info.style.fontSize = "12px";
  info.innerText = "FPS Engine Active";

  ui.appendChild(info);
}

export function updateSettings(newSettings) {
  AppState.settings = {
    ...AppState.settings,
    ...newSettings
  };
}
