import { readFileSync } from "node:fs";
import { mapTiles } from "../server/src/data/bigMap";
import { skillCardTemplates } from "../server/src/data/skillCards";

const mapDocument = readFileSync(new URL("../MAP_PLAN.md", import.meta.url), "utf8");
const skillDocument = readFileSync(new URL("../SKILL_CARDS.md", import.meta.url), "utf8");
const rulesDocument = readFileSync(new URL("../GAME_RULES.md", import.meta.url), "utf8");
const actionsSource = readFileSync(new URL("../server/src/game/actions.ts", import.meta.url), "utf8");
const disabledCodes = new Set(["remoteTrade", "portalDiscount", "teleport"]);

const missingMapTiles = mapTiles
  .filter((tile) => !mapDocument.includes(`| ${tile.id} |`))
  .map((tile) => tile.id);
const missingSkillRows = skillCardTemplates
  .filter((card) => !skillDocument.includes(`\`${card.code}\``))
  .map((card) => card.code);
const activeCards = skillCardTemplates.filter((card) => !disabledCodes.has(card.code));
const missingActionReferences = activeCards
  .filter((card) => !actionsSource.includes(`"${card.code}"`) && !actionsSource.includes(`'${card.code}'`))
  .map((card) => card.code);

const staleText = [
  "72 格地图",
  "60 格主路线",
  "tile-05 传送门",
  "tile-15 传送门",
  "购买前 3 张技能卡 7 折",
  "Math.ceil(originalCost * 0.7)"
].filter((text) => rulesDocument.includes(text) || mapDocument.includes(text));

const result = {
  mapTiles: mapTiles.length,
  documentedMapTiles: mapTiles.length - missingMapTiles.length,
  skillCards: skillCardTemplates.length,
  documentedSkillCards: skillCardTemplates.length - missingSkillRows.length,
  activeSkillCards: activeCards.length,
  activeActionReferences: activeCards.length - missingActionReferences.length,
  missingMapTiles,
  missingSkillRows,
  missingActionReferences,
  staleText
};

console.log(JSON.stringify(result, null, 2));

if (missingMapTiles.length || missingSkillRows.length || missingActionReferences.length || staleText.length) {
  process.exitCode = 1;
}
