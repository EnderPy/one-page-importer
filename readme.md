
# One Page Importer

![Image of a 2d dungeon map, half has been replaced with the original version from ](public/hero.png)

Extension for owlbear rodeo
Import Maps from Watabous' One Page Dungeon using his JSON export. Features integration with Dynamic Fog's Door Mechanic. 
  - allows for offset for a given map in the scene
  - imports both rectangles and round rooms
  - imports doors, and will open doors that are shown as open

Also, can import Caves via 'import SVG' button. same procedure as JSON import. Glaives do not work and likely wont. If you want glaives, export SVG from the cave version and use that.

  TODO: 
  - Secret doors do not yet work, and show the wall segment
  - add user-editable variables
  - modify door logic to allow for doors at 1/4 positions
  - import certain props for fog blocking (columns for example)
  - some corridors have doors throughout (Likely his logic), remove these from importing automatically

## Video


https://github.com/user-attachments/assets/93d7c20f-6865-4906-9396-dec662087685


## Installation

manifest file: `https://enderpy.github.io/one-page-importer/manifest.json`

## how to use (Dungeon / JSON mode)

1. generate a map on https://watabou.github.io/cave-generator (can also configure using right click -> tags)
2. right click -> export -> PNG for the map, and JSON for the data. note the DPI when exporting PNG
3. Add the map as normal into Owlbear (drag into the scene as a map, or asset manager > maps > add). You may need to configure the DPI to match
4. On the action bar (top left), open "One Page Importer" and either click `browse` > select JSON file or paste the content from the JSON.
5. Select the relevant map, or 'No Offset' for default positioning, then `Import JSON`. Fog of war should apply over the map.
  - note: if you cant see any doors, see if you haven't added a dynamic Fog of War extension (either `https://dynamic-fog.owlbear.rodeo/manifest.json`, `https://owlbear-chromodynamic-fog.nicholassdesai.workers.dev/manifest.json` are recommended)

note: for caves, same procedure, except export as SVG from cave-generator, and click `import SVG`


thanks to watabou for his amazing tool and source for this project, https://watabou.github.io/one-page-dungeon/


