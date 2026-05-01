import "./style.css";
// import typescriptLogo from "./typescript.svg";
// import viteLogo from "/vite.svg";
// import { setupCounter } from "./counter.ts";
import { generateWalls } from "./importer";
import { generateSVGWalls } from "./SVGImport";
import OBR, { isImage, type Image, type Theme } from "@owlbear-rodeo/sdk";
import type { Point } from "./types";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div class="appWrapper">
  <span class="headerText">One Page Dungeon Importer</span>
  <fieldset>
    <legend
      title="Upload File for processing.\nDungeons use JSON format, caves use SVG format"
    >
      Import File
    </legend>
    <label for="jsonFileUpload" class="fileInputLabel">Upload File</label>
    <input
      type="file"
      id="jsonFileUpload"
      accept=".svg, image/svg+xml, application/json"
    />
  </fieldset>
  <!-- <label for="jsonFileUpload">Import JSON file</label>
    <br>
    <input type="file" id="jsonFileUpload">
    <br> -->
  <details>
    <summary>Advanced</summary>
    <fieldset>
      <legend>Edit Text</legend>

      <textarea id="jsonTextBox" class="fullSizeText" rows="5"></textarea>
    </fieldset>
    <fieldset>
      <legend>Cave SVG Optimisation</legend>

      <label for="SVGOptimisePath">
        Optimise Path
        <input type="checkbox" id="SVGOptimisePath" checked />
      </label>

      <label for="SVGOptimiseThreshold"> Min Angle </label>
      <input
        type="number"
        id="SVGOptimiseThreshold"
        min="0"
        max="180"
        value="20"
      />
      <br />
      <label for="SVGOptimisePathMinPoints"> Min Points </label>
      <input
        type="number"
        id="SVGOptimisePathMinPoints"
        min="0"
        max="99"
        value="5"
      />
    </fieldset>
  </details>
  <br />
  <br />
  <fieldset>
    <legend for="images">Select Map:</legend>

    <select name="images" id="mapSelect"></select>
  </fieldset>
  <br />
  <button
    id="importJSONButton"
    title="Used for processing a dungeon, only supports JSON files"
  >
    Import Dungeon (JSON)
  </button>
  <button
    id="importSVGButton"
    title="Used for Caves / Glades, only supports SVG files"
  >
    Import Cave (SVG)
  </button>

  <!-- <button id="test">Test</button> -->
</div>

`;
// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// console.log("Hello from Vite + TypeScript!");

// console.log(OBR.isAvailable);
// console.log(OBR.isReady);

function updateDarkMode(theme: Theme) {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (app) {
    app.setAttribute("data-theme", theme.mode);
  }
  // console.log(app?.getAttribute("data-theme"));
}

function updateHeight(): void {
  const app = document.querySelector("#app") as HTMLDivElement;
  if (app) OBR.action.setHeight(app.getBoundingClientRect().height);
}

var currentPos: Point = { x: 0, y: 0 };
var currentImage: Image | null = null;
OBR.onReady(() => {
  // console.log("OBR ready!");
  updateMapSelection();
  // document
  //   .querySelector<HTMLSelectElement>("#mapSelect")
  //   ?.addEventListener("change", () => {
  //     updateMapSelection();
  //   });
  OBR.scene.items.onChange(updateMapSelection);
  // OBR.scene.items.onChange((items) => {
  //   console.log(items);
  // });
  var currentPos = { x: 0, y: 0 };
  var currentImage: Image | null = null;
  OBR.theme.onChange((t) => updateDarkMode(t));
  OBR.theme.getTheme().then((t) => updateDarkMode(t));

  const observer = new ResizeObserver(() => updateHeight());
  observer.observe(document.querySelector<HTMLDivElement>("#app")!);

  document
    .querySelector<HTMLInputElement>("#jsonFileUpload")!
    .addEventListener("change", (event) => {
      const fileInput = event.target as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) return;

      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          const textArea =
            document.querySelector<HTMLTextAreaElement>("#jsonTextBox");
          if (textArea) {
            textArea.value = content;
          }
        }
      };

      reader.readAsText(file);
    });

  document
    .querySelector<HTMLSelectElement>("#mapSelect")
    ?.addEventListener("change", (ev) => {
      // console.log(ev);
      if ((ev.target as HTMLSelectElement).value == "NONE") {
        currentPos = { x: 0, y: 0 };
        currentImage = null;

        return;
      }
      OBR.scene.items
        .getItems([(ev.target as HTMLSelectElement).value])
        .then((item) => {
          currentPos = item[0].position;
          currentImage = item[0] as Image;
          // currentPos = item[0].scale;
        });
    });
  document
    .querySelector<HTMLButtonElement>("#importJSONButton")!
    .addEventListener("click", (ev) => {
      ev.preventDefault();
      // console.log(currentPos);
      OBR.player.hasPermission("FOG_CREATE").then((v) => {
        if (v)
          try {
            generateWalls(
              document.querySelector<HTMLTextAreaElement>("#jsonTextBox")!
                .value,
              currentPos,
            );
            OBR.notification.show(
              "Imported JSON content successfully",
              "SUCCESS",
            );
          } catch (error) {
            OBR.notification.show("Failed to parse JSON", "ERROR");
          }
        else {
          OBR.notification.show(
            'Fog import failed, you do not have "FOG_CREATE" permissions',
            "ERROR",
          );
        }
      });
    });
  document
    .querySelector<HTMLButtonElement>("#importSVGButton")!
    ?.addEventListener("click", (ev) => {
      ev.preventDefault();
      // console.log(currentPos);
      OBR.player.hasPermission("FOG_CREATE").then((v) => {
        if (v)
          try {
            generateSVGWalls(
              document.querySelector<HTMLTextAreaElement>("#jsonTextBox")!
                .value,
              currentImage,
            );
            OBR.notification.show(
              "Imported SVG content successfully",
              "SUCCESS",
            );
          } catch (error) {
            OBR.notification.show("Failed to parse SVG", "ERROR");
          }
        else {
          OBR.notification.show(
            'Fog import failed, you do not have "FOG_CREATE" permissions',
            "ERROR",
          );
        }
      });
    });

  // OBR.scene.items.getItems();
});

function updateMapSelection(): void {
  if (!OBR.isReady) return;

  OBR.scene.items.getItems(isImage).then((images) => {
    const select = document.querySelector<HTMLSelectElement>("#mapSelect");
    const selectedValue = select?.value || null;
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";
    let o = document.createElement("option");
    o.value = "NONE";
    o.textContent = "No Offset";
    select.appendChild(o);
    // Add an option for each image found in the scene
    images
      .filter((i) => i.layer == "MAP")
      .forEach((img) => {
        const option = document.createElement("option");
        option.value = img.id;
        // Use the image name or a fallback if it's unnamed
        option.textContent =
          img.name || `Unnamed Image (${img.id.slice(0, 5)})`;

        if (img.id == currentImage?.id) currentImage = img;
        select.appendChild(option);
      });

    // If selectedValue exists in the new options, set it as the selected value
    if (selectedValue) {
      if (
        Array.from(select.children).some(
          (child) => (child as HTMLOptionElement).value === selectedValue,
        )
      ) {
        select.value = selectedValue;
      } else {
        // revert offset value
        currentImage = null;
      }
      currentPos =
        currentImage?.position != null ? currentImage.position : currentPos;
    }
  });
}
