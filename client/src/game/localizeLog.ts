import type { Language } from "../i18n";

const tileNames: Record<string, string> = {
  "Launch Plaza": "启航广场",
  "Mint Yard": "薄荷小院",
  "Lucky Booth": "好运亭",
  "Berry Lane": "莓果街",
  "Pocket Bank": "口袋银行",
  "Cloud Corner": "云朵转角",
  "City Tax": "城市税",
  "Prize Tent": "奖券帐篷",
  "Rocket Row": "火箭街",
  "Trade Pier": "交易码头",
  "Puzzle Park": "拼图公园",
  "Storm Sign": "风暴牌",
  "Candy Court": "糖果庭院",
  "Savings Bank": "储蓄银行",
  "Gear Garden": "齿轮花园",
  "Sky Tram": "天空缆车",
  "Nova Nook": "星光小筑",
  "Bonus Gate": "加分彩门",
  "Fun Arcade": "欢乐游乐场",
  "Marble Market": "大理石市场",
  "Stock Dome": "股票穹顶",
  "Pixel Port": "像素港",
  "Luxury Tax": "豪华税",
  "Broken Bridge": "断桥",
  "Crown Plaza": "皇冠广场",
  "Lucky Wheel": "幸运转盘",
  "Crystal Walk": "水晶步道",
  "Trust Bank": "信托银行",
  "Bright Chance": "闪亮机会",
  "Harbor Hub": "海港中心",
  "Market Hall": "市场大厅",
  "Tunnel Gate": "隧道门"
};

const eventTitles: Record<string, string> = {
  "Launch Plaza": "启航广场",
  "Open Lot": "待售地产",
  "Owned Property": "自有地产",
  "Max Level": "满级地产",
  "Rent Due": "支付租金",
  "Bank Visit": "银行到访",
  "Stock Market": "股票市场",
  "Prize Tent": "奖券帐篷",
  "Fun Arcade": "欢乐游乐场",
  "Tax Office": "税务所",
  "Teleport Gate": "传送门",
  "Portal Closed": "传送门关闭",
  "Start Plaza": "起点广场",
  "Choose Your Road": "选择岔路",
  "Skill Shop": "技能小铺",
  "Rent Shield": "租金护盾",
  "Tax Coupon": "税收优惠券",
  "Street Festival": "街区庆典",
  "Sponsor Deal": "赞助合约",
  "Neighborhood Buzz": "街区人气",
  "Builder Coupon": "建造优惠券",
  "Tech Gift": "科技股票礼包",
  "Fresh Basket": "餐饮股票礼包",
  "Express Shuttle": "快速接驳车",
  Tailwind: "顺风前进",
  "Energy Rally": "能源股上涨",
  "Helpful Review": "好评奖励",
  "Late Permit": "许可逾期",
  "Maintenance Day": "维修日",
  "Tech Slump": "科技股下跌",
  "Wrong Turn": "走错路",
  "Paperwork Queue": "排队办手续",
  "Audit Notice": "审计通知",
  "Renovation Delay": "装修延期",
  "Food Recall": "餐饮召回",
  "Storage Fee": "仓储费",
  "Closed Street": "道路封闭"
};

const exactMessages: Record<string, string> = {
  "Game started. The first player was chosen at random.": "游戏开始，先手玩家已随机决定。",
  "The stock market updated its prices.": "股票市场价格已更新。",
  "Game ended. Rankings are final.": "游戏结束，最终排行已结算。",
  "A calm stop at the starting plaza.": "在起点广场短暂停留。",
  "A calm stop at a personal starting plaza.": "在个人起点广场短暂停留。",
  "Buy or sell TECH, FOOD, and ENERGY before ending the turn.": "股票地块已改为情报/优惠地块，股票委托可随时提交。",
  "Pick one road to continue moving.": "选择一条路继续移动。",
  "Spend tickets to buy one active skill card.": "可以花彩券购买一张主动技能卡。",
  "A rent shield blocked this payment.": "租金护盾挡下了这次付款。",
  "A tax coupon waived this payment.": "税收优惠券免除了这次付款。",
  "Won a reflex game for 700 coins.": "赢下反应小游戏，获得 700 金币。",
  "Won a puzzle game for 1200 coins.": "赢下益智小游戏，获得 1200 金币。",
  "Lost a challenge and paid 450 coins.": "挑战失败，支付 450 金币。",
  "Spent too long playing and will skip a turn.": "玩得太久了，下回合暂停一次。"
};

