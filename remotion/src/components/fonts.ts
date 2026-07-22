import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

const inter = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const space = loadSpaceGrotesk("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });

export const FONT_BODY = inter.fontFamily;
export const FONT_DISPLAY = space.fontFamily;
