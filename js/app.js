(async function () {
  const grid = document.getElementById("grid");
  const tbody = document.getElementById("tbody");
  const updated = document.getElementById("updated");
  let data;
  try {
    data = window.NYYO_PRICES || (await (await fetch("./data/prices.json")).json());
  } catch (e) {
    updated.textContent = "Could not load price data.";
    return;
  }
  const when = data.updated_at || "?";
  // Show in a friendly way; raw is UTC
  updated.textContent = "Last scrape: " + when + " (UTC) · source: CoinGecko public API";
  grid.innerHTML = "";
  tbody.innerHTML = "";
  (data.items || []).forEach((it) => {
    const up = (it.change_24h_pct || 0) >= 0;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML =
      "<h3>" +
      it.name +
      '</h3><div class="price">$' +
      Number(it.price_usd).toLocaleString(undefined, { maximumFractionDigits: 2 }) +
      '</div><div class="chg ' +
      (up ? "up" : "down") +
      '">' +
      (up ? "▲" : "▼") +
      " " +
      Math.abs(it.change_24h_pct) +
      "% 24h</div>";
    grid.appendChild(card);
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      it.name +
      "</td><td>$" +
      Number(it.price_usd).toLocaleString(undefined, { maximumFractionDigits: 2 }) +
      "</td><td class='" +
      (up ? "chg up" : "chg down") +
      "'>" +
      (up ? "+" : "") +
      it.change_24h_pct +
      "%</td><td>" +
      (it.source || "") +
      "</td>";
    tbody.appendChild(tr);
  });
})();
