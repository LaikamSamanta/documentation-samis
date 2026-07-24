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

  // sidebar active link highlighting on scroll (doc pages)
  // observes whatever element each sidebar link actually points to —
  // a full .doc-section OR just a heading anchor nested inside one
  var links = document.querySelectorAll(".doc-sidebar-group a[href^='#']");
  var sections = [];
  links.forEach(function (l) {
    var target = document.getElementById(l.getAttribute("href").slice(1));
    if (target && sections.indexOf(target) === -1) sections.push(target);
  });
  if (sections.length && links.length) {
    var visible = new Set();

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
      var active = document.querySelector('.doc-sidebar-group a[href="#' + bestId + '"]');
      if (active) active.classList.add("active");
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
});
