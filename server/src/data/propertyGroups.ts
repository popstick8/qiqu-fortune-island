import type { PropertyGroup } from "@monopoly/shared";

export const propertyGroups: Record<string, PropertyGroup> = {
  star_moon_creative: {
    id: "star_moon_creative",
    name: "星月文创街",
    tileIds: ["tile-01", "tile-03", "tile-04", "tile-19", "tile-22"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后星月文创街租金翻倍。"
  },
  cloud_plaza_street: {
    id: "cloud_plaza_street",
    name: "云朵广场街",
    tileIds: ["tile-26", "tile-27", "tile-29"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后云朵广场街租金翻倍。"
  },
  central_fun_street: {
    id: "central_fun_street",
    name: "中央乐园街",
    tileIds: ["tile-06", "tile-08", "tile-64", "tile-66"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后中央乐园街租金翻倍。"
  },
  sea_resort: {
    id: "sea_resort",
    name: "海风度假区",
    tileIds: ["tile-10", "tile-12", "tile-62"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后海风度假区租金翻倍。"
  },
  south_style_street: {
    id: "south_style_street",
    name: "南门时尚街",
    tileIds: ["tile-15", "tile-17", "tile-30", "tile-32", "tile-34"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后南门时尚街租金翻倍。"
  },
  lower_canal_street: {
    id: "lower_canal_street",
    name: "下城运河街",
    tileIds: ["tile-36", "tile-38", "tile-40"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后下城运河街租金翻倍。"
  },
  west_living_area: {
    id: "west_living_area",
    name: "西风生活区",
    tileIds: ["tile-42", "tile-44", "tile-46"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后西风生活区租金翻倍。"
  },
  canal_snack_street: {
    id: "canal_snack_street",
    name: "运河小吃街",
    tileIds: ["tile-52", "tile-53", "tile-54"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后运河小吃街租金翻倍。"
  },
  east_port_business: {
    id: "east_port_business",
    name: "东港商圈",
    tileIds: ["tile-55", "tile-57", "tile-59", "tile-60", "tile-67"],
    rentMultiplierWhenComplete: 2,
    bonusDescription: "集齐后东港商圈租金翻倍。"
  }
};

export const propertyGroupByTileId = Object.fromEntries(
  Object.values(propertyGroups).flatMap((group) => group.tileIds.map((tileId) => [tileId, group.id]))
) as Record<string, string>;
