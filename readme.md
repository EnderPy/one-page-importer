
# One Page Importer

![Image of a 2d dungeon map, half has been replaced with the original version from ](public/hero.png)

Extension for owlbear rodeo
Import Maps from Watabous' One Page Dungeon using his JSON export. Features integration with Dynamic Fog's Door Mechanic. 
  - allows for offset for a given map in the scene
  - imports both rectangles and round rooms
  - imports doors, and will open doors that are shown as open

  TODO: 
  - Secret doors do not yet work, and show the wall segment
  - add user-editable variables
  - modify door logic to allow for doors at 1/4 positions
  - import certain props for fog blocking (columns for example)
  - some corridors have doors throughout (Likely his logic), remove these from importing automatically

## Video

![video showcasing the program importing JSON from one-page-dungeon generator](public/preview.mp4)

## Installation

manifest file: `https://enderpy.github.io/one-page-importer/manifest.json`


thanks to watabou for his amazing tool and source for this project, https://watabou.github.io/one-page-dungeon/
