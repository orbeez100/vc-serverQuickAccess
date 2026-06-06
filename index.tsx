import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Adds server shortcuts to your header toolbar bar via settings menu config.",
    authors: [{ name: "Orbeez", id: 0n }],

    settings: {
        pinnedServers: {
            description: "Server IDs separated by commas",
            type: "string",
            default: ""
        }
    },

    patches: [],

    start() {
        console.log("ServerQuickAccess plugin started successfully!");
    },

    stop() {
        console.log("ServerQuickAccess plugin stopped!");
    }
});
