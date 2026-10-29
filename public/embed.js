/**
 * Mapped public map embed.
 *
 * Usage, on the page that embeds the map:
 *
 *   <div data-mapped-map="https://my-map.mapped.tools" style="height: 600px"></div>
 *   <script src="https://mapped.tools/embed.js" async></script>
 *
 * Replaces each element with an iframe of the map. For maps where access is
 * by request, it also:
 * - tells the map which page it is on (an iframe cannot read its parent's
 *   URL), so access links can bring visitors back to this page
 * - forwards the access token from an emailed link (?mapped_access=...)
 *   into the iframe, and removes it from this page's address bar so it is
 *   not shared by copying the URL
 *
 * Plain script, no dependencies: it runs on other organisations' sites.
 */
(function () {
  var TOKEN_PARAM = "mapped_access";
  var PAGE_PARAM = "mapped_page";
  var DEFAULT_HEIGHT = "600px";

  // Read the token once and remove it from the address bar
  function takeToken() {
    var url = new URL(window.location.href);
    var token = url.searchParams.get(TOKEN_PARAM);
    if (token) {
      url.searchParams.delete(TOKEN_PARAM);
      window.history.replaceState(window.history.state, "", url.toString());
    }
    return token;
  }

  function currentPageUrl() {
    var url = new URL(window.location.href);
    url.hash = "";
    return url.toString();
  }

  function embed(container, token) {
    var mapUrl = container.getAttribute("data-mapped-map");
    var src;
    try {
      src = new URL(mapUrl);
    } catch (e) {
      console.error("Mapped embed: invalid data-mapped-map URL", mapUrl);
      return;
    }
    src.searchParams.set(PAGE_PARAM, currentPageUrl());
    if (token) {
      src.searchParams.set(TOKEN_PARAM, token);
    }

    var iframe = document.createElement("iframe");
    iframe.src = src.toString();
    iframe.title = container.getAttribute("data-mapped-title") || "Map";
    iframe.allow = "geolocation; fullscreen";
    iframe.style.border = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.display = "block";

    if (!container.style.height && container.clientHeight === 0) {
      container.style.height = DEFAULT_HEIGHT;
    }
    container.setAttribute("data-mapped-embedded", "true");
    container.appendChild(iframe);
  }

  function run() {
    var token = takeToken();
    var containers = document.querySelectorAll(
      "[data-mapped-map]:not([data-mapped-embedded])",
    );
    for (var i = 0; i < containers.length; i++) {
      embed(containers[i], token);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
