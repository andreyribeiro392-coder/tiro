export const AppState = {
  initialized: false,
  settings: {
    sensitivity: 0.0025
  }
};

export function initApp() {
  if (AppState.initialized) return;

  AppState.initialized = true;
  console.log("App initialized");
}
