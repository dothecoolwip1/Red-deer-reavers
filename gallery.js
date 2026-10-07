import PhotoSwipeLightbox from "./vendor/photoswipe/photoswipe-lightbox.esm.js";

const grid = document.querySelector("[data-gallery-grid]");
const safeSrc = src => (/^assets\/(generated\/gallery|social)\/[\w.-]+\.webp$/.test(String(src || "")) ? src : "");
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

async function loadJson(url, cache) {
  try {
    const response = await fetch(url, { cache });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

if (grid) {
  try {
    const [curated, social] = await Promise.all([
      loadJson("assets/generated/gallery/manifest.json", "force-cache"),
      loadJson("assets/social/feed.json", "no-cache")
    ]);
    if (!Array.isArray(curated)) throw new Error("Gallery manifest request failed");

    // Newest photos from Instagram and Facebook first, then the curated team gallery.
    const fromSocial = (social?.posts || []).flatMap(post => (post.images || []).map(img => ({
      alt: img.alt || "Red Deer Reavers photo from social media",
      sizes: [360, 720, 1200].map(w => img.sizes?.[w]).filter(Boolean),
      eager: false
    }))).slice(0, 48);
    const fromCurated = curated.map(item => ({
      alt: item.alt,
      sizes: [360, 720, 1200, 1600].map(w => item.derivatives?.[String(w)] || item.derivatives?.[w]).filter(Boolean),
      eager: item.index <= 2
    }));

    grid.innerHTML = [...fromSocial, ...fromCurated].map((item, i) => {
      const sizes = item.sizes.filter(s => safeSrc(s.src));
      if (!sizes.length) return "";
      const thumb = sizes.find(s => s.width >= 700) || sizes[sizes.length - 1];
      const large = sizes[sizes.length - 1];
      const srcset = sizes.map(s => `${s.src} ${s.width}w`).join(", ");
      return `<a class="gallery-button" href="${large.src}" data-pswp-width="${large.width}" data-pswp-height="${large.height}" data-pswp-srcset="${srcset}" target="_blank" aria-label="Open ${escapeHtml(item.alt)}">
        <img src="${thumb.src}" srcset="${srcset}" sizes="(max-width: 759px) 50vw, 25vw" width="${thumb.width}" height="${thumb.height}" alt="${escapeHtml(item.alt)}" loading="${item.eager || i < 2 ? "eager" : "lazy"}" decoding="async">
      </a>`;
    }).join("");

    const lightbox = new PhotoSwipeLightbox({
      gallery: grid,
      children: "a",
      pswpModule: () => import("./vendor/photoswipe/photoswipe.esm.js"),
      wheelToZoom: true,
      bgOpacity: 0.96,
      showHideAnimationType: "zoom"
    });
    lightbox.init();
  } catch (error) {
    console.error("Enhanced gallery failed to load.", error);
    grid.innerHTML = '<div class="plate empty"><strong>Gallery unavailable</strong><p>Please refresh the page or try again shortly.</p></div>';
  }
}
