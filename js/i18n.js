/* Bộ định dạng hiển thị trung tâm: raw ID chỉ tồn tại ở data-* và save. */
(function () {
  "use strict";
  const CONTRACTS = { hunt: "Truy Săn", escort: "Hộ Tống", retrieve: "Thu Hồi", investigate: "Điều Tra", capture: "Bắt Sống" };
  const STATUS = { unknown: "Chưa biết", revealed: "Đã phát hiện", verified: "Đã xác minh", discovered: "Đã biết", offered: "Đang mời", accepted: "Đã nhận", cancelled: "Đã hủy", closed: "Đã đóng", failed: "Thất bại", locked: "Chưa mở", trial: "Đang thí luyện", ready: "Đủ điều kiện", evolved: "Đã tiến hóa", chosen: "Đã chọn", pending: "Đang chờ", active: "Đang hoạt động", expired: "Đã quá hạn", completed: "Đã hoàn thành", resolved: "Đã giải quyết" };
  const WEATHER = { quang: "Quang đãng", mua: "Mưa", suong: "Sương", loi_vu: "Lôi Vũ", linh_phong: "Linh Phong" };
  const ELEMENTS = { moc: "Mộc", hoa: "Hỏa", kim: "Kim", thuy: "Thủy", tho: "Thổ", phong: "Phong", loi: "Lôi", bang: "Băng", huyet: "Huyết", vo_he: "Vô hệ" };
  const OUTCOMES = { contained: "đã khống chế", survived: "đã vượt qua", ignored: "đã bỏ lỡ", located: "đã tìm thấy", escaped: "đã mất dấu", released: "phóng thích", turned_in: "giao nộp", executed: "xử quyết", won: "thắng", lost: "thất bại", kill: "tiêu diệt", capture: "bắt sống", search: "điều tra", travel: "hộ tống", item: "thu hồi vật phẩm" };
  const CATEGORIES = { tam_phap: "Tâm Pháp", chieu_thuc: "Chiêu Thức", than_phap: "Thân Pháp", phu_tro: "Phụ Trợ", tran_phap: "Trận Pháp", cam_thuat: "Cấm Thuật", dan_phu_phap: "Đan · Phù · Tạp Pháp", procedural: "Vật phẩm biến hóa" };
  function lookup(state, id) {
    const value = String(id ?? "");
    const regions = window.GameData?.WORLD_MAP?.regions || [];
    const factions = window.GameData?.WORLD_MAP?.factions || window.GameData?.FACTION_DATA?.factions || [];
    return window.GameData?.ITEMS?.[value]?.name || window.GameData?.NPCS?.[value]?.name || window.GameData?.ENTITIES?.[value]?.name || window.GameData?.LOCATIONS?.[value]?.name || window.GameData?.FACTIONS?.[value]?.name || regions.find((entry) => entry.id === value)?.name || factions.find((entry) => entry.id === value)?.name || window.EXPANSION_DATA?.professionDefinitions?.[value]?.name || window.EXPANSION_DATA?.hiddenProfessions?.[value]?.name || null;
  }
  function target(contract, state) { if (typeof contract === "string") return lookup(state, contract) || "đối tượng chưa định danh"; return contract?.targetEntityId ? (lookup(state, contract.targetEntityId) || "mục tiêu được chỉ định") : contract?.targetLocationId ? (lookup(state, contract.targetLocationId) || "khu vực được chỉ định") : contract?.targetItemId ? (lookup(state, contract.targetItemId) || "vật phẩm được chỉ định") : "mục tiêu theo dấu"; }
  function formatHistory(text, state) {
    let result = String(text ?? "");
    Object.entries(CONTRACTS).forEach(([id, label]) => { result = result.replace(new RegExp("\\b" + id + "\\b", "gi"), label); });
    result = result.replace(/\b(null|undefined|NaN)\b/gi, "chưa xác định");
    result = result.replace(/\b(unknown|revealed|verified|discovered|offered|accepted|cancelled|closed|failed|locked|trial|ready|evolved|chosen|pending|active|expired|completed|resolved)\b/gi, (value) => STATUS[value.toLowerCase()] || value);
    result = result.replace(/\b(quang|mua|suong|loi_vu|linh_phong)\b/gi, (value) => WEATHER[value] || value);
    result = result.replace(/\b(moc|hoa|kim|thuy|tho|phong|loi|bang|huyet|vo_he)\b/gi, (value) => ELEMENTS[value] || value);
    result = result.replace(/\b(contained|survived|ignored|located|escaped|released|turned_in|executed|won|lost|kill|capture|search|travel)\b/gi, (value) => OUTCOMES[value.toLowerCase()] || value);
    const regionCatalog = Object.fromEntries((window.GameData?.WORLD_MAP?.regions || []).map((entry) => [entry.id, entry]));
    const factionCatalog = Object.fromEntries((window.GameData?.WORLD_MAP?.factions || window.GameData?.FACTION_DATA?.factions || []).map((entry) => [entry.id, entry]));
    const catalogs = [window.GameData?.ITEMS, window.GameData?.NPCS, window.GameData?.ENTITIES, window.GameData?.LOCATIONS, window.GameData?.FACTIONS, regionCatalog, factionCatalog];
    catalogs.forEach((catalog) => Object.entries(catalog || {}).sort((a, b) => b[0].length - a[0].length).forEach(([id, value]) => {
      if (!value?.name || !id.includes("_")) return;
      result = result.replace(new RegExp("(^|[^A-Za-z0-9_])" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=$|[^A-Za-z0-9_])", "g"), "$1" + value.name);
    }));
    return result;
  }
  const formatContract = (contract) => CONTRACTS[contract?.templateId] || "Khế Ước";
  const formatStatus = (id) => STATUS[id] || "Trạng thái chưa xác định";
  const formatElement = (id) => ELEMENTS[id] || (/^[\p{L}\s·-]+$/u.test(String(id || "")) && !String(id).includes("_") ? String(id) : "Thuộc tính chưa xác định");
  window.GameI18n = { contractName: formatContract, formatContract, target, formatTarget: target, status: formatStatus, formatStatus, weather: (id) => WEATHER[id] || "Thời tiết chưa xác định", element: formatElement, category: (id) => CATEGORIES[id] || "Phân loại đặc biệt", formatHistory, lookup };
})();
