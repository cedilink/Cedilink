// Draws the merchant sidebar and top bar so each screen file only holds its own content.
// <body data-active="links" data-crumbs="Workspace|Link management|CDL-003">
(function () {
  var A = "../../../src/assets/illustrations/";
  var i = function (d) {
    return (
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      d +
      "</svg>"
    );
  };
  var ICON = {
    dashboard: i(
      '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    ),
    transactions: i(
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    ),
    links: i(
      '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    ),
    reconciliation: i(
      '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12l2 2 4-4"/>',
    ),
    stellar: i('<circle cx="12" cy="12" r="8"/><path d="M5 14l14-6"/>'),
    settings: i(
      '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    ),
    help: i(
      '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14"/><path d="M12 17h.01"/>',
    ),
  };
  var GROUPS = [
    [
      "Workspace",
      [
        ["dashboard", "Dashboard", "notifications.html"],
        [
          "transactions",
          "Transaction history",
          "transaction-detail.html",
          "32",
        ],
        ["links", "Link management", "payment-details.html"],
      ],
    ],
    [
      "Payment operations",
      [
        ["reconciliation", "Reconciliation", "reconciliation.html", "3", "red"],
        ["stellar", "Stellar USDC", "#"],
      ],
    ],
    [
      "Other",
      [
        ["settings", "Settings", "#"],
        ["help", "Help &amp; Support", "#"],
      ],
    ],
  ];
  var body = document.body;
  var active = body.dataset.active;
  var nav = GROUPS.map(function (g) {
    return (
      '<div><p class="grp">' +
      g[0] +
      '</p><nav class="nav" aria-label="' +
      g[0] +
      '">' +
      g[1]
        .map(function (it) {
          var on = it[0] === active;
          return (
            '<a href="' +
            it[2] +
            '"' +
            (on ? ' class="on" aria-current="page"' : "") +
            ">" +
            ICON[it[0]] +
            it[1] +
            (it[3]
              ? '<span class="badge' +
                (it[4] ? " " + it[4] : "") +
                '">' +
                it[3] +
                "</span>"
              : "") +
            "</a>"
          );
        })
        .join("") +
      "</nav></div>"
    );
  }).join("");
  var side = document.createElement("aside");
  side.className = "side";
  side.innerHTML =
    '<div class="brandrow"><img class="mascot" src="' +
    A +
    'mascot.png" alt="">Cedilink SmartPay</div>' +
    '<label class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg><input aria-label="Search" placeholder="Search.."><span class="small">⌘/</span></label>' +
    nav +
    '<div class="me"><img class="mascot" style="width:36px;height:36px" src="' +
    A +
    'mascot.png" alt=""><span>Ama Boateng<br><span class="muted">Merchant</span></span></div>';
  var app = document.querySelector(".app");
  app.insertBefore(side, app.firstChild);

  var crumbs = (body.dataset.crumbs || "Workspace").split("|");
  var top = document.createElement("div");
  top.className = "topbar";
  top.innerHTML =
    '<button class="ibtn menu" style="display:none" aria-label="Open menu">' +
    i('<path d="M4 7h16M4 12h16M4 17h16"/>') +
    "</button>" +
    '<p class="crumbs">' +
    crumbs
      .map(function (c) {
        return '<b style="font-weight:400">' + c + "</b>";
      })
      .join("<span>/</span>") +
    "</p>" +
    '<button class="ibtn" aria-label="About this page">' +
    i('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>') +
    "</button>" +
    '<a class="ibtn" href="notifications.html" aria-label="Notifications, 2 unread">' +
    i(
      '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    ) +
    '<span class="dot"></span></a>';
  var main = document.querySelector(".main");
  main.insertBefore(top, main.firstChild);
})();
