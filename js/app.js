(async function () {
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const topbar = $("topbar");
  window.addEventListener(
    "scroll",
    () => topbar.classList.toggle("scrolled", window.scrollY > 6),
    { passive: true }
  );

  let data;
  try {
    data = window.NYYO_PRICES || (await (await fetch("./data/prices.json")).json());
  } catch (e) {
    $("updated").textContent = "Could not load price data.";
    return;
  }

  const items = (data.items || []).map((it) => ({
    ...it,
    history_24h: Array.isArray(it.history_24h) ? it.history_24h.slice() : [it.price_usd],
  }));
  let selectedId = items[0]?.id;
  let chart;
  let tickTimer;

  function fmtUSD(n, digits) {
    n = Number(n) || 0;
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    return (
      "$" +
      n.toLocaleString(undefined, {
        maximumFractionDigits: digits != null ? digits : n < 10 ? 4 : 2,
      })
    );
  }

  function animateNumber(el, to, opts) {
    opts = opts || {};
    const prefix = opts.prefix || "";
    const suffix = opts.suffix || "";
    const format = opts.format || ((v) => v.toFixed(opts.digits ?? 0));
    const from = opts.from != null ? opts.from : 0;
    if (reduce) {
      el.textContent = prefix + format(to) + suffix;
      return;
    }
    const dur = opts.dur || 900;
    const t0 = performance.now();
    function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;
      el.textContent = prefix + format(v) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function visibleItems() {
    const q = ($("q").value || "").trim().toLowerCase();
    const dir = $("dir").value;
    const sort = $("sort").value;
    let list = items.slice();
    if (q) {
      list = list.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.symbol || "").toLowerCase().includes(q) ||
          it.id.includes(q)
      );
    }
    if (dir === "up") list = list.filter((it) => it.change_24h_pct >= 0);
    if (dir === "down") list = list.filter((it) => it.change_24h_pct < 0);
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price") return b.price_usd - a.price_usd;
      if (sort === "change") return b.change_24h_pct - a.change_24h_pct;
      return (b.market_cap_usd || 0) - (a.market_cap_usd || 0);
    });
    return list;
  }

  function updateKpis(list) {
    const count = list.length;
    const mcap = list.reduce((s, it) => s + (it.market_cap_usd || 0), 0);
    const vol = list.reduce((s, it) => s + (it.volume_24h_usd || 0), 0);
    const avg = count ? list.reduce((s, it) => s + it.change_24h_pct, 0) / count : 0;
    animateNumber($("kpiCount"), count, { format: (v) => String(Math.round(v)) });
    animateNumber($("kpiMcap"), mcap, {
      format: (v) => fmtUSD(v).replace(/^\$/, ""),
      prefix: "$",
    });
    animateNumber($("kpiVol"), vol, {
      format: (v) => fmtUSD(v).replace(/^\$/, ""),
      prefix: "$",
    });
    animateNumber($("kpiAvg"), avg, {
      format: (v) => (v >= 0 ? "+" : "") + v.toFixed(2),
      suffix: "%",
    });
    $("kpiAvgSub").className = "sub " + (avg >= 0 ? "up" : "down");
    $("rowCount").textContent = count + " asset" + (count === 1 ? "" : "s");
  }

  function sparkSvg(hist, up) {
    if (!hist || hist.length < 2) return "";
    const w = 96, h = 32, pad = 2;
    const min = Math.min(...hist), max = Math.max(...hist);
    const span = max - min || 1;
    const pts = hist
      .map((v, i) => {
        const x = pad + (i / (hist.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / span) * (h - pad * 2);
        return x.toFixed(1) + "," + y.toFixed(1);
      })
      .join(" ");
    const color = up ? "#39ff88" : "#ff6b8a";
    return (
      '<svg class="spark" viewBox="0 0 ' +
      w +
      " " +
      h +
      '" width="96" height="32" aria-hidden="true"><polyline fill="none" stroke="' +
      color +
      '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" points="' +
      pts +
      '"/></svg>'
    );
  }

  function renderTable() {
    const list = visibleItems();
    updateKpis(list);
    const tbody = $("tbody");
    tbody.innerHTML = "";
    list.forEach((it) => {
      const up = it.change_24h_pct >= 0;
      const tr = document.createElement("tr");
      tr.dataset.id = it.id;
      if (it.id === selectedId) tr.style.background = "rgba(61,139,255,.08)";
      tr.innerHTML =
        '<td class="name">' +
        it.name +
        '<span class="sym">' +
        (it.symbol || "") +
        "</span></td>" +
        '<td class="num">' +
        fmtUSD(it.price_usd) +
        "</td>" +
        '<td class="num chg ' +
        (up ? "up" : "down") +
        '">' +
        (up ? "+" : "") +
        Number(it.change_24h_pct).toFixed(2) +
        "%</td>" +
        "<td>" +
        sparkSvg(it.history_24h, up) +
        "</td>" +
        '<td class="num">' +
        fmtUSD(it.volume_24h_usd) +
        "</td>" +
        '<td class="num">' +
        fmtUSD(it.market_cap_usd) +
        "</td>" +
        "<td>" +
        (it.source || "") +
        "</td>";
      tr.addEventListener("click", () => {
        selectedId = it.id;
        renderTable();
        renderChart();
        $("chartHint").textContent = it.name + " · last 24 points";
      });
      tbody.appendChild(tr);
    });
  }

  function renderChart() {
    const it = items.find((x) => x.id === selectedId) || items[0];
    if (!it || typeof Chart === "undefined") return;
    const ctx = $("priceChart").getContext("2d");
    const up = it.change_24h_pct >= 0;
    const color = up ? "#39ff88" : "#ff6b8a";
    const labels = it.history_24h.map((_, i) => i + "h");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: it.symbol || it.name,
            data: it.history_24h,
            borderColor: color,
            backgroundColor: up ? "rgba(57,255,136,.12)" : "rgba(255,107,138,.12)",
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "#121c34",
            titleColor: "#e8eefc",
            bodyColor: "#8b9bb8",
            borderColor: "rgba(120,160,255,.2)",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: "#8b9bb8", maxTicksLimit: 8, font: { size: 10 } },
            grid: { color: "rgba(120,160,255,.06)" },
          },
          y: {
            ticks: {
              color: "#8b9bb8",
              font: { size: 10 },
              callback: (v) => fmtUSD(v),
            },
            grid: { color: "rgba(120,160,255,.08)" },
          },
        },
      },
    });
    $("chartHint").textContent = it.name + " · last 24 points";
  }

  function pushFeed(it, note) {
    const feed = $("feed");
    const up = it.change_24h_pct >= 0;
    const el = document.createElement("div");
    el.className = "feed-item";
    el.innerHTML =
      '<div class="sym">' +
      (it.symbol || "?").slice(0, 4) +
      "</div>" +
      "<div><div class=\"title\">" +
      it.name +
      "</div><div class=\"meta\">" +
      (note || "scrape refresh") +
      " · " +
      new Date().toLocaleTimeString() +
      "</div></div>" +
      '<div class="delta ' +
      (up ? "up" : "down") +
      '">' +
      fmtUSD(it.price_usd) +
      "</div>";
    feed.prepend(el);
    while (feed.children.length > 12) feed.lastChild.remove();
  }

  function setUpdated() {
    const when = data.updated_at || new Date().toISOString();
    $("updated").textContent = "Last scrape: " + when.replace("T", " ").replace("Z", " UTC");
  }

  function simulateTick() {
    const it = items[Math.floor(Math.random() * items.length)];
    const delta = it.price_usd * (Math.random() * 0.006 - 0.0025);
    it.price_usd = Math.max(0.0001, +(it.price_usd + delta).toFixed(it.price_usd < 10 ? 4 : 2));
    it.change_24h_pct = +(it.change_24h_pct + (Math.random() * 0.2 - 0.08)).toFixed(2);
    it.history_24h.push(it.price_usd);
    if (it.history_24h.length > 24) it.history_24h.shift();
    data.updated_at = new Date().toISOString();
    setUpdated();
    pushFeed(it, "live tick");
    renderTable();
    if (it.id === selectedId) renderChart();
    const row = document.querySelector('tr[data-id="' + it.id + '"]');
    if (row) {
      row.classList.remove("flash");
      void row.offsetWidth;
      row.classList.add("flash");
    }
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type: type || "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportCSV() {
    const list = visibleItems();
    const rows = [["id", "name", "symbol", "price_usd", "change_24h_pct", "volume_24h_usd", "market_cap_usd", "source"]];
    list.forEach((it) => {
      rows.push([
        it.id,
        it.name,
        it.symbol || "",
        it.price_usd,
        it.change_24h_pct,
        it.volume_24h_usd || "",
        it.market_cap_usd || "",
        it.source || "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    download("nyyo-scrape-export.csv", csv, "text/csv");
  }

  function exportJSON() {
    download(
      "nyyo-scrape-export.json",
      JSON.stringify({ updated_at: data.updated_at, items: visibleItems() }, null, 2),
      "application/json"
    );
  }

  // Wire UI
  ["q", "dir", "sort"].forEach((id) => {
    $(id).addEventListener("input", renderTable);
    $(id).addEventListener("change", renderTable);
  });
  $("btnSim").addEventListener("click", simulateTick);
  $("btnCsv").addEventListener("click", exportCSV);
  $("btnJson").addEventListener("click", exportJSON);

  setUpdated();
  items.slice(0, 4).forEach((it) => pushFeed(it, "initial scrape"));
  renderTable();

  function bootChart() {
    if (typeof Chart !== "undefined") renderChart();
    else setTimeout(bootChart, 50);
  }
  bootChart();

  // Gentle auto ticks so the board feels alive
  if (!reduce) {
    tickTimer = setInterval(simulateTick, 4500);
  }

  window.addEventListener("beforeunload", () => clearInterval(tickTimer));
})();
