document.addEventListener("DOMContentLoaded", function () {
  // subtle spotlight cursor effect on cards
  document.querySelectorAll(".card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      card.style.setProperty("--my", (e.clientY - rect.top) + "px");
    });
    card.addEventListener("click", function () {
      var href = card.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  });

  // live filter for category cards - matches per WORD (order-independent),
  // not just one literal phrase, so "wordpress cache" also finds a card
  // whose text has those words in the opposite order or split apart
  var search = document.getElementById("category-search");
  var resultsBox = document.getElementById("search-results");

  // site-wide section index - built lazily by fetching + parsing each page's
  // own HTML, so results always match real content without a separate index
  // file to keep in sync manually. Cached in sessionStorage per cache-bust version.
  var SEARCH_PAGES = [
    "pages/api.html", "pages/css-advanced.html", "pages/datubazes.html",
    "pages/drosiba.html", "pages/gdpr.html", "pages/git.html",
    "pages/integracijas.html", "pages/javascript.html", "pages/php.html",
    "pages/sagataves.html", "pages/seo.html", "pages/ssh.html",
    "pages/web-izveide.html", "pages/web-problemas.html",
    "pages/wordpress-problemas.html", "pages/wordpress-snippets.html",
    "pages/wordpress.html", "pages/python-riki.html", "pages/riki.html"
  ];
  var SEARCH_INDEX_VERSION = "30"; // bump together with the ?v= cache-bust number
  var searchIndex = null;
  var searchIndexPromise = null;

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

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
        return fetch(path)
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
              entries.push({
                page: path,
                pageTitle: pageTitle,
                id: sec.id,
                title: h2.textContent.trim(),
                snippet: p ? p.textContent.trim().slice(0, 140) : ""
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

  function renderSearchResults(query) {
    if (!resultsBox) return;
    var words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      resultsBox.innerHTML = "";
      resultsBox.classList.remove("open");
      return;
    }
    if (!searchIndex) {
      resultsBox.innerHTML = '<div class="search-loading">Meklē…</div>';
      resultsBox.classList.add("open");
      return;
    }
    var matches = searchIndex.filter(function (entry) {
      var text = (entry.title + " " + entry.snippet + " " + entry.pageTitle).toLowerCase();
      return words.every(function (w) { return text.indexOf(w) !== -1; });
    }).slice(0, 8);

    if (matches.length === 0) {
      resultsBox.innerHTML = '<div class="search-no-results">Sadaļās nekas netika atrasts - mēģini citu vārdu.</div>';
      resultsBox.classList.add("open");
      return;
    }

    resultsBox.innerHTML = matches.map(function (m) {
      return '<a href="' + m.page + '#' + m.id + '">' +
        '<div class="result-page">' + escapeHtml(m.pageTitle) + '</div>' +
        '<div class="result-title">' + escapeHtml(m.title) + '</div>' +
        (m.snippet ? '<div class="result-snippet">' + escapeHtml(m.snippet) + '…</div>' : '') +
        '</a>';
    }).join("");
    resultsBox.classList.add("open");
  }

  if (search) {
    search.addEventListener("input", function () {
      var words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      document.querySelectorAll(".card").forEach(function (card) {
        var text = card.innerText.toLowerCase();
        var matches = words.every(function (w) {
          return text.indexOf(w) !== -1;
        });
        card.style.display = matches ? "" : "none";
      });

      renderSearchResults(search.value);
      if (words.length > 0) {
        buildSearchIndex().then(function () { renderSearchResults(search.value); });
      }
    });

    search.addEventListener("focus", function () {
      buildSearchIndex(); // warm the index early so results are instant once typed
      if (search.value.trim()) renderSearchResults(search.value);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && resultsBox) resultsBox.classList.remove("open");
    });

    document.addEventListener("click", function (e) {
      if (resultsBox && !search.contains(e.target) && !resultsBox.contains(e.target)) {
        resultsBox.classList.remove("open");
      }
    });
  }

  // keyboard shortcut: "/" focuses search
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      var s = document.getElementById("category-search");
      if (s) {
        e.preventDefault();
        s.focus();
      }
    }
  });

  // accordion sidebar (used on pages that group many sections under a
  // collapsible integration name, e.g. pages/integracijas.html) -
  // clicking a header opens its body and closes any other open one
  document.querySelectorAll(".doc-accordion-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.closest(".doc-sidebar-accordion");
      if (!group) return;
      var wasOpen = group.classList.contains("open");
      var parent = group.parentElement;
      if (parent) {
        parent.querySelectorAll(".doc-sidebar-accordion.open").forEach(function (g) {
          if (g !== group) g.classList.remove("open");
        });
      }
      group.classList.toggle("open", !wasOpen);
    });
  });

  // sidebar active link highlighting on scroll (doc pages)
  // observes whatever element each sidebar link actually points to -
  // a full .doc-section OR just a heading anchor nested inside one
  // (covers both flat .doc-sidebar-group lists and accordion bodies)
  var links = document.querySelectorAll(".doc-sidebar a[href^='#']");
  var sections = [];
  links.forEach(function (l) {
    var target = document.getElementById(l.getAttribute("href").slice(1));
    if (target && sections.indexOf(target) === -1) sections.push(target);
  });
  if (sections.length && links.length) {
    var visible = new Set();

    function openAncestorAccordion(link) {
      var group = link.closest(".doc-sidebar-accordion");
      if (!group) return;
      var parent = group.parentElement;
      if (parent) {
        parent.querySelectorAll(".doc-sidebar-accordion.open").forEach(function (g) {
          if (g !== group) g.classList.remove("open");
        });
      }
      group.classList.add("open");
    }

    // instant feedback on click - don't wait for the scroll/observer to
    // settle, since a clicked heading can briefly land outside the
    // tracked band while the page is still scrolling to it
    links.forEach(function (l) {
      l.addEventListener("click", function () {
        links.forEach(function (o) { o.classList.remove("active"); });
        l.classList.add("active");
      });
    });

    function updateActiveLink() {
      // some sidebar links point to a heading nested INSIDE another
      // observed section (e.g. CPT sub-topics inside the CPT section) -
      // when both are visible at once, prefer the more specific (nested) one
      var candidates = Array.from(visible)
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);
      candidates = candidates.filter(function (el) {
        return !candidates.some(function (other) { return other !== el && el.contains(other); });
      });
      if (!candidates.length) return;
      candidates.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
      var bestId = candidates[0].id;
      links.forEach(function (l) { l.classList.remove("active"); });
      var active = document.querySelector('.doc-sidebar a[href="#' + bestId + '"]');
      if (active) {
        active.classList.add("active");
        openAncestorAccordion(active);
      }
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        updateActiveLink();
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  // mobile "jump to section" dropdown - the real sidebar is hidden below
  // 980px (see CSS), so build a native <select> from the same links
  // instead of leaving mobile readers to scroll through the whole page
  var jumpSidebar = document.querySelector(".doc-sidebar");
  var jumpMain = document.querySelector(".doc-main");
  if (jumpSidebar && jumpMain) {
    var jumpLinks = jumpSidebar.querySelectorAll("a[href^='#']");
    if (jumpLinks.length) {
      var select = document.createElement("select");
      select.className = "mobile-section-jump";
      select.setAttribute("aria-label", "Lēkt uz sadaļu");

      var placeholder = document.createElement("option");
      placeholder.textContent = "📑 Lēkt uz sadaļu...";
      placeholder.setAttribute("selected", "");
      placeholder.setAttribute("disabled", "");
      select.appendChild(placeholder);

      var jumpGroups = jumpSidebar.querySelectorAll(".doc-sidebar-group, .doc-sidebar-accordion");
      jumpGroups.forEach(function (group) {
        var groupLinks = group.querySelectorAll("a[href^='#']");
        if (!groupLinks.length) return;
        var heading = group.querySelector("h4, .doc-accordion-toggle span");
        var optgroup = document.createElement("optgroup");
        optgroup.label = heading ? heading.textContent.trim() : "";
        groupLinks.forEach(function (a) {
          var opt = document.createElement("option");
          opt.value = a.getAttribute("href");
          opt.textContent = a.textContent.trim();
          optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
      });

      select.addEventListener("change", function () {
        var target = document.querySelector(select.value);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", select.value);
        }
        select.value = "";
      });

      jumpMain.insertBefore(select, jumpMain.firstChild);
    }
  }

  // copy-to-clipboard button on every code block - re-parents the existing
  // .lang badge into a shared toolbar alongside a new copy button, so no
  // HTML file needs to change, only this script + the matching CSS
  document.querySelectorAll("pre.code-block").forEach(function (block) {
    var codeEl = block.querySelector("code");
    if (!codeEl) return;

    var toolbar = document.createElement("div");
    toolbar.className = "code-block-toolbar";

    var langEl = block.querySelector(".lang");
    if (langEl) toolbar.appendChild(langEl);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy-btn";
    btn.setAttribute("aria-label", "Kopēt kodu");
    btn.innerHTML =
      '<svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>' +
      '<svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

    function showCopied() {
      btn.classList.add("copied");
      setTimeout(function () { btn.classList.remove("copied"); }, 1500);
    }

    function fallbackCopy(text) {
      // older/more permissive method for browsers or contexts (e.g. non-HTTPS,
      // restrictive permission policies) where navigator.clipboard is blocked
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        if (document.execCommand("copy")) showCopied();
      } catch (err) {
        console.error("Kopēšana neizdevās:", err);
      }
      document.body.removeChild(textarea);
    }

    btn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeEl.textContent).then(showCopied, function () {
          fallbackCopy(codeEl.textContent);
        });
      } else {
        fallbackCopy(codeEl.textContent);
      }
    });

    toolbar.appendChild(btn);
    block.insertBefore(toolbar, block.firstChild);
  });
});