const reasons: Record<string, string> = {
  "an event": "随机事件",
  "an event fee": "事件费用",
  "owned property bonus": "地产奖励",
  "unused builder coupon": "未使用建造券补偿",
  "passing Launch Plaza": "经过启航广场",
  "bank interest": "银行利息",
  "lottery ticket": "购买彩票",
  "lottery prize": "彩票奖励",
  "lottery loss": "彩票损失",
  "arcade reward": "游乐场奖励",
  "arcade loss": "游乐场损失",
  "property maintenance": "地产维护",
  "delay compensation": "延期补偿"
};

const cardDescriptions: Record<string, string> = {
  "The island festival is a hit. Gain 1200 coins.": "海岛庆典大受欢迎，获得 1200 金币。",
  "A sponsor likes your route. Gain 1800 coins.": "赞助商看好你的路线，获得 1800 金币。",
  "Owned streets attract visitors. Gain 300 coins per property.": "你的街区吸引游客，每块地产获得 300 金币。",
  "Upgrade one owned property for free.": "免费升级一块自有地产。",
  "Receive 5 TECH shares.": "获得 5 股 TECH。",
  "Receive 5 FOOD shares.": "获得 5 股 FOOD。",
  "Move forward to Launch Plaza and collect salary.": "前进到启航广场并领取工资。",
  "Move forward 3 spaces.": "前进 3 格。",
  "ENERGY rises by 15 percent.": "ENERGY 上涨 15%。",
  "Tourists leave excellent reviews. Gain 900 coins.": "游客留下好评，获得 900 金币。",
  "Pay a 900 coin permit fine.": "支付 900 金币许可罚款。",
  "Pay 260 coins for each owned property.": "每块自有地产支付 260 金币维修费。",
  "TECH falls by 18 percent.": "TECH 下跌 18%。",
  "Move back 3 spaces.": "后退 3 格。",
  "Skip your next turn.": "跳过你的下一个回合。",
  "Pay 12 percent of current cash.": "支付当前现金的一部分作为审计费用。",
  "One upgraded property loses a level.": "一块已升级地产降 1 级。",
  "FOOD falls by 15 percent.": "FOOD 下跌 15%。",
  "Pay 700 coins.": "支付 700 金币。",
  "Move back 2 spaces.": "后退 2 格。"
  ,
  "A rainbow booth gifts you 2 tickets.": "彩虹摊位送给你 2 张彩券。",
  "Receive 4 ENERGY shares.": "获得 4 股 ENERGY。",
  "Block one future rent payment.": "挡下一次未来租金付款。",
  "The next tax payment is waived.": "下一次税收付款将被免除。",
  "Gain 1 ticket.": "获得 1 张彩券。",
  "TECH rises by 10 percent.": "TECH 上涨 10%。",
  "Lose 1 ticket.": "失去 1 张彩券。",
  "Pay 500 coins.": "支付 500 金币。",
  "Pay 400 coins.": "支付 400 金币。",
  "ENERGY falls by 12 percent.": "ENERGY 下跌 12%。",
  "Pay 180 coins for each owned property.": "每块自有地产支付 180 金币维修费。",
  "Move back 1 space.": "后退 1 格。",
  "Lose 2 tickets.": "失去 2 张彩券。",
  "The wheel lands on gold. Gain 2500 coins.": "转盘停在黄金大奖，获得 2500 金币。",
  "A bright spin pays 1200 coins.": "闪亮转盘奖励 1200 金币。",
  "Win 3 tickets.": "赢得 3 张彩券。",
  "Win 500 coins.": "赢得 500 金币。",
  "The capsule is empty. Lose 300 coins.": "胶囊是空的，损失 300 金币。",
  "Prize tax takes 600 coins.": "奖金税扣走 600 金币。",
  "The arcade refunds 2 tickets.": "游乐场返还 2 张彩券。",
  "Lose a boss challenge and pay 450 coins.": "挑战关主失败，支付 450 金币。",
  "Move forward 4 spaces.": "前进 4 格。",
  "Pay 350 coins to repair a joystick.": "支付 350 金币修理摇杆。",
  "Gain 1 ticket from a combo bonus.": "连击奖励获得 1 张彩券。"
};

function zhTile(name: string): string {
  return tileNames[name] ?? name;
}

function zhReason(reason: string): string {
  return reasons[reason] ?? zhTile(reason);
}

