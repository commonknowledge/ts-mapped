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
 *   into the iframe of the map it is for (?mapped_map=<map host>), and
 *   removes both from this page's address bar so the token is not shared by
 *   copying the URL
 *
 * Plain script, no dependencies: it runs on other organisations' sites.
 */
(function () {
  var TOKEN_PARAM = "mapped_access";
  var MAP_PARAM = "mapped_map";
  var PAGE_PARAM = "mapped_page";
  var DEFAULT_HEIGHT = "600px";

  // Read the token, and the host of the map it is for, once and remove them
  // from the address bar
  function takeToken() {
    var url = new URL(window.location.href);
    var token = url.searchParams.get(TOKEN_PARAM);
    var mapHost = url.searchParams.get(MAP_PARAM);
    if (token || mapHost) {
      url.searchParams.delete(TOKEN_PARAM);
      url.searchParams.delete(MAP_PARAM);
      window.history.replaceState(window.history.state, "", url.toString());
    }
    if (!token || !mapHost) {
      return null;
    }
    return { value: token, mapHost: mapHost };
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
      console.error("Mapped embed: invalid data-mapped-map URL", mapUrl, e);
      return;
    }
    src.searchParams.set(PAGE_PARAM, currentPageUrl());
    // A token is for one map: only that map's iframe gets it
    if (token && src.host === token.mapHost) {
      src.searchParams.set(TOKEN_PARAM, token.value);
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
    Array.prototype.forEach.call(containers, function (container) {
      embed(container, token);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
