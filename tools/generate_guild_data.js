"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sourcePath = path.join(ROOT, "data", "Xianxin_guild.md");
const outputPath = path.join(ROOT, "data", "tu_tien_factions.json");
const worldBridgePath = path.join(ROOT, "data", "world_data.js");

function loadFactionData() {
  if (fs.existsSync(outputPath)) {
    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  }
  if (!fs.existsSync(worldBridgePath)) {
    throw new Error("Không tìm thấy tu_tien_factions.json hoặc js/world_data.js để giữ dữ liệu thế giới hiện có.");
  }
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(worldBridgePath, "utf8"), sandbox, { filename: worldBridgePath });
  if (!sandbox.window.FACTION_DATA?.world || !Array.isArray(sandbox.window.FACTION_DATA.factions)) {
    throw new Error("js/world_data.js không chứa FACTION_DATA hợp lệ.");
  }
  return sandbox.window.FACTION_DATA;
}

const TIER_NAMES = {
  1: "Thái Cổ Thánh Địa / Tối Cao Thế Lực",
  2: "Đại Tông Môn / Nhất Lưu Thế Lực",
  3: "Trung Cấp Tông Môn / Nhị Lưu Thế Lực",
  4: "Tiểu Thế Lực / Tam Lưu Tông Môn",
  5: "Môn Phái Nhỏ / Hắc Đạo / Tán Tu Liên Minh"
};

const REGION_POOLS = {
  "Linh Vực": ["trung_vuc"],
  "Hoang Dã": ["dong_hoang", "bac_nguyen", "nam_chuong"],
  "Biên Thành": ["tay_mac", "trung_vuc"],
  "Vương Kinh": ["trung_vuc"],
  "Hải Vực/Không Vực": ["vo_tan_hai", "thien_khong_vuc"],
  "Cấm Địa": ["u_minh_gioi"]
};

const REALM_KEYS = {
  "Trúc Cơ": "truc_co",
  "Kim Đan": "kim_dan",
  "Nguyên Anh": "nguyen_anh",
  "Hóa Thần": "hoa_than",
  "Luyện Hư": "luyen_hu",
  "Hợp Thể": "hop_dao",
  "Đại Thừa": "dai_thua",
  "Độ Kiếp": "do_kiep"
};

function slugify(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseRange(value) {
  const values = [...value.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (!values.length) return { min: 0, max: 0 };
  return { min: values[0], max: values[1] ?? values[0] };
}

function clean(value) {
  return value.replace(/\*\*/g, "").replace(/T族/g, "Tộc").trim();
}

function factionCoordinates(regionId, numericId, factionData) {
  const region = factionData.world.regions.find((item) => item.id === regionId);
  const angle = ((numericId * 137.508) % 360) * Math.PI / 180;
  const radius = 5 + (numericId % 5) * 1.7;
  return {
    x: Number(Math.max(4, Math.min(96, region.x + Math.cos(angle) * radius)).toFixed(2)),
    y: Number(Math.max(5, Math.min(95, region.y + Math.sin(angle) * radius)).toFixed(2))
  };
}

function parseGuilds(markdown, factionData) {
  let tier = 0;
  const guilds = [];
  markdown.split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^## CẤP (\d+):/);
    if (heading) tier = Number(heading[1]);
    if (!/^\|\s*\d+\s*\|/.test(line)) return;

    const cells = line.split("|").slice(1, -1).map(clean);
    if (cells.length !== 13) throw new Error(`Dòng guild không đủ 13 cột: ${line}`);
    const numericId = Number(cells[0]);
    const name = cells[1];
    const regionType = cells[4];
    const regionPool = REGION_POOLS[regionType] || ["trung_vuc"];
    const regionId = regionPool[numericId % regionPool.length];
    const coordinates = factionCoordinates(regionId, numericId, factionData);
    const realmNames = cells[6].split("/").map((value) => value.trim());
    const highestRealmName = realmNames[realmNames.length - 1];

    guilds.push({
      id: `guild_${String(numericId).padStart(3, "0")}_${slugify(name)}`,
      source_id: numericId,
      name,
      pyramid_tier: tier,
      tier_name: TIER_NAMES[tier],
      type: cells[2],
      race: cells[3],
      region_type: regionType,
      region_id: regionId,
      x: coordinates.x,
      y: coordinates.y,
      allegiance: cells[5],
      alignment: cells[5] === "Ma Đạo" ? "Tà" : cells[5] === "Chính Đạo" ? "Chính" : "Trung Lập",
      highest_realm_text: cells[6],
      highest_realm: REALM_KEYS[highestRealmName] || slugify(highestRealmName),
      scale: parseRange(cells[7]),
      city_penalty_reduction_pct: parseRange(cells[8]),
      cultivation_exp_bonus_pct: parseRange(cells[9]),
      resources: Number(parseRange(cells[10]).min),
      reputation: Number(cells[11]),
      traits: cells[12].split(",").map((value) => value.trim()).filter(Boolean)
    });
  });
  return guilds;
}

function main() {
  const factionData = loadFactionData();
  const guilds = parseGuilds(fs.readFileSync(sourcePath, "utf8"), factionData);
  if (guilds.length !== 150) throw new Error(`Cần đúng 150 thế lực, nhận được ${guilds.length}.`);
  if (new Set(guilds.map((guild) => guild.id)).size !== guilds.length) throw new Error("ID thế lực bị trùng.");
  factionData.guild_source = {
    generated_at: new Date().toISOString(),
    source: "data/Xianxin_guild.md",
    total: guilds.length
  };
  factionData.guild_tiers = Object.entries(TIER_NAMES).map(([id, name]) => ({
    id: Number(id),
    name,
    count: guilds.filter((guild) => guild.pyramid_tier === Number(id)).length
  }));
  factionData.guilds = guilds;
  fs.writeFileSync(outputPath, `${JSON.stringify(factionData, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(ROOT, outputPath)} (${guilds.length} guilds)`);
}

main();