function translateDetail(message: string): string {
  const exact = exactMessages[message] ?? cardDescriptions[message];
  if (exact) {
    return exact;
  }

  let result = message;
  for (const [english, chinese] of Object.entries(cardDescriptions)) {
    result = result.replace(english, chinese);
  }

  result = result.replace(/^(.+) can be bought for (\d+) coins\.$/, (_, tile, amount) => {
    return `${zhTile(tile)} 可以用 ${amount} 金币购买。`;
  });
  result = result.replace(/^(.+) can be upgraded for (\d+) coins\.$/, (_, tile, amount) => {
    return `${zhTile(tile)} 可以用 ${amount} 金币升级。`;
  });
  result = result.replace(/^(.+) is already fully upgraded\.$/, (_, tile) => {
    return `${zhTile(tile)} 已经满级。`;
  });
  result = result.replace(/^(.+) collected (\d+) coins in rent\.$/, (_, owner, amount) => {
    return `${owner} 收到 ${amount} 金币租金。`;
  });
  result = result.replace(/^The bank paid (\d+) coins in simplified MVP interest\.$/, (_, amount) => {
    return `银行发放 ${amount} 金币简化利息。`;
  });
  result = result.replace(/^The bank paid (\d+) coins and gave 1 ticket\.$/, (_, amount) => {
    return `银行发放 ${amount} 金币，并赠送 1 张彩券。`;
  });
  result = result.replace(/^Ticket cost 300\. Lottery result: ([+-]?\d+) coins\.$/, (_, amount) => {
    return `彩票花费 300 金币，结果为 ${amount} 金币。`;
  });
  result = result.replace(/^Paid (\d+) coins\.$/, (_, amount) => {
    return `支付 ${amount} 金币。`;
  });
  result = result.replace(/^Moved to (.+)\.$/, (_, tile) => {
    return `移动到${zhTile(tile)}。`;
  });
  result = result.replace(/^Spent (\d+) ticket and moved to (.+)\.$/, (_, cost, tile) => {
    return `花费 ${cost} 张彩券，传送到${zhTile(tile)}。`;
  });
  result = result.replace(/^Need (\d+) ticket to use this portal\.$/, (_, cost) => {
    return `需要 ${cost} 张彩券才能使用这个传送门。`;
  });
  result = result.replace(/^Cash changed by ([+-]?\d+)\.$/, (_, amount) => {
    return `现金变化 ${amount}。`;
  });
  result = result.replace(/^Tickets changed by ([+-]?\d+)\.$/, (_, amount) => {
    return `彩券变化 ${amount}。`;
  });
  result = result.replace(/^Owned property bonus: \+(\d+)\.$/, (_, amount) => {
    return `地产奖励：+${amount}。`;
  });
  result = result.replace(/^No upgrade was available, so it became \+600 coins\.$/, () => {
    return "没有可升级地产，改为获得 600 金币。";
  });
  result = result.replace(/^Received (\d+) (TECH|FOOD|ENERGY) shares\.$/, (_, count, symbol) => {
    return `获得 ${count} 股 ${symbol}。`;
  });
  result = result.replace(/^Moved to Launch Plaza\.$/, "移动到启航广场。");
  result = result.replace(/^Moved ([+-]?\d+) spaces\.$/, (_, steps) => {
    return `移动 ${steps} 格。`;
  });
  result = result.replace(/^Will skip (\d+) turn\.$/, (_, turns) => {
    return `将跳过 ${turns} 个回合。`;
  });
  result = result.replace(/^Maintenance fee: (\d+)\.$/, (_, amount) => {
    return `维护费：${amount} 金币。`;
  });
  result = result.replace(/^(TECH|FOOD|ENERGY) moved by ([+-]?\d+) percent\.$/, (_, symbol, percent) => {
    return `${symbol} 波动 ${percent}%。`;
  });
  result = result.replace(/^One property lost a level\.$/, "一块地产降低 1 级。");
  result = result.replace(/^Tax relief is ready for the next tax tile\.$/, "下次到达税收格时可免税。");
  result = result.replace(/^Rent shield is ready for the next rent payment\.$/, "下次支付租金时可用护盾抵消。");
  result = result.replace(/^Repair kit blocked the maintenance fee\.$/, "维修工具包挡下了维护费。");
  result = result.replace(
    /^No upgraded property was found, so a 500 coin fee was paid\.$/,
    "没有已升级地产，改为支付 500 金币费用。"
  );

  return result;
}

