import OBR, {
  buildPath,
  buildShape,
  type Path,
  type Shape,
  type Vector2,
  Command,
  type PathCommand,
} from "@owlbear-rodeo/sdk";
import type { EnumDeclaration } from "typescript";
import arcToBezier, { type CubicBezierCurve } from "svg-arc-to-cubic-bezier";

interface Point {
  x: number;
  y: number;
}

interface Rect extends Point {
  w: number;
  h: number;
  rotunda?: boolean;
  ending?: boolean;
  roomID?: string;
}

interface OPDoor extends Point {
  dir: Point;
  type: number;
}
interface DoorRoom extends Rect {
  doors?: OPDoor[];
}
interface DoorPos {
  distance: number;
  index: number;
}

interface Door {
  start: DoorPos;
  end: DoorPos;
  open: Boolean;
}
interface PointDistance extends Point {
  distance: number;
}
interface RoomInfo {
  points: PointDistance[];
  door: Door[];
}

interface Note {
  text: string;
  ref: string;
  pos: Point;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  rotunda?: boolean;
  ending?: boolean;
  roomID?: string;
  doors?: OPDoor[];
}
/**
 * The full schema for the Mountain Temple data
 */
interface OPMap {
  version: string;
  title: string;
  story: string;
  rects: Rect[];
  doors: OPDoor[];
  notes: Note[];
  columns: Point[];
  water: any[]; // Use Point[] or Rect[] here if water follows those structures
}

const Directions = {
  RIGHT: "right",
  LEFT: "left",
  UP: "up",
  DOWN: "down",
  NONE: "none",
};

function createPathFromShapes(shapes: Shape[]) {
  var points = [];
}
//
function findRoomsWithDoors(doors: OPDoor[], rects: Rect[]) {
  // 1. Map the doors by their coordinates
  const doorLookup = new Set(doors.map((d) => `${d.x},${d.y}`));

  // 2. Filter the rects (rooms) to find matches
  return rects.filter((rect) => doorLookup.has(`${rect.x},${rect.y}`));
}

function updateDoorRooms(doors: OPDoor[], rects: Rect[]) {
  // will probably remove findRoomsWithDoors, as this needs to remake it to work
  // assume passed through findRoomsWithDoors and doors only

  // door lookup for given room
  const DOORS = new Map<string, OPDoor>();

  doors.forEach((door) => {
    DOORS.set(`${door.x},${door.y}`, door);
  });

  // new rooms

  const rooms: DoorRoom[] = [];

  // const roomLookup = new Map<string, Rect>();
  // go foreach rect, split based on DOORS
  rects.forEach((room) => {
    let d = DOORS.get(`${room.x},${room.y}`);
    if (!d) return;
    // get direction
    if (d.dir.x != 0) {
      // left/ right door, split x into 2
      rooms.push({ x: d.x, y: d.y, w: 0.5, h: 1, doors: [d] });
      rooms.push({ x: d.x + 0.5, y: d.y, w: 0.5, h: 1, doors: [d] });
    } else {
      rooms.push({ x: d.x, y: d.y, w: 1, h: 0.5, doors: [d] });
      rooms.push({ x: d.x, y: d.y + 0.5, w: 1, h: 0.5, doors: [d] });
    }
  });

  // for (const rect of rects) {
  //   roomLookup.set(`${rect.x},${rect.y}`, rect);
  // }

  return rooms;
}
// create map of rooms

// goal: create 2 lists of rooms, first (rooms) is the normal rooms
// second is the split doors
// third is paths (somehow turn into doors??)
function getCurves(centre: Point, p1: Point, p2: Point): CubicBezierCurve[] {
  // 1. Correct Radius Calculation (Euclidean Distance)
  const dx = p1.x - centre.x;
  const dy = p1.y - centre.y;
  const r = Math.sqrt(dx * dx + dy * dy);

  // 2. Generate Bezier Segments
  return arcToBezier({
    px: p1.x,
    py: p1.y,
    cx: p2.x,
    cy: p2.y,
    rx: r,
    ry: r,
    xAxisRotation: 0,
    largeArcFlag: 0,
    sweepFlag: 1, // Clockwise
  });
}

