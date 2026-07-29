// Crossfade between the profile photos in a #hero-avatar block.
// Shared by the landing page and /about so both behave identically.
const INTERVAL = 5000;

export function initAvatar(): void {
  const wrap = document.getElementById("hero-avatar");
  if (!wrap || wrap.dataset.bound) return;
  wrap.dataset.bound = "1";

  const faces = Array.from(wrap.querySelectorAll<HTMLElement>(".avatar-face"));
  if (faces.length < 2) return;

  let i = 0;
  const show = (next: number) => {
    faces[i].style.opacity = "0";
    i = next % faces.length;
    faces[i].style.opacity = "1";
  };

  // hovering flips to the next photo immediately
  wrap.addEventListener("mouseenter", () => show(i + 1));

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  setInterval(() => show(i + 1), INTERVAL);
}
