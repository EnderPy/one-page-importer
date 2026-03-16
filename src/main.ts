import "./style.css";
// import typescriptLogo from "./typescript.svg";
// import viteLogo from "/vite.svg";
// import { setupCounter } from "./counter.ts";
import { generateWalls } from "./importer";
import OBR, { isImage } from "@owlbear-rodeo/sdk";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
<h3>One Page Dungeon Importer</h3>
    <label for="jsonFileUpload">Import JSON file</label>
    <br>
    <input type="file" id="jsonFileUpload">
    <br>
    <label for="jsonTextBox">Import as Text</label>
    <textarea id="jsonTextBox" class="fullSizeText" rows="22"></textarea>

      <br>
      <label for="images">Select Map:</label>
      <br>
      <select name="images" id="mapSelect" ></select>
      <br>
      <button id="importJSONButton">Import JSON</button>
      <!-- <button id="test">Test</button> -->

  </div> 
`;
// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// console.log("Hello from Vite + TypeScript!");

// console.log(OBR.isAvailable);
// console.log(OBR.isReady);

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
  // document
  //   .querySelector<HTMLButtonElement>("#test")!
  //   .addEventListener("click", () => {
  //     // console.log(OBR.scene.items.getItems());

  //     OBR.scene.items.getItems(isImage).then((item) => {
  //       // console.log(item);
  //       // (
  //       //   item[0].metadata["rodeo.owlbear.dynamic-fog/doors"] as Array<Door>
  //       // ).push({
  //       //   open: true,
  //       //   start: { distance: 0, index: 0 },
  //       //   end: { distance: 500, index: 0 },
  //       // });
  //     });
  //   });
  document
    .querySelector<HTMLSelectElement>("#mapSelect")
    ?.addEventListener("change", (ev) => {
      // console.log(ev);
      if ((ev.target as HTMLSelectElement).value == "NONE") {
        currentPos = { x: 0, y: 0 };
        return;
      }
      OBR.scene.items
        .getItems([(ev.target as HTMLSelectElement).value])
        .then((item) => {
          currentPos = item[0].position;
        });
    });
  document
    .querySelector<HTMLButtonElement>("#importJSONButton")!
    .addEventListener("click", (ev) => {
      ev.preventDefault();
      // console.log(currentPos);
      generateWalls(
        document.querySelector<HTMLTextAreaElement>("#jsonTextBox")!.value,
        currentPos,
      );
    });

  OBR.scene.items.getItems();
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
      }
    }
  });
}
