export interface CategoryTheme {
  key: string;
  name: string;
  colorName: string;
  bgLight: string;
  textLight: string;
  borderLight: string;
  solidLight: string;
  chipClass: string;
  filterChipActiveClass: string;
  iconTileClass: string;
  dotClass: string;
  leftAccentClass: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  os: {
    key: "os",
    name: "Operating Systems",
    colorName: "blue",
    bgLight: "#e4eefc",
    textLight: "#1d4f9f",
    borderLight: "#c6ddf9",
    solidLight: "#1d4f9f",
    chipClass:
      "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#1d4f9f] text-white border-[#1d4f9f] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#e4eefc] text-[#1d4f9f] border-[#c6ddf9] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#1d4f9f] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#1d4f9f] dark:border-l-spy-border",
  },
  "os-lab": {
    key: "os-lab",
    name: "OS Lab",
    colorName: "indigo",
    bgLight: "#e8e6fb",
    textLight: "#4338a8",
    borderLight: "#d1cdf7",
    solidLight: "#4338a8",
    chipClass:
      "bg-[#e8e6fb] text-[#4338a8] border-[#d1cdf7] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#4338a8] text-white border-[#4338a8] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#e8e6fb] text-[#4338a8] border-[#d1cdf7] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#4338a8] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#4338a8] dark:border-l-spy-border",
  },
  eco: {
    key: "eco",
    name: "Economics",
    colorName: "amber",
    bgLight: "#fbefd5",
    textLight: "#9a5b00",
    borderLight: "#f4dcaa",
    solidLight: "#9a5b00",
    chipClass:
      "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#9a5b00] text-white border-[#9a5b00] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#fbefd5] text-[#9a5b00] border-[#f4dcaa] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#9a5b00] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#9a5b00] dark:border-l-spy-border",
  },
  dip: {
    key: "dip",
    name: "Digital Image Processing",
    colorName: "purple",
    bgLight: "#f0e6fa",
    textLight: "#6b2fa0",
    borderLight: "#dfcbf5",
    solidLight: "#6b2fa0",
    chipClass:
      "bg-[#f0e6fa] text-[#6b2fa0] border-[#dfcbf5] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#6b2fa0] text-white border-[#6b2fa0] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#f0e6fa] text-[#6b2fa0] border-[#dfcbf5] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#6b2fa0] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#6b2fa0] dark:border-l-spy-border",
  },
  "p&s": {
    key: "p&s",
    name: "Probability & Statistics",
    colorName: "teal",
    bgLight: "#dff3f1",
    textLight: "#0f6b66",
    borderLight: "#bbe6e1",
    solidLight: "#0f6b66",
    chipClass:
      "bg-[#dff3f1] text-[#0f6b66] border-[#bbe6e1] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#0f6b66] text-white border-[#0f6b66] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#dff3f1] text-[#0f6b66] border-[#bbe6e1] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#0f6b66] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#0f6b66] dark:border-l-spy-border",
  },
  fydp: {
    key: "fydp",
    name: "FYDP",
    colorName: "red-orange",
    bgLight: "#fce8e0",
    textLight: "#b23a12",
    borderLight: "#f8cfc0",
    solidLight: "#b23a12",
    chipClass:
      "bg-[#fce8e0] text-[#b23a12] border-[#f8cfc0] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#b23a12] text-white border-[#b23a12] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#fce8e0] text-[#b23a12] border-[#f8cfc0] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#b23a12] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#b23a12] dark:border-l-spy-border",
  },
  cp: {
    key: "cp",
    name: "Codeforces",
    colorName: "gold",
    bgLight: "#fbf3cc",
    textLight: "#8a6a00",
    borderLight: "#f5e499",
    solidLight: "#8a6a00",
    chipClass:
      "bg-[#fbf3cc] text-[#8a6a00] border-[#f5e499] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#8a6a00] text-white border-[#8a6a00] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#fbf3cc] text-[#8a6a00] border-[#f5e499] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#8a6a00] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#8a6a00] dark:border-l-spy-border",
  },
  cyber: {
    key: "cyber",
    name: "Cybersecurity",
    colorName: "emerald",
    bgLight: "#dcf3e4",
    textLight: "#14663a",
    borderLight: "#b9e7c8",
    solidLight: "#14663a",
    chipClass:
      "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#14663a] text-white border-[#14663a] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#dcf3e4] text-[#14663a] border-[#b9e7c8] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#14663a] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#14663a] dark:border-l-spy-border",
  },
  projects: {
    key: "projects",
    name: "Side Projects",
    colorName: "pink",
    bgLight: "#fbe6ef",
    textLight: "#a3245a",
    borderLight: "#f7cce0",
    solidLight: "#a3245a",
    chipClass:
      "bg-[#fbe6ef] text-[#a3245a] border-[#f7cce0] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#a3245a] text-white border-[#a3245a] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#fbe6ef] text-[#a3245a] border-[#f7cce0] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#a3245a] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#a3245a] dark:border-l-spy-border",
  },
  research: {
    key: "research",
    name: "Research Papers",
    colorName: "sky",
    bgLight: "#e0f1fa",
    textLight: "#17678f",
    borderLight: "#c0e2f5",
    solidLight: "#17678f",
    chipClass:
      "bg-[#e0f1fa] text-[#17678f] border-[#c0e2f5] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#17678f] text-white border-[#17678f] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#e0f1fa] text-[#17678f] border-[#c0e2f5] dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
    dotClass: "bg-[#17678f] dark:bg-spy-muted",
    leftAccentClass: "border-l-[#17678f] dark:border-l-spy-border",
  },
  tuition: {
    key: "tuition",
    name: "Tuition",
    colorName: "orange",
    bgLight: "#fdeadb",
    textLight: "#a8500f",
    borderLight: "#facfb7",
    solidLight: "#a8500f",
    chipClass:
      "bg-[#fdeadb] text-[#a8500f] border-[#facfb7] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
    filterChipActiveClass:
      "bg-[#a8500f] text-white border-[#a8500f] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
    iconTileClass:
      "bg-[#fdeadb] text-[#a8500f] border-[#facfb7] dark:bg-spy-surface dark:text-spy-amber dark:border-spy-border",
    dotClass: "bg-[#a8500f] dark:bg-spy-amber",
    leftAccentClass: "border-l-[#a8500f] dark:border-l-spy-border",
  },
};

