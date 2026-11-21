import { ZH_APP } from "./app";
import { ZH_EDITOR } from "./editor";
import { ZH_PALETTE } from "./palette";
import { ZH_SCREENS } from "./screens";
import { ZH_AUTOMATION } from "./automation";

/** English text -> Simplified Chinese. One file per area so they can be edited independently. */
export const ZH: Record<string, string> = { ...ZH_APP, ...ZH_EDITOR, ...ZH_PALETTE, ...ZH_SCREENS, ...ZH_AUTOMATION };
