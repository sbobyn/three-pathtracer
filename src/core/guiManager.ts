import GUI from "lil-gui";

let rootGUI: GUI | null = null;
let activeFolder: GUI | null = null;

export function initRootGUI(gui: GUI) {
  rootGUI = gui;
}

export function setSketchFolder(folder: GUI) {
  // destroy previous folder if it exists
  if (activeFolder) {
    activeFolder.destroy();
  }
  activeFolder = folder;
}

export function createSketchFolder(name = "Sketch Controls"): GUI {
  if (!rootGUI) throw new Error("Root GUI not initialized");
  const folder = rootGUI.addFolder(name);
  setSketchFolder(folder);
  return folder;
}

export function clearSketchFolder() {
  if (activeFolder) {
    activeFolder.destroy();
    activeFolder = null;
  }
}