function approximateArc(centre: Point, p1: Point, p2: Point): PathCommand[] {
  const curves = getCurves(centre, p1, p2);

  // 3. Map segments to your PathCommand format
  // Format: [Command.CUBIC, x1, y1, x2, y2, x, y]
  return curves.map((curve) => [
    Command.CUBIC,
    curve.x1, // Control Point 1 X
    curve.y1, // Control Point 1 Y
    curve.x2, // Control Point 2 X
    curve.y2, // Control Point 2 Y
    curve.x, // Destination X
    curve.y, // Destination Y
  ]);
}
const diff = (a: Point, b: Point) => {
  return { x: a.x - b.x, y: a.y - b.y };
};
const distance = (comm: PathCommand[], centre: Point = { x: 0, y: 0 }) => {
  var m = 0;
  var prev: Point | null = null;
  for (const C of comm) {
    let current = { x: C[1]!, y: C[2]! };
    if (!prev) {
      prev = current;
      continue;
    }
    switch (C[0]) {
      case Command.LINE:
        m += (() => {
          let d = diff(current, prev);
          return Math.sqrt(d.x ** 2 + d.y ** 2);
        })();
        break;
      case Command.CUBIC:
        m += ((center, p1, p2, clockwise = true) => {
          const r = Math.sqrt(
            Math.pow(p1.x - center.x, 2) + Math.pow(p1.y - center.y, 2),
          );

          const theta1 = Math.atan2(p1.y - center.y, p1.x - center.x);
          const theta2 = Math.atan2(p2.y - center.y, p2.x - center.x);

          let deltaTheta = theta2 - theta1;

          // Adjust for sweep direction
          if (clockwise && deltaTheta < 0) deltaTheta += 2 * Math.PI;
          if (!clockwise && deltaTheta > 0) deltaTheta -= 2 * Math.PI;

          return r * Math.abs(deltaTheta);
        })(centre, prev, current, true);
        break;

      default:
        break;
    }
    prev = current;
  }
  return m;
};