export function localizeEventText(message: string, language: Language): string {
  return language === "zh" ? translateDetail(message) : message;
}

export function localizeLog(message: string, language: Language): string {
  if (language === "en") {
    return message;
  }

  const exact = exactMessages[message];
  if (exact) {
    return exact;
  }

  let match = message.match(/^(.+) went bankrupt and now watches the match\.$/);
  if (match) {
    return `${match[1]} 已破产，进入观战。`;
  }

  match = message.match(/^(.+) paid (\d+) coins for (.+)\.$/);
  if (match) {
    return `${match[1]} 为${zhReason(match[3] ?? "")}支付 ${match[2]} 金币。`;
  }

  match = message.match(/^(.+) gained (\d+) coins from (.+)\.$/);
  if (match) {
    return `${match[1]} 通过${zhReason(match[3] ?? "")}获得 ${match[2]} 金币。`;
  }

  match = message.match(/^(.+) gained (\d+) tickets from (.+)\.$/);
  if (match) {
    return `${match[1]} 通过${zhReason(match[3] ?? "")}获得 ${match[2]} 张彩券。`;
  }

  match = message.match(/^(.+) lost (\d+) tickets from (.+)\.$/);
  if (match) {
    return `${match[1]} 因${zhReason(match[3] ?? "")}失去 ${match[2]} 张彩券。`;
  }

  match = message.match(/^(.+) bought (.+) for (\d+) coins\.$/);
  if (match) {
    return `${match[1]} 用 ${match[3]} 金币购买了${zhTile(match[2] ?? "")}。`;
  }

  match = message.match(/^(.+) upgraded (.+) to level (\d+)\.$/);
  if (match) {
    return `${match[1]} 将${zhTile(match[2] ?? "")}升级到 ${match[3]} 级。`;
  }

  match = message.match(/^(.+) bought (\d+) (TECH|FOOD|ENERGY) shares\.$/);
  if (match) {
    return `${match[1]} 买入 ${match[2]} 股 ${match[3]}。`;
  }

  match = message.match(/^(.+) sold (\d+) (TECH|FOOD|ENERGY) shares\.$/);
  if (match) {
    return `${match[1]} 卖出 ${match[2]} 股 ${match[3]}。`;
  }

  match = message.match(/^(.+) chose (.+)\.$/);
  if (match) {
    return `${match[1]} 选择了${zhTile(match[2] ?? "")}。`;
  }

  match = message.match(/^(.+) bought skill card (.+)\.$/);
  if (match) {
    return `${match[1]} 购买了技能卡「${match[2]}」。`;
  }

  match = message.match(/^(.+) used (.+)\.$/);
  if (match) {
    return `${match[1]} 使用了「${match[2]}」。`;
  }

  match = message.match(/^(.+) set the next dice to (\d+)\.$/);
  if (match) {
    return `${match[1]} 将下一次骰子设为 ${match[2]}。`;
  }

  match = message.match(/^(.+) prepared (.+)\.$/);
  if (match) {
    return `${match[1]} 准备了${match[2]}。`;
  }

  match = message.match(/^(.+) froze (.+) for one turn\.$/);
  if (match) {
    return `${match[1]} 让 ${match[2]} 暂停一回合。`;
  }

  match = message.match(/^(.+) pulled (\d+) coins from (.+)\.$/);
  if (match) {
    return `${match[1]} 从 ${match[3]} 那里吸走 ${match[2]} 金币。`;
  }

  match = message.match(/^(.+) swapped places with (.+)\.$/);
  if (match) {
    return `${match[1]} 和 ${match[2]} 交换了位置。`;
  }

  match = message.match(/^(.+) jumped to (.+)\.$/);
  if (match) {
    return `${match[1]} 跳跃到${zhTile(match[2] ?? "")}。`;
  }

  match = message.match(/^Round (\d+) ended\.$/);
  if (match) {
    return `第 ${match[1]} 轮结束。`;
  }

  match = message.match(/^(.+) skipped a turn\.$/);
  if (match) {
    return `${match[1]} 跳过了一个回合。`;
  }

  match = message.match(/^(.+): (.+) - (.+)$/);
  if (match) {
    const title = eventTitles[match[2] ?? ""] ?? match[2];
    return `${match[1]}：${title} - ${translateDetail(match[3] ?? "")}`;
  }

  return translateDetail(message);
}
