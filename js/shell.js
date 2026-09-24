// Global persistent navigation shell - PROTOTYPE (Phase 1).
// Injects one shared left nav + search into any page that includes this
// script and has an empty <div id="global-nav-root"></div> as the first
// child of <body>. Only index.html and pages/git.html use it so far -
// every other page keeps its old per-page topbar/sidebar until Phase 2.
//
// Category section lists are NOT hardcoded here - for the active category,
// sections are read live from that page's own .doc-section/.cheat-section
// elements, so the nav can never go stale relative to the page it's on.

document.addEventListener("DOMContentLoaded", function () {
  var root = document.getElementById("global-nav-root");
  if (!root) return;

  var IS_SUBPAGE = location.pathname.indexOf("/pages/") !== -1;
  var BASE = IS_SUBPAGE ? "../" : "";
  var PAGE_PREFIX = IS_SUBPAGE ? "" : "pages/";

  // { group label -> category entries }. href is root-relative (as used
  // from index.html); BASE is prepended at render time for subpages.
  // cat: matches the --c-<cat> / --c-<cat>-soft variables in css/style.css,
  // used to tint each row's dot with its own category color instead of
  // every row looking the same neutral gray (see .global-nav-cat-link .dot)
  // extras: satellite pages (cheatsheet / biežākās problēmas / snippets /
  // WooCommerce) that share this category's body.cat-X class but aren't
  // full NAV_DATA entries of their own - rendered as small links under the
  // category so they're reachable straight from the sidebar instead of
  // only via in-page body links or site search.
  // Rebuilt from scratch after the full content wipe - only categories that
  // actually have real content go here now. Add a new { name, href, cat }
  // entry (and a --c-<cat> pair in css/style.css if it's a new color) each
  // time a new topic gets its first real notes, instead of pre-listing
  // everything up front like the old 19-category version did.
  var NAV_DATA = [
    {
      group: "Dokumentācija",
      items: [
        { name: "Laravel", href: "pages/laravel.html", cat: "laravel" },
        { name: "Tīkls", href: "pages/web-izveide.html", cat: "web" },
        { name: "Rīki", href: "pages/riki.html", cat: "riki" },
        { name: "WooCommerce", href: "pages/woocommerce.html", cat: "wordpress" },
        { name: "PHP", href: "pages/php.html", cat: "php" }
      ]
    }
  ];

  function currentPagePath() {
    // normalize to the same root-relative form used in NAV_DATA
    var parts = location.pathname.split("/");
    var file = parts[parts.length - 1] || "index.html";
    return IS_SUBPAGE ? "pages/" + file : file;
  }

  // Satellite pages (cheatsheets, vardnica, problem/snippet pages) share a
  // body.cat-X class with their parent NAV_DATA category but aren't
  // themselves NAV_DATA entries. Map cat-X -> the parent's href so the nav
  // still highlights the right category when browsing those pages.
  var CATEGORY_SLUG_MAP = {
    "cat-laravel": "pages/laravel.html",
    "cat-web": "pages/web-izveide.html",
    "cat-riki": "pages/riki.html",
    "cat-wordpress": "pages/woocommerce.html",
    "cat-php": "pages/php.html"
  };

  function currentCategoryHref() {
    var m = document.body.className.match(/\bcat-[a-z0-9-]+\b/);
    return m ? CATEGORY_SLUG_MAP[m[0]] || null : null;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function readCurrentPageSections() {
    var out = [];
    document.querySelectorAll("main .doc-section[id]").forEach(function (sec) {
      var h2 = sec.querySelector("h2");
      if (h2) out.push({ id: sec.id, title: h2.textContent.trim() });
    });
    document.querySelectorAll("main .cheat-section[id]").forEach(function (sec) {
      var h2 = sec.querySelector("h2");
      if (h2) out.push({ id: sec.id, title: h2.textContent.trim() });
    });
    return out;
  }

  function renderNav() {
    var current = currentPagePath();
    var categoryHref = currentCategoryHref();
    var sections = readCurrentPageSections();

    var html = '<div class="global-nav-brand">' +
      '<div class="term-titlebar"><span class="term-dots" aria-hidden="true"></span></div>' +
      '<a href="' + BASE + 'index.html" style="display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none;flex:1;min-width:0;">' +
      '<span class="mark"><svg viewBox="0 0 32 32" width="26" height="26"><rect x="1" y="1" width="30" height="30" rx="4" fill="#6ee6a3"/><path d="M 12 9.5 L 6.5 16 L 12 22.5" fill="none" stroke="#0a0d10" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M 20 9.5 L 25.5 16 L 20 22.5" fill="none" stroke="#0a0d10" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M 17.6 7.5 L 14.4 24.5" fill="none" stroke="#0a0d10" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".92"/></svg></span>' +
      '<span>Documentation Samis</span>' +
      '</a>' +
      '<button class="icon-btn" id="theme-toggle" title="Pārslēgt tēmu" aria-label="Pārslēgt tēmu">' +
      '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
      '</button>' +
      '</div>';

    html += '<div class="global-nav-search">' +
      '<input type="text" id="global-search-input" placeholder="Meklēt..." autocomplete="off">' +
      '<div class="global-nav-search-results" id="global-search-results"></div>' +
      '</div>';

    html += '<nav class="global-nav-groups">';
    NAV_DATA.forEach(function (group) {
      html += '<div class="global-nav-group"><h4>' + escapeHtml(group.group) + '</h4>';
      group.items.forEach(function (item) {
        var isActive = item.href === current || (categoryHref !== null && item.href === categoryHref);
        html += '<div class="global-nav-category">';
        html += '<a class="global-nav-cat-link' + (isActive ? ' active' : '') + '" href="' + BASE + item.href + '">' +
          '<span class="dot" style="background: var(--c-' + item.cat + ')"></span>' + escapeHtml(item.name) + '</a>';
        if (item.extras && item.extras.length) {
          html += '<div class="global-nav-extras">';
          item.extras.forEach(function (extra) {
            var extraActive = extra.href === current;
            html += '<a class="' + (extraActive ? 'active' : '') + '" href="' + BASE + extra.href + '">' + escapeHtml(extra.name) + '</a>';
          });
          html += '</div>';
        }
        if (isActive && sections.length) {
          html += '<div class="global-nav-sections">';
          sections.forEach(function (sec) {
            html += '<a href="#' + sec.id + '">' + escapeHtml(sec.title) + '</a>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    });
    html += '</nav>';

    root.innerHTML = html;
    root.className = "global-nav";
    root.id = "";
  }

  renderNav();

  // Sidebar collapse - shrinks the sidebar down to a thin rail (like
  // minimizing a terminal window), click again to reopen. Desktop-only
  // convenience (mobile already has its own open/closed toggle below);
  // state persists across pages. Two ways to trigger it: the terminal
  // dots (nice easter egg, but easy to miss) and an always-visible
  // chevron handle on the sidebar's edge (the actual discoverable one).
  var COLLAPSE_KEY = "docsamis-sidebar-collapsed";
  if (localStorage.getItem(COLLAPSE_KEY) === "1") {
    document.body.classList.add("sidebar-collapsed");
  }
  function toggleSidebar() {
    var collapsed = document.body.classList.toggle("sidebar-collapsed");
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    updateCollapseHandle();
  }
  var dots = document.querySelector(".term-dots");
  if (dots) {
    dots.style.cursor = "pointer";
    dots.title = "Aizvērt/atvērt sānjoslu";
    dots.addEventListener("click", toggleSidebar);
  }
  var collapseHandle = document.createElement("button");
  collapseHandle.className = "global-nav-collapse-handle";
  collapseHandle.setAttribute("aria-label", "Aizvērt/atvērt sānjoslu");
  function updateCollapseHandle() {
    var isCollapsed = document.body.classList.contains("sidebar-collapsed");
    collapseHandle.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="' + (isCollapsed ? "m10 6 6 6-6 6" : "m14 6-6 6 6 6") + '"/></svg>';
    collapseHandle.title = isCollapsed ? "Atvērt sānjoslu" : "Aizvērt sānjoslu";
  }
  updateCollapseHandle();
  collapseHandle.addEventListener("click", toggleSidebar);
  root.parentNode.insertBefore(collapseHandle, root.nextSibling);

  // mobile toggle
  var toggle = document.createElement("button");
  toggle.className = "global-nav-toggle";
  toggle.setAttribute("aria-label", "Atvērt navigāciju");
  toggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  document.body.insertBefore(toggle, root.nextSibling);
  var navEl = document.querySelector(".global-nav");
  toggle.addEventListener("click", function () {
    navEl.classList.toggle("open");
  });
  navEl.addEventListener("click", function (e) {
    if (e.target.closest("a") && window.innerWidth <= 900) {
      navEl.classList.remove("open");
    }
  });

  // active-section highlight on scroll (mirrors the old per-page sidebar
  // behaviour in main.js, generalized to the new nav's markup)
  var sectionLinks = document.querySelectorAll(".global-nav-sections a");
  if (sectionLinks.length && "IntersectionObserver" in window) {
    var targets = [];
    sectionLinks.forEach(function (link) {
      var el = document.getElementById(link.getAttribute("href").slice(1));
      if (el) targets.push({ link: link, el: el });
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = targets.filter(function (t) { return t.el === entry.target; })[0];
        if (!match) return;
        if (entry.isIntersecting) {
          sectionLinks.forEach(function (l) { l.classList.remove("active"); });
          match.link.classList.add("active");
        }
      });
    }, { rootMargin: "-15% 0px -70% 0px" });
    targets.forEach(function (t) { observer.observe(t.el); });
  }

  // ---- search (self-contained copy of main.js's engine, same cache key,
  // so the two never double-fetch pages the other already indexed) ----
  var SEARCH_PAGES = [
    "pages/laravel.html", "pages/web-izveide.html", "pages/riki.html", "pages/woocommerce.html", "pages/php.html"
  ];
  var SEARCH_INDEX_VERSION = "110";
  var searchIndex = null;
  var searchIndexPromise = null;

  function buildSearchIndex() {
    if (searchIndexPromise) return searchIndexPromise;
    var cacheKey = "docsamis-search-index-v" + SEARCH_INDEX_VERSION;
    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        searchIndex = JSON.parse(cached);
        searchIndexPromise = Promise.resolve(searchIndex);
        return searchIndexPromise;
      }
    } catch (e) {}

    searchIndexPromise = Promise.all(
      SEARCH_PAGES.map(function (path) {
        return fetch(BASE + path)
          .then(function (res) { return res.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, "text/html");
            var pageTitleEl = doc.querySelector(".doc-header h1");
            var pageTitle = pageTitleEl ? pageTitleEl.textContent.trim() : path;
            var entries = [];
            doc.querySelectorAll(".doc-section[id]").forEach(function (sec) {
              var h2 = sec.querySelector("h2");
              if (!h2) return;
              var p = sec.querySelector("p");
              entries.push({ page: path, pageTitle: pageTitle, id: sec.id, title: h2.textContent.trim(), snippet: p ? p.textContent.trim().slice(0, 120) : "" });
            });
            doc.querySelectorAll(".cheat-section[id]").forEach(function (sec) {
              sec.querySelectorAll(".cheat-card").forEach(function (card) {
                var h4 = card.querySelector("h4");
                if (!h4) return;
                var p = card.querySelector("p");
                entries.push({ page: path, pageTitle: pageTitle, id: sec.id, title: h4.textContent.trim(), snippet: p ? p.textContent.trim().slice(0, 120) : "" });
              });
            });
            return entries;
          })
          .catch(function () { return []; });
      })
    ).then(function (results) {
      searchIndex = [].concat.apply([], results);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(searchIndex)); } catch (e) {}
      return searchIndex;
    });

    return searchIndexPromise;
  }

  var input = document.getElementById("global-search-input");
  var resultsBox = document.getElementById("global-search-results");

  function renderResults(query) {
    var words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) {
      resultsBox.innerHTML = "";
      resultsBox.classList.remove("open");
      return;
    }
    if (!searchIndex) {
      resultsBox.innerHTML = '<div style="padding:10px 12px;color:var(--text-muted);font-size:12.5px;">Meklē…</div>';
      resultsBox.classList.add("open");
      return;
    }
    var matches = searchIndex.filter(function (entry) {
      var text = (entry.title + " " + entry.snippet + " " + entry.pageTitle).toLowerCase();
      return words.every(function (w) { return text.indexOf(w) !== -1; });
    }).slice(0, 8);

    if (!matches.length) {
      resultsBox.innerHTML = '<div style="padding:10px 12px;color:var(--text-muted);font-size:12.5px;">Nekas netika atrasts.</div>';
      resultsBox.classList.add("open");
      return;
    }
    resultsBox.innerHTML = matches.map(function (m) {
      return '<a href="' + BASE + m.page + '#' + m.id + '"><span class="gns-cat">' + escapeHtml(m.pageTitle) + '</span><br>' + escapeHtml(m.title) + '</a>';
    }).join("");
    resultsBox.classList.add("open");
  }

  if (input) {
    input.addEventListener("focus", function () { buildSearchIndex().then(function () { renderResults(input.value); }); });
    input.addEventListener("input", function () {
      renderResults(input.value);
      buildSearchIndex().then(function () { renderResults(input.value); });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".global-nav-search")) resultsBox.classList.remove("open");
    });
  }
});