function reformatRooms(jsonText: string) {
  const content: OPMap = JSON.parse(jsonText);
  const scale = 150;

  // make copy that will be returned
  // var newContent: OPMap = {
  //   title: content.title,
  //   version: content.version,
  //   story: content.story,
  //   doors: content.doors,
  //   notes: content.notes,
  //   water: content.water,
  //   rects: [],
  //   columns: content.columns,
  // };
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
  // first find rooms with doors, then split into A/B
  // split

  //

  let a: Rect[] = findRoomsWithDoors(content.doors, content.rects);

  // every room that isnt a door

  let b = content.rects.filter((i) => !a.includes(i));

  // update update A to split rooms only
  let c: DoorRoom[] = updateDoorRooms(content.doors, a);

  const findRoomsInRange = (rects: Rect[], range: Rect): Rect[] => {
    return rects.filter((room) => {
      // Check if room overlaps horizontally
      const isWithinX = room.x < range.x + range.w && room.x + room.w > range.x;

      // Check if room overlaps vertically
      const isWithinY = room.y < range.y + range.h && room.y + room.h > range.y;

      // It is in range only if it overlaps on both axes
      return isWithinX && isWithinY;
    });
  };
  // foreach full room, find nearby rooms from the doors category
  const roomGroups: Rect[][] = [];
  var range = 0.5;

  for (const room of b) {
    const nearbyRooms = findRoomsInRange(c, {
      x: room.x - range,
      y: room.y - range,
      w: room.w + 2 * range,
      h: room.h + 2 * range,
    });
    roomGroups.push([room, ...nearbyRooms]);
  }
  // console.log("Room Groups:", roomGroups);

  // convert roomGroups to paths

  // const paths: string[][] = [];
  const commands: PathCommand[][] = [];
  const doorMetadatas: Door[][] = [];
  const getBounds = (rect: DoorRoom): Bounds => {
    // MIGHT be backwards
    let b: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    b.minX = (rect.x - bounds.minX + 1) * scale;
    b.minY = (rect.y - bounds.minY + 1) * scale;
    b.maxX = (rect.x + rect.w - bounds.minX + 1) * scale;
    b.maxY = (rect.y + rect.h - bounds.minY + 1) * scale;
    if (rect.rotunda) b.rotunda = rect.rotunda;
    if (rect.ending) b.ending = rect.ending;
    if (rect.roomID) b.roomID = rect.roomID;
    if (rect.doors) b.doors = rect.doors;
    return b;
  };
  // const drawDoors = (current: Point, next: Point) => {
  //   return doorBounds.filter(
  //     (door: Bounds, index) =>
  //       (door.minX <= Math.min(current.x, next.x) &&
  //         door.maxX >= Math.max(current.x, next.x)) ||
  //       (door.minY <= Math.min(current.y, next.y) &&
  //         door.maxY >= Math.max(current.y, next.y)),
  //   );
  // };

  for (const r of roomGroups) {
    // go North, East, South, West.
    // let p: Vector2[] = [];
    // Start at top, assume 1st element is main one
    // find top left point, see if anything is on same Y level (intersects using r.y <= each.y OR r.y <= each.y+height)...r.x<=each.x (+width)
    // assuming #1 is the room, and #2+ are doors
    var [room, ...doors] = r;
    // doors are typeof DoorRoom
    // console.log(doors);

    var roomBounds = getBounds(room);
    var doorBounds: Bounds[] = [];
    var current: Point;
    var next: Point;
    let wallPoints: Point[] = [
      { x: roomBounds.minX, y: roomBounds.minY },
      { x: roomBounds.maxX, y: roomBounds.minY },
      { x: roomBounds.maxX, y: roomBounds.maxY },
      { x: roomBounds.minX, y: roomBounds.maxY },
      { x: roomBounds.minX, y: roomBounds.minY },
    ];
    // Round wallls, FML

    // Print x and y for each corner point
    // doorPoints.forEach((p, i) =>
    //   // console.log(`doorPoint[${i}] -> x: ${p.x}, y: ${p.y}`),
    // );

    // Print x and y for each door associated with this room
    // doors.forEach((d, i) => console.log(`door[${i}] -> x: ${d.x}, y: ${d.y}`));

    var roomCommands: PathCommand[] = [];
    var doorRoomMetadata: Door[] = [];
    current = wallPoints.shift()!;

    // next = doorPoints.shift()!;
    doors.forEach((door) => {
      // doorBounds.push(getBounds(door));
      let db = getBounds(door);
      doorBounds.push(db);
    });
    // find doors that may need to be drawn

    // loop start is around here ish

    if (room.rotunda) {
      let pivot = {
        x: roomBounds.minX + (roomBounds.maxX - roomBounds.minX) / 2,
        y: roomBounds.minY + (roomBounds.maxY - roomBounds.minY) / 2,
      };
      // roomCommands.push([Command.MOVE, pivot.x, pivot.y]);

      // var toDrawDoors: Bounds[];
      // roomCommands.push([
      //   Command.QUAD,
      //   roomBounds.minX,
      //   roomBounds.maxY,

      //   roomBounds.maxX,
      //   roomBounds.maxY,
      // ]);
      var circlePoints: Point[] = [
        { x: roomBounds.minX, y: pivot.y + 75 },
        { x: roomBounds.minX, y: pivot.y - 75 },
        { x: pivot.x - 75, y: roomBounds.minY },
        { x: pivot.x + 75, y: roomBounds.minY },
        { x: roomBounds.maxX, y: pivot.y - 75 },
        { x: roomBounds.maxX, y: pivot.y + 75 },
        { x: pivot.x + 75, y: roomBounds.maxY },
        { x: pivot.x - 75, y: roomBounds.maxY },
        { x: roomBounds.minX, y: pivot.y + 75 },
      ];
      var current = circlePoints.shift()!;
      roomCommands.push([Command.MOVE, current.x, current.y]);

      while (circlePoints.length > 0) {
        var next = circlePoints.shift()!;
        let difference: Vector2 = diff(next, current);
        var direction: string = "";

        if (difference.x !== 0 && difference.y !== 0)
          direction = Directions.NONE;
        else if (difference.x < 0) direction = Directions.LEFT;
        else if (difference.x > 0) direction = Directions.RIGHT;
        else if (difference.y > 0) direction = Directions.DOWN;
        else if (difference.y < 0) direction = Directions.UP;
        const doors: Door[] = [];

        var toDrawDoors: Bounds[] = [];
        // no point calculating doors if there isnt one
        if (direction !== Directions.NONE) {
          toDrawDoors = doorBounds.filter((d) => {
            if (direction === Directions.UP) {
              return d.maxX == current.x;
            } else if (direction === Directions.DOWN) {
              return d.minX == current.x;
            } else if (direction === Directions.LEFT) {
              return d.minY == current.y;
            } else if (direction === Directions.RIGHT) {
              return d.maxY == current.y;
            }
          });
          // console.log(direction, toDrawDoors);

          if (toDrawDoors.length !== 0) {
            // toDrawDoors.sort((a, b) => {
            //   if (direction == Directions.RIGHT || direction == Directions.UP) {
            //     // Sort max < min
            //     return a.maxX - b.minX;
            //   }
            //   //
            //   return b.minX - a.maxX;
            // });

            toDrawDoors.forEach((door) => {
              let d: Door = {
                start: { distance: 0, index: 0 },
                end: { distance: 0, index: 0 },
                open: false,
              };
              if (direction == Directions.RIGHT) {
                console.log("Drawing door in Directions.RIGHT");

                roomCommands.push([Command.LINE, door.minX, door.maxY]);
                roomCommands.push([Command.LINE, door.minX, door.minY]);
                d.start.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.maxX, door.minY]);
                d.end.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.maxX, door.maxY]);
              } else if (direction == Directions.LEFT) {
                console.log("Drawing door in Directions.LEFT");

                roomCommands.push([Command.LINE, door.maxX, door.minY]);
                roomCommands.push([Command.LINE, door.maxX, door.maxY]);
                d.start.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.minX, door.maxY]);
                d.end.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.minX, door.minY]);
              }

              // up down
              else if (direction == Directions.DOWN) {
                console.log("Drawing door in Directions.DOWN", door);

                roomCommands.push([Command.LINE, door.minX, door.minY]);
                roomCommands.push([Command.LINE, door.maxX, door.minY]);
                d.start.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.maxX, door.maxY]);
                d.end.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.minX, door.maxY]);
              } else if (direction == Directions.UP) {
                console.log("Drawing door in Directions.UP");

                roomCommands.push([Command.LINE, door.maxX, door.maxY]);
                roomCommands.push([Command.LINE, door.minX, door.maxY]);
                d.start.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.minX, door.minY]);
                d.end.distance = distance(roomCommands, pivot);

                roomCommands.push([Command.LINE, door.maxX, door.minY]);
              }
              console.log("door", d);
              doors.push(d);
            });
          } else {
            // draw blank arc
            roomCommands.push(...approximateArc(pivot, current, next));
          }
          // remove drawn doors from doorBounds so they aren't processed twice
          for (const d of toDrawDoors) {
            const i = doorBounds.indexOf(d);
            if (i !== -1) doorBounds.splice(i, 1);
          }

          // finish loop
        } else {
          // sides
          roomCommands.push(...approximateArc(pivot, current, next));
        }
        doorRoomMetadata.push(...doors);

        current = next;
      }
      // dont do square logic
      //
      //
      //
      //
      //
    } else {
      roomCommands.push([Command.MOVE, current.x, current.y]);

      while (wallPoints.length > 0) {
        next = wallPoints.shift()!;
        // console.log(roomCommands);

        // take the difference between current and next to determine direction, then sort drawDoors by direction and positive/negative
        let difference: Point = diff(next, current);
        // console.log(diff);

        var toDrawDoors: Bounds[];

        var direction: string = "";
        if (difference.x < 0) direction = Directions.LEFT;
        else if (difference.x > 0) direction = Directions.RIGHT;
        else if (difference.y > 0) direction = Directions.DOWN;
        else if (difference.y < 0) direction = Directions.UP;
        else {
          console.warn("No movement detected between points. Skipping.");
          continue; // Skip processing if no movement
        }
        // console.log(current, next, direction);

        // Adjust for doors at wall corners
        // toDrawDoors = doorBounds.filter((door) => {
        //   return (
        //     (door.minX === current.x && door.minY === current.y) ||
        //     (door.maxX === current.x && door.maxY === current.y)
        //   );
        // });

        // toDrawDoors = drawDoors(current, next);
        toDrawDoors = doorBounds.filter((d) => {
          if (direction === Directions.UP) {
            return d.maxX == current.x;
          } else if (direction === Directions.DOWN) {
            return d.minX == current.x;
          } else if (direction === Directions.LEFT) {
            return d.minY == current.y;
          } else if (direction === Directions.RIGHT) {
            return d.maxY == current.y;
          }
        });
        // console.log(toDrawDoors);

        toDrawDoors.sort((a, b) => {
          if (direction == Directions.RIGHT || direction == Directions.UP) {
            // Sort max < min
            return a.maxX - b.minX;
          }
          //
          return b.minX - a.maxX;
        });

        // remove drawn doors from doorBounds so they aren't processed twice
        for (const d of toDrawDoors) {
          const i = doorBounds.indexOf(d);
          if (i !== -1) doorBounds.splice(i, 1);
        }
        // draw to first door, go around, then back on track, then goto door, go around etc

        const doors: Door[] = [];

        toDrawDoors.forEach((door) => {
          let d: Door = {
            start: { distance: 0, index: 0 },
            end: { distance: 0, index: 0 },
            open: false,
          };

          // calculate distance
          //TODO: add to object for later use and writing.
          if (direction == Directions.RIGHT) {
            roomCommands.push([Command.LINE, door.minX, door.maxY]);
            roomCommands.push([Command.LINE, door.minX, door.minY]);
            d.start.distance = distance(roomCommands);
            roomCommands.push([Command.LINE, door.maxX, door.minY]);
            d.end.distance = distance(roomCommands);
            roomCommands.push([Command.LINE, door.maxX, door.maxY]);
          } else if (direction == Directions.LEFT) {
            roomCommands.push([Command.LINE, door.maxX, door.minY]);
            roomCommands.push([Command.LINE, door.maxX, door.maxY]);
            d.start.distance = distance(roomCommands);
            roomCommands.push([Command.LINE, door.minX, door.maxY]);
            d.end.distance = distance(roomCommands);
            roomCommands.push([Command.LINE, door.minX, door.minY]);
          }
          // up down
          else if (direction == Directions.DOWN) {
            roomCommands.push([Command.LINE, door.minX, door.minY]);
            roomCommands.push([Command.LINE, door.maxX, door.minY]);
            d.start.distance = distance(roomCommands);

            roomCommands.push([Command.LINE, door.maxX, door.maxY]);
            d.end.distance = distance(roomCommands);

            roomCommands.push([Command.LINE, door.minX, door.maxY]);
          } else if (direction == Directions.UP) {
            roomCommands.push([Command.LINE, door.maxX, door.maxY]);
            roomCommands.push([Command.LINE, door.minX, door.maxY]);
            d.start.distance = distance(roomCommands);

            roomCommands.push([Command.LINE, door.minX, door.minY]);
            d.end.distance = distance(roomCommands);

            roomCommands.push([Command.LINE, door.maxX, door.minY]);
          }
          doors.push(d);
        });

        if (
          roomCommands[roomCommands.length - 1][1] !== next.x ||
          roomCommands[roomCommands.length - 1][2] !== next.y
        ) {
          roomCommands.push([Command.LINE, next.x, next.y]);
        }
        doorRoomMetadata.push(...doors);

        current = next;
        // if (doorPoints.length != 0)

        // if true, then draw, checking for matching on each stroke?? or maybe just when complete? double doors?
      }
    }

    roomCommands.push([Command.CLOSE]);

    commands.push(roomCommands);
    doorMetadatas.push(doorRoomMetadata);
  }
  // console.log(commands);

  return { commands: commands, metadata: doorMetadatas };
}

