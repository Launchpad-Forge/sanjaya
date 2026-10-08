export const hero = {
  layout: "center",            // "center" | "left" | "right"
  video: {
    mp4: "/media/sanjaya-hero.mp4",
    mp4Mobile: "/media/sanjaya-hero.mp4", // Or a smaller version if we had one
    webm: null,
    poster: "/media/hero-poster.jpg",
    background: "#202312",     // MUST equal the video's own background so the edges disappear
    aspect: "16/9",            // "16/9" landscape map render, or "9/19.5" phone screen recording
  },
};
