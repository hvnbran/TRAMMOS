import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";

const fraunces = loadFraunces("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin"] });
const interTight = loadInterTight("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

// Editorial serif for hero display (Fraunces has an optical-size axis for that Apple/Rimowa feel)
export const FONT_DISPLAY = fraunces.fontFamily;
// UI labels / chips — tight geometric
export const FONT_UI = interTight.fontFamily;
// Body text
export const FONT_BODY = inter.fontFamily;
