import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Adds quick server shortcuts to your header bar via settings menu.",
    authors: [{ name: "Orbeez", id: 0n }],

    settings: {
        pinnedServers: {
            description: "Server IDs separated by commas",
            type: "string",
            default: ""
        }
    } as any,

    patches: [
        {
            find: "HeaderBarContainer",
            replacement: {
                match: /(return\s+.*?\.jsxs\)\()(.*?,\{.*?toolbar:)/,
                replace: `$1$2 children: [/* @__PURE__ */ React.createElement(() => {
                    const raw = (window as any).VencordPlugins?.ServerQuickAccess?.settings?.pinnedServers || "";
                    const pinnedIds = raw.split(",").map((id: string) => id.trim()).filter(Boolean);
                    if (pinnedIds.length === 0) return null;

                    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginRight: "12px" } },
                        pinnedIds.map((id: string) => {
                            const guild = GuildStore?.getGuild(id);
                            if (!guild) return null;
                            const iconUrl = guild.getIconURL?.() || "https://ui-avatars.com/api/?name=" + encodeURIComponent(guild.name);

                            return React.createElement("div", {
                                key: id,
                                title: guild.name,
                                onClick: () => NavigationUtils?.selectGuild(id),
                                style: { width: "26px", height: "26px", borderRadius: "50%", overflow: "hidden", cursor: "pointer" }
                            }, React.createElement("img", { src: iconUrl, style: { width: "100%", height: "100%", objectFit: "cover" } }));
                        })
                    );
                }, null)], `
            }
        }
    ],

    start() {},
    stop() {}
});