// DPI
export function generateWalls(jsonText: string) {
  const scale = 150;
  // console.log(OBR.scene.items.getItems());
  // calculate positioning

  var content: OPMap = JSON.parse(jsonText)!;
  let rfm = reformatRooms(jsonText)!;

  var commands: PathCommand[][] = rfm.commands;
  var metadata: Door[][] = rfm.metadata;
  console.log(metadata);

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
  //TODO: update to paths seperated by doors
  let paths: Path[] = [];
  for (const [index, c] of commands.entries()) {
    let d = buildPath().commands(c).layer("FOG");
    if (metadata[index]) {
      console.log(metadata.at(index));

      d = d.metadata({
        "rodeo.owlbear.dynamic-fog/doors": metadata.at(index),
      });
    }
    paths.push(d.build());
  }

  // console.log(paths);
  OBR.scene.items.addItems(paths).then(
    () => {
      console.log("created items");
    },
    (reason) => {
      console.log(reason);
    },
  );
  // const walls: Array<Shape> = [];
  // content.rects.forEach((rect) => {
  //   const normalX = rect.x - bounds.minX + 1;
  //   const normalY = rect.y - bounds.minY + 1;

  //   if (rect.rotunda) {
  //     let wall = buildShape()
  //       .shapeType("CIRCLE")
  //       .width((Math.sqrt(0.25 + rect.w ** 2) + 0.2) * scale)
  //       .height((Math.sqrt(0.25 + rect.h ** 2) + 0.2) * scale)
  //       .position({
  //         x: (normalX + rect.w / 2) * scale,
  //         y: (normalY + rect.h / 2) * scale,
  //       })
  //       .layer("FOG")
  //       .build();
  //     walls.push(wall);
  //   } else {
  //     let wall = buildShape()
  //       .shapeType("RECTANGLE")
  //       .width(rect.w * scale)
  //       .height(rect.h * scale)
  //       .position({
  //         x: normalX * scale,
  //         y: normalY * scale,
  //       })
  //       .layer("FOG")
  //       .build();
  //     walls.push(wall);
  //   }
  //   // OBR.scene.local.addItems([wall]);\
  // });
}
