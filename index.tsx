import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

// Access Vencord's built-in managed settings state
const getPinnedList = (plugin: any) => {
    const raw = plugin.settings?.pinnedServers;
    if (!raw) return [];
    if (typeof raw === "string") {
        return raw.split(",").map((id: string) => id.trim()).filter(Boolean);
    }
    return Array.isArray(raw) ? raw : [];
};

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Adds instant server shortcuts to the top right header bar. Manage your pinned IDs inside the plugin settings panel!",
    authors: [{ name: "Orbeez", id: 0n }],

    // Use standard, safe native settings inputs that won't break client initialization
    settings: {
        pinnedServers: {
            description: "Enter Server IDs separated by commas (e.g. 123456789, 987654321)",
            type: "string",
            default: ""
        }
    } as any,

    patches: [
        {
            find: "HeaderBarContainer",
            replacement: {
                match: /(return\s+.*?\.jsxs\)\()(.*?,\{.*?toolbar:)/,
                replace: `$1$2 children: [/* @__PURE__ */ React.createElement(QuickAccessBar, null)], `
            }
        }
    ],

    start() {
        const self = (window as any).VencordPlugins?.ServerQuickAccess;

        (window as any).QuickAccessBar = () => {
            // Read directly from state dynamically during layout rendering
            const pinnedIds = getPinnedList(self);
            if (pinnedIds.length === 0) return null;

            return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px" }}>
                    {pinnedIds.map((id: string) => {
                        const guild = GuildStore?.getGuild(id);
                        if (!guild) return null;

                        const iconUrl = guild.getIconURL?.() || `https://ui-avatars.com/api/?name=${encodeURIComponent(guild.name)}&background=36393f&color=fff`;

                        return (
                            <div
                                key={id}
                                title={guild.name}
                                onClick={() => NavigationUtils?.selectGuild(id)}
                                style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    border: "1px solid var(--border-transparent)",
                                    transition: "transform 0.15s ease-in-out, border-radius 0.15s ease-in-out"
                                }}
                                onMouseEnter={(e: any) => {
                                    e.currentTarget.style.transform = "scale(1.15)";
                                    e.currentTarget.style.borderRadius = "35%";
                                }}
                                onMouseLeave={(e: any) => {
                                    e.currentTarget.style.transform = "scale(1.0)";
                                    e.currentTarget.style.borderRadius = "50%";
                                }}
                            >
                                <img src={iconUrl} alt={guild.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                        );
                    })}
                    <div style={{ width: "1px", height: "16px", backgroundColor: "var(--background-modifier-accent)", margin: "0 4px" }} />
                </div>
            );
        };
    },

    stop() {
        if ((window as any).QuickAccessBar) delete (window as any).QuickAccessBar;
    }
});
