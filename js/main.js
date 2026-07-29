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

  // live filter for category cards
  var search = document.getElementById("category-search");
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".card").forEach(function (card) {
        var text = card.innerText.toLowerCase();
        card.style.display = text.indexOf(q) !== -1 ? "" : "none";
      });
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
  // collapsible integration name, e.g. pages/integracijas.html) —
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
  // observes whatever element each sidebar link actually points to —
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

    // instant feedback on click — don't wait for the scroll/observer to
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
      // observed section (e.g. CPT sub-topics inside the CPT section) —
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

  // mobile "jump to section" dropdown — the real sidebar is hidden below
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
});
