export const BOARD_SIZE = 9;

export function getBoardCell(index: number): { row: number; col: number } {
  if (index <= 8) {
    return { row: 9, col: index + 1 };
  }
  if (index <= 15) {
    return { row: 9 - (index - 8), col: 9 };
  }
  if (index <= 24) {
    return { row: 1, col: 9 - (index - 16) };
  }
  return { row: index - 23, col: 1 };
}

export function tileLabel(type: string): string {
  switch (type) {
    case "start":
      return "起点";
    case "property":
      return "地产";
    case "bank":
      return "银行";
    case "stock":
      return "股票";
    case "lottery":
      return "彩票";
    case "arcade":
      return "游乐";
    case "chance":
      return "好运";
    case "misfortune":
      return "厄运";
    case "tax":
      return "税收";
    case "teleport":
    case "portal":
      return "传送";
    case "junction":
      return "路口";
    case "choice_junction":
      return "岔路";
    case "plaza":
      return "广场";
    case "safe_landing":
      return "安全";
    case "empty":
      return "空地";
    case "jail":
      return "监狱";
    case "hospital":
      return "医院";
    case "go_jail":
      return "入狱";
    case "hospital_entry":
      return "医院";
    case "reward":
      return "奖励";
    case "draw_card":
      return "抽卡";
    default:
      return "地块";
  }
}

export function tileIcon(type: string): string {
  switch (type) {
    case "start":
      return "GO";
    case "property":
      return "◆";
    case "bank":
      return "$";
    case "stock":
      return "↗";
    case "lottery":
      return "?";
    case "arcade":
      return "★";
    case "chance":
      return "+";
    case "misfortune":
      return "!";
    case "tax":
      return "%";
    case "teleport":
    case "portal":
      return "⇄";
    case "junction":
      return "路";
    case "choice_junction":
      return "岔";
    case "plaza":
      return "★";
    case "safe_landing":
      return "安";
    case "empty":
      return "·";
    case "jail":
      return "牢";
    case "hospital":
      return "医";
    case "go_jail":
      return "警";
    case "hospital_entry":
      return "救";
    case "reward":
      return "奖";
    case "draw_card":
      return "卡";
    default:
      return "•";
  }
}
