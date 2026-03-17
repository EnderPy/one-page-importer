import OBR, {
  buildPath,
  Command,
  type Image,
  type PathCommand,
} from "@owlbear-rodeo/sdk";
import type { Bounds, Scale2D, Transform2D } from "./types";

function parseXML(SVG: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(SVG, "image/svg+xml");
}

function getFirstGroupWithTransform(SVG: Document): SVGGElement | null {
  const groups = Array.from(SVG.getElementsByTagName("g"));
  return groups.find((g) => g.hasAttribute("transform")) || null;
}

function getScaleFromXML(SVG: Document): Scale2D | null {
  const svgElement = SVG.getElementsByTagName("svg")[0];
  if (!svgElement) return null;
  return {
    width: parseFloat(svgElement.getAttribute("width") || "-1"),
    height: parseFloat(svgElement.getAttribute("height") || "-1"),
  };
}

function getFogFromSVG(
  SVG: Document,
  colour: string = "#FF0000",
): string | null {
  const path = Array.from(SVG.getElementsByTagName("path")).find(
    (p) => p.getAttribute("fill") == colour,
  );

  return path ? path.getAttribute("d") : null;
}

function formatSVGToOBRPath(svgPath: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const svgCommands = svgPath.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
  for (const command of svgCommands) {
    const type = command[0];
    const params = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    if (type === "M") {
      commands.push([Command.MOVE, params[0], params[1]]);
    } else if (type === "L") {
      commands.push([Command.LINE, params[0], params[1]]);
    }
  }
  return commands;
}

export function generateSVGWalls(
  svgPath: string,
  image: Image | null = null,
): void {
  const XML = parseXML(svgPath);
  const path = getFogFromSVG(XML);
  const scale = getScaleFromXML(XML) || { width: 1, height: 1 };
  let t = getFirstGroupWithTransform(XML);
  var transform: Transform2D = {
    scale: { x: 1, y: 1 },
    translate: { x: 0, y: 0 },
  };
  if (t) {
    const transformAttr = t.getAttribute("transform");
    const scaleMatch = transformAttr?.match(/scale\(([^)]+)\)/);
    const translateMatch = transformAttr?.match(/translate\(([^)]+)\)/);

    transform = {
      scale: scaleMatch
        ? {
            x: parseFloat(scaleMatch[1].split(" ")[0]),
            y: parseFloat(
              scaleMatch[1].split(" ")[1] || scaleMatch[1].split(",")[0],
            ),
          }
        : { x: 1, y: 1 },
      translate: translateMatch
        ? {
            x: parseFloat(translateMatch[1].split(" ")[0]),
            y: parseFloat(translateMatch[1].split(" ")[1] || "0"),
          }
        : { x: 0, y: 0 },
    };
  }

  if (!path) return;
  console.log(path);
  const commands = formatSVGToOBRPath(path);

  const bounds: Bounds = commands.reduce(
    (prev, cur) => {
      if (cur[0] === Command.MOVE || cur[0] === Command.LINE) {
        const [, x, y] = cur;
        return {
          minX: Math.min(prev.minX, x),
          minY: Math.min(prev.minY, y),
          maxX: Math.max(prev.maxX, x),
          maxY: Math.max(prev.maxY, y),
        };
      }
      return prev;
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  if (image) {
    let grid = image.grid;
    grid.offset;
    // console.log(image.image, scale, grid);
    console.log(transform, bounds);

    OBR.scene.items.addItems([
      buildPath()
        .commands(commands)
        .scale({
          x:
            ((image.image.width * image.scale.x) / scale.width) *
            transform.scale.x,
          y:
            ((image.image.height * image.scale.y) / scale.height) *
            transform.scale.y,
        })
        .position({
          x:
            0 +
            image.position.x +
            transform.translate.x *
              ((image.image.width * image.scale.x) / scale.width),
          y:
            image.position.y +
            transform.translate.y *
              ((image.image.height * image.scale.y) / scale.height),
        })
        .layer("FOG")
        .build(),
    ]);
  } else
    OBR.scene.items.addItems([
      buildPath()
        .commands(commands)
        .position(transform.translate)
        .scale(transform.scale)
        .layer("FOG")
        .build(),
    ]);
}
