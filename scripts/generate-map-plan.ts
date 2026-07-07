import { writeFileSync } from "node:fs";
import type { Tile } from "@monopoly/shared";
import { mapTiles } from "../server/src/data/bigMap";
import { propertyGroups } from "../server/src/data/propertyGroups";

const typeNames: Record<Tile["type"], string> = {
  start: "GO 起点",
  property: "地产",
  bank: "银行",
  stock: "股市",
  lottery: "彩票店",
  arcade: "游乐场",
  chance: "好运",
  misfortune: "厄运",
  tax: "税收",
  teleport: "传送门",
  portal: "传送门",
  junction: "路口",
  choice_junction: "路口",
  skillShop: "技能小铺",
  plaza: "广场",
  safe_landing: "安全落点",
  empty: "空地",
  jail: "监狱",
  hospital: "医院",
  go_jail: "入狱格",
  hospital_entry: "医院入口",
  reward: "奖励",
  draw_card: "抽卡"
};

const groupNameByTileId = new Map(
  Object.values(propertyGroups).flatMap((group) => group.tileIds.map((tileId) => [tileId, group.name] as const))
);

function cell(value: unknown): string {
  return String(value ?? "-")
    .replaceAll("|", "\\|")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

const lines = [
  "# 奇趣财富岛地图坐标与路线规划",
  "",
  "> 本文件由 `npm run docs:map` 根据 `server/src/data/bigMap.ts` 自动生成。坐标为 SVG `1000 × 720` 画布中的地块中心点。",
  "",
  `当前共 **${mapTiles.length}** 个节点：68 个普通路线节点、6 个监狱支路节点、6 个医院支路节点。`,
  "",
  "## 坐标规划表",
  "",
  "| tileId | 显示名称 | 类型 | 所属套装 | x | y | next 连接 | 外圈 | 内圈 | 支路 | 主路 | 说明 |",
  "|---|---|---|---|---:|---:|---|---|---|---|---|---|"
];

for (const tile of mapTiles) {
  const branch = tile.routeType === "detention";
  lines.push(
    `| ${cell(tile.id)} | ${cell(tile.name)} | ${typeNames[tile.type]} | ${cell(groupNameByTileId.get(tile.id))} | ${tile.position?.x ?? "-"} | ${tile.position?.y ?? "-"} | ${cell(tile.next?.join(", "))} | ${tile.routeType === "outer" ? "是" : ""} | ${tile.routeType === "inner" ? "是" : ""} | ${branch ? "是" : ""} | ${branch ? "" : "是"} | ${cell(tile.description)} |`
  );
}

lines.push(
  "",
  "## 路线说明",
  "",
  "### 中央内圈",
  "",
  "`tile-00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17 -> tile-00`",
  "",
  "### 上方扩展",
  "",
  "`tile-00 -> 26 -> 25 -> 24 -> 18 -> 19 -> 20 -> 21 -> 22 -> 23 -> 27 -> 28 -> 29 -> tile-05`",
  "",
  "### 右侧扩展",
  "",
  "`tile-05 -> 55 -> 56 -> 57 -> 58 -> 59 -> 60 -> 61 -> 62 -> 63 -> 64 -> 65 -> 66 -> 67 -> tile-09`",
  "",
  "### 下方扩展",
  "",
  "`tile-09 -> 39 -> 40 -> 41 -> 35 -> 34 -> 33 -> 32 -> 31 -> 30 -> 38 -> 37 -> 36 -> tile-14`",
  "",
  "### 左侧扩展",
  "",
  "`tile-14 -> 54 -> 53 -> 52 -> 51 -> 50 -> 49 -> 48 -> 47 -> 42 -> 43 -> 44 -> 45 -> 46 -> tile-00`",
  "",
  "### 处罚支路",
  "",
  "- 监狱：`tile-24 => jail-05 -> jail-04 -> jail-03 -> jail-02 -> jail-01 -> jail-00 -> tile-18`。",
  "- 医院：`tile-41 => hospital-05 -> hospital-04 -> hospital-03 -> hospital-02 -> hospital-01 -> hospital-00 -> tile-35`。",
  "- 监狱和医院本体不属于正常主路，只有入口、事件或技能会把玩家送入。",
  "",
  "### 四个关键路口",
  "",
  "- `tile-00`：中央内圈 / 上方扩展。",
  "- `tile-05`：中央内圈 / 右侧扩展。",
  "- `tile-09`：中央内圈 / 下方扩展。",
  "- `tile-14`：中央内圈 / 左侧扩展。",
  "- 无技能时服务端等权随机并避免原路返回；路线券或路口罗盘才能手动选择。",
  "",
  "### 传送门",
  "",
  "- 传送门 B：`tile-48`，位于左侧中心。",
  "- 传送门 A：`tile-61`，位于右侧中心。",
  "- 两个传送门免费互传，不连接其他类型地块。",
  ""
);

writeFileSync(new URL("../MAP_PLAN.md", import.meta.url), lines.join("\n"), "utf8");
