export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
  rotunda?: boolean;
  ending?: boolean;
  roomID?: string;
}

export interface OPDoor extends Point {
  dir: Point;
  type: number;
  open?: boolean;
}
export interface DoorRoom extends Rect {
  doors?: OPDoor[];
}
export interface DoorPos {
  distance: number;
  index: number;
}

export interface Door {
  start: DoorPos;
  end: DoorPos;
  open: Boolean;
}

export interface Note {
  text: string;
  ref: string;
  pos: Point;
}

export interface Bounds {
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
export interface OPMap {
  version: string;
  title: string;
  story: string;
  rects: Rect[];
  doors: OPDoor[];
  notes: Note[];
  columns: Point[];
  water: any[]; // Use Point[] or Rect[] here if water follows those structures
}

export interface Scale2D {
  width: number;
  height: number;
}

export interface Transform2D  {
  scale: Point,
  translate: Point
}