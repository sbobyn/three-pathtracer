import Stats from "stats.js";

export function setupStats(panel: number = 0): Stats {
  const stats = new Stats();
  stats.showPanel(panel);
  document.body.appendChild(stats.dom);
  return stats;
}
