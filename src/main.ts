import "./style.css";
// import typescriptLogo from "./typescript.svg";
// import viteLogo from "/vite.svg";
// import { setupCounter } from "./counter.ts";
import { generateWalls } from "./importer";
import OBR, { buildWall, buildShape, isImage } from "@owlbear-rodeo/sdk";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>

    <label for="jsonTextBox">Import JSON text</label>
    <br>
    <textarea id="jsonTextBox" class="fullSizeText" rows="22"></textarea>

      <br>
      <button id="importJSONButton">Import JSON</button>
      <button id="test">Test</button>
      <br>
      <select name="images" id="mapSelect" ></select>

  </div> 
`;
// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// console.log("Hello from Vite + TypeScript!");

// console.log(OBR.isAvailable);
// console.log(OBR.isReady);

OBR.onReady(() => {
  // console.log("OBR ready!");
  updateMapSelection();
  document
    .querySelector<HTMLSelectElement>("#mapSelect")
    ?.addEventListener("change", () => {
      updateMapSelection();
    });
  OBR.scene.items.onChange(updateMapSelection);
  document
    .querySelector<HTMLButtonElement>("#test")!
    .addEventListener("click", () => {
      console.log("Fog:", OBR.player.hasPermission("FOG_CREATE"));

      const itema = buildShape()
        .width(10)
        .height(10)
        .shapeType("CIRCLE")
        .build();
      OBR.scene.items.addItems([itema]);
      var p = JSON.parse(
        document.querySelector<HTMLTextAreaElement>("#jsonTextBox")!.value,
      );
      console.log(p);

      const item = buildWall().points(p).build();
      console.log(item);

      OBR.scene.items.addItems([item]).then(
        () => {
          console.log("created item");
        },
        (reason) => {
          console.log(reason);
        },
      );
    });

  document
    .querySelector<HTMLButtonElement>("#importJSONButton")!
    .addEventListener("click", (ev) => {
      ev.preventDefault();
      generateWalls(
        document.querySelector<HTMLTextAreaElement>("#jsonTextBox")!.value,
      );
    });

  OBR.scene.items.getItems();
});

function updateMapSelection(): void {
  if (!OBR.isReady) return;

  OBR.scene.items.getItems(isImage).then((images) => {
    const select = document.querySelector<HTMLSelectElement>("#mapSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Add an option for each image found in the scene
    images.forEach((img) => {
      const option = document.createElement("option");
      option.value = img.id;
      // Use the image name or a fallback if it's unnamed
      option.textContent = img.name || `Unnamed Image (${img.id.slice(0, 5)})`;
      select.appendChild(option);
    });
  });
}
