import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { PluginSettings } from "@modules/settings";
import React from "react";

// Get Discord modules via global Vencord tracking to stay safe from compiler errors
const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

// Setup default settings storage for pinned servers
const settings = PluginSettings.get("ServerQuickAccess", {
    pinnedServers: [] as string[] // Stores array of Guild IDs
});

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Right-click any server icon to pin it directly to the top right header bar.",
    authors: [{ name: "Orbeez", id: 0n }],

    patches: [
        {
            // Patch 1: Inject our custom shortcut bar into the top header toolbar
            find: "HeaderBarContainer",
            replacement: {
                match: /(return\s+.*?\.jsxs\)\()(.*?,\{.*?toolbar:)/,
                replace: `$1$2 children: [/* @__PURE__ */ React.createElement(QuickAccessBar, null)], `
            }
        },
        {
            // Patch 2: Intercept Discord's Server Right-Click Context Menu
            find: "GuildContextMenu",
            replacement: {
                match: /(return\s+.*?\.jsx\()(.*?.ContextMenu.*?children:\[)/,
                replace: `$1$2React.createElement(PinContextMenuItem, { guildId: props.guild?.id || props.guildId }),`
            }
        }
    ],

    start() {
        // Component for the Top Right Bar
        (window as any).QuickAccessBar = () => {
            const [pinned, setPinned] = React.useState(settings.pinnedServers);

            // Keep the top bar in sync when changes happen
            React.useEffect(() => {
                const listener = () => setPinned([...settings.pinnedServers]);
                window.addEventListener("vc-server-pin-update", listener);
                return () => window.removeEventListener("vc-server-pin-update", listener);
            }, []);

            if (!pinned || pinned.length === 0) return null;

            return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px" }}>
                    {pinned.map(id => {
                        const guild = GuildStore?.getGuild(id);
                        if (!guild) return null;
                        
                        // Get the real server icon URL or fallback to initials if no icon
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
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.15)";
                                    e.currentTarget.style.borderRadius = "35%";
                                }}
                                onMouseLeave={(e) => {
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

        // Component for the "Pin Server" Option inside Right-Click Menus
        (window as any).PinContextMenuItem = ({ guildId }: { guildId: string }) => {
            if (!guildId) return null;
            const isPinned = settings.pinnedServers.includes(guildId);

            const handleTogglePin = () => {
                if (isPinned) {
                    settings.pinnedServers = settings.pinnedServers.filter((id: string) => id !== guildId);
                } else {
                    settings.pinnedServers = [...settings.pinnedServers, guildId];
                }
                window.dispatchEvent(new Event("vc-server-pin-update"));
            };

            const MenuItem = (window as any).Vencord?.Webpack?.findByProps("MenuRadioItem", "MenuItem")?.MenuItem;
            if (!MenuItem) return null;

            return React.createElement(MenuItem, {
                id: "quick-access-pin",
                label: isPinned ? "Unpin from Top Bar" : "Pin to Top Bar",
                action: handleTogglePin
            });
        };
    },

    stop() {
        if ((window as any).QuickAccessBar) delete (window as any).QuickAccessBar;
        if ((window as any).PinContextMenuItem) delete (window as any).PinContextMenuItem;
    }
});
