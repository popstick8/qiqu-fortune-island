import { writeFileSync } from "node:fs";
import { skillCardTemplates, rarityWeights } from "../server/src/data/skillCards";

const disabledReasons = new Map<string, string>([
  ["remoteTrade", "股票委托本来就能随时提交，因此不进入商店池。"],
  ["portalDiscount", "当前传送门免费，优惠卡没有实际作用。"],
  ["teleport", "旧版任意地点传送与当前传送门互传规则冲突。"]
]);

const rarityNames = {
  common: "普通",
  rare: "稀有",
  epic: "史诗"
} as const;

const targetNames = {
  self: "自己",
  player: "玩家",
  tile: "地块",
  property: "地产",
  stock: "股票",
  propertyGroup: "地产套装",
  none: "无需目标"
} as const;

const typeNames = {
  active: "主动",
  passive: "被动",
  attack: "攻击",
  defense: "防御",
  movement: "移动",
  economy: "经济",
  stock: "股票",
  lottery: "彩票",
  chance: "运气",
  utility: "辅助"
} as const;

function cell(value: unknown): string {
  return String(value ?? "-")
    .replaceAll("|", "\\|")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

const activeCount = skillCardTemplates.filter((card) => !disabledReasons.has(card.code)).length;
const lines = [
  "# 奇趣财富岛技能卡图鉴",
  "",
  "> 本文件由 `npm run docs:skills` 根据 `server/src/data/skillCards.ts` 自动生成。请不要手工修改表格。",
  "",
  `当前共配置 **${skillCardTemplates.length}** 张技能卡，其中 **${activeCount}** 张进入可获得池，**${skillCardTemplates.length - activeCount}** 张保留定义但已停用。`,
  "",
  "## 抽取与购买通则",
  "",
  `- 单卡抽取权重：普通 ${rarityWeights.common}、稀有 ${rarityWeights.rare}、史诗 ${rarityWeights.epic}。实际概率还会随当前候选池变化。`,
  "- 同一次技能小铺展示不会重复出现同一种卡。房主关闭强力卡后，史诗卡不进入候选池。",
  "- 默认展示 8 张，可由房主设置为 1 到 20 张。手牌已满时不能购买；随机获得卡但手牌已满时改得 1 张彩券。",
  "- 商店折扣使下次进入技能小铺后购买的前 3 张卡各便宜 1 张彩券，最终价格最低 1 张彩券。",
  "- 回收技能卡通常返还其标价彩券；受到回收惩罚时只返还向下取整的半价。",
  "- 一回合可使用多张技能卡，但目标、距离、持续状态、冲突和游戏阶段均由服务端校验。",
  "",
  "## 完整卡表",
  "",
  "| # | 状态 | 技能 | 费用 | 稀有度 | 类型 | 目标 | 范围 | 持续 | 效果 |",
  "|---:|---|---|---:|---|---|---|---:|---:|---|"
];

skillCardTemplates.forEach((card, index) => {
  const disabledReason = disabledReasons.get(card.code);
  const status = disabledReason ? `停用：${disabledReason}` : "启用";
  lines.push(
    `| ${index + 1} | ${cell(status)} | ${cell(card.name)} \`${cell(card.code)}\` | ${card.costTickets} | ${rarityNames[card.rarity]} | ${card.type ? typeNames[card.type] : "-"} | ${targetNames[card.target]} | ${cell(card.range)} | ${cell(card.durationDays)} | ${cell(card.description)} |`
  );
});

lines.push(
  "",
  "## 持续效果说明",
  "",
  "持续型技能会在左侧 Buff/Debuff 区显示名称、剩余回合或天数及说明。一次性效果触发后移除；同类唯一状态通常替换旧状态或被服务端拒绝，具体以服务端校验结果为准。",
  ""
);

writeFileSync(new URL("../SKILL_CARDS.md", import.meta.url), lines.join("\n"), "utf8");