const DEFAULT_THEME: CategoryTheme = {
  key: "default",
  name: "General",
  colorName: "neutral",
  bgLight: "#ece6d8",
  textLight: "#1f2421",
  borderLight: "#ddd6c8",
  solidLight: "#1f7a4d",
  chipClass:
    "bg-[#ece6d8] text-[#1f2421] border-[#ddd6c8] dark:bg-spy-chipBg dark:text-spy-chipText dark:border-spy-chipBorder",
  filterChipActiveClass:
    "bg-[#1f7a4d] text-white border-[#1f7a4d] dark:bg-spy-green/10 dark:text-spy-green dark:border-spy-green/40",
  iconTileClass:
    "bg-spy-surface2 text-spy-text border-spy-border dark:bg-spy-surface dark:text-spy-muted dark:border-spy-border",
  dotClass: "bg-spy-muted dark:bg-spy-dim",
  leftAccentClass: "border-l-spy-borderLight dark:border-l-spy-border",
};

/**
 * Resolves a category theme by id, name, codename, or search string
 */
export function getCategoryTheme(identifier?: string | null): CategoryTheme {
  if (!identifier) return DEFAULT_THEME;
  const q = identifier.toLowerCase().trim();

  // OS Lab check first before general OS
  if (q.includes("os lab") || q.includes("cat-os-lab")) {
    return CATEGORY_THEMES["os-lab"];
  }
  if (
    q === "os" ||
    q.includes("operating") ||
    q.includes("cat-os")
  ) {
    return CATEGORY_THEMES["os"];
  }
  if (
    q === "eco" ||
    q.includes("econ") ||
    q.includes("cat-econ")
  ) {
    return CATEGORY_THEMES["eco"];
  }
  if (
    q === "dip" ||
    q.includes("image") ||
    q.includes("cat-dip")
  ) {
    return CATEGORY_THEMES["dip"];
  }
  if (
    q === "p&s" ||
    q.includes("prob") ||
    q.includes("stat") ||
    q.includes("cat-stat")
  ) {
    return CATEGORY_THEMES["p&s"];
  }
  if (
    q === "fydp" ||
    q.includes("fydp") ||
    q.includes("cat-fydp")
  ) {
    return CATEGORY_THEMES["fydp"];
  }
  if (
    q === "cp" ||
    q.includes("codeforces") ||
    q.includes("cf") ||
    q.includes("cat-cf")
  ) {
    return CATEGORY_THEMES["cp"];
  }
  if (
    q === "cyber" ||
    q.includes("cyber") ||
    q.includes("cat-cyber")
  ) {
    return CATEGORY_THEMES["cyber"];
  }
  if (
    q === "projects" ||
    q.includes("side") ||
    q.includes("project") ||
    q.includes("cat-side")
  ) {
    return CATEGORY_THEMES["projects"];
  }
  if (
    q === "research" ||
    q.includes("paper") ||
    q.includes("cat-research")
  ) {
    return CATEGORY_THEMES["research"];
  }
  if (
    q === "tuition" ||
    q.includes("tuition") ||
    q.includes("cat-tuition")
  ) {
    return CATEGORY_THEMES["tuition"];
  }

  return DEFAULT_THEME;
}

