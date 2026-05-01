---
title: One Page Importer
description: 
  "Import Dungeons and Caves from Watabou's Cave and Dungeon Generators"
author: EnderPy
image: https://enderpy.github.io/one-page-importer/hero.png
icon: https://enderpy.github.io/one-page-importer/icon.svg
tags:
  - fog
manifest: https://enderpy.github.io/one-page-importer/manifest.json
learn-more: https://github.com/EnderPy/one-page-importer
---
# One Page Importer

A fully featured importer for watabou's Cave/Glade and Dungeon generator, found at <https://watabou.github.io/>

Features:
- Import Dungeons from One-Page-Dungeon generator found at <https://watabou.github.io/dungeon.html>
- Import Caves from the Cave Generator found at <https://watabou.github.io/cave.html>
  - Easily customisable levels of detail vs performance, under the `advanced` tab


## How to use

### Importing a dungeon

1. generate a map on https://watabou.github.io/one-page-dungeon/ (can also configure using right click -> tags)
2. right click -> export -> PNG for the map, and JSON for the data. note the DPI when exporting PNG
3. Add the map as normal into Owlbear (drag into the scene as a map, or asset manager > maps > add). You may need to configure the DPI to match
4. On the action bar (top left), open "One Page Importer" and either click `Upload File` > select JSON file or paste the content from the JSON under Advanced.
5. Select the relevant map, or 'No Offset' for default positioning, then `Import Dungeon (JSON)`. Fog of war should apply over the map.
  - note: if you cant see any doors, see if you haven't added a dynamic Fog of War extension (either `https://dynamic-fog.owlbear.rodeo/manifest.json`, `https://owlbear-chromodynamic-fog.nicholassdesai.workers.dev/manifest.json` are recommended)


### Importing a cave

1. generate a map on https://watabou.github.io/cave-generator (can also configure using right click -> tags)
2. right click -> export -> PNG for the map, and SVG for the data. Keep track of the download location.
  - Note: if you are generating a Glade, you must export it as a cave. To do this, right click inside the generator. Find the option `Display` > `Glade view` and ensure it is off. 
3. Add the map as normal into Owlbear (drag into the scene as a map, or asset manager > maps > add).
4. On the action bar (top left), open "One Page Importer". From here, click `Upload File`. Select the downloaded .svg file
 - Optional: You may edit the optimisation profile of the caves, please see <https://github.com/EnderPy/one-page-importer#advanced> for more details
5. Under `Select Map`, select the map you uploaded under step #3, or leave blank if you so wish
6. Click `Import Cave (SVG)` to import the Fog-Of-War information on-top of your map. Fog data should now be applied, check via enabling the Fog tool





For a more in-depth usage guide, please see <https://github.com/EnderPy/one-page-importer>