import OBR, { buildShape, type Shape } from "@owlbear-rodeo/sdk";

interface Point {
  x: number;
  y: number;
}

interface Rect extends Point {
  w: number;
  h: number;
  rotunda?: boolean;
  ending?: boolean;
}

interface Door extends Point {
  dir: Point;
  type: number;
}

interface Note {
  text: string;
  ref: string;
  pos: Point;
}

/**
 * The full schema for the Mountain Temple data
 */
interface OPMap {
  version: string;
  title: string;
  story: string;
  rects: Rect[];
  doors: Door[];
  notes: Note[];
  columns: Point[];
  water: any[]; // Use Point[] or Rect[] here if water follows those structures
}
function reformatRooms(jsonText: string) {
  var content: OPMap = JSON.parse(jsonText);

  content.doors.forEach(door => {
    
  });
}

// DPI
export function generateWalls(jsonText: string) {
  const scale = 150;
  console.log(OBR.scene.items.getItems());
  // calculate positioning

  var content: OPMap = JSON.parse(jsonText);

  const bounds = content.rects.reduce(
    (acc, rect) => ({
      minX: Math.min(acc.minX, rect.x),
      minY: Math.min(acc.minY, rect.y),
      maxX: Math.max(acc.maxX, rect.x + rect.w),
      maxY: Math.max(acc.maxY, rect.y + rect.h),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  );
  const walls: Array<Shape> = [];
  content.rects.forEach((rect) => {
    const normalX = rect.x - bounds.minX + 1;
    const normalY = rect.y - bounds.minY + 1;

    if (rect.rotunda) {
      let wall = buildShape()
        .shapeType("CIRCLE")
        .width((Math.sqrt(0.25 + rect.w ** 2) + 0.2) * scale)
        .height((Math.sqrt(0.25 + rect.h ** 2) + 0.2) * scale)
        .position({
          x: (normalX + rect.w / 2) * scale,
          y: (normalY + rect.h / 2) * scale,
        })
        .layer("FOG")
        .build();
      walls.push(wall);
    } else {
      let wall = buildShape()
        .shapeType("RECTANGLE")
        .width(rect.w * scale)
        .height(rect.h * scale)
        .position({
          x: normalX * scale,
          y: normalY * scale,
        })
        .layer("FOG")
        .build();
      walls.push(wall);
    }
    // OBR.scene.local.addItems([wall]);\
  });
  console.log(walls);
  OBR.scene.items.addItems(walls).then(
    () => {
      console.log("created items");
    },
    (reason) => {
      console.log(reason);
    },
  );
}
