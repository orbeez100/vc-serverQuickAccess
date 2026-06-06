import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

// Safe module lookups using the runtime window object to avoid compiler dependency errors
const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

// Access Vencord's internal Settings manager directly through the runtime wrapper
const VencordSettings = (window as any).VencordPlugins?.ServerQuickAccess?.settings || { pinnedServers: [] };

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Right-click any server icon to pin it directly to the top right header bar.",
    authors: [{ name: "Orbeez", id: 0n }],
    
    // Define the setting fields natively within the plugin declaration configuration
    settings: {
        pinnedServers: {
            description: "Array of pinned server IDs",
            type: "array",
            default: []
        }
     as any},

    patches: [
        {
            find: "HeaderBarContainer",
            replacement: {
                match: /(return\s+.*?\.jsxs\)\()(.*?,\{.*?toolbar:)/,
                replace: `$1$2 children: [/* @__PURE__ */ React.createElement(QuickAccessBar, null)], `
            }
        },
        {
            find: "GuildContextMenu",
            replacement: {
                match: /(return\s+.*?\.jsx\()(.*?.ContextMenu.*?children:\[)/,
                replace: `$1$2React.createElement(PinContextMenuItem, { guildId: props.guild?.id || props.guildId }),`
            }
        }
    ],

    start() {
        // Initialize an empty array fallback if the settings haven't been created yet
        if (!VencordSettings.pinnedServers) {
            VencordSettings.pinnedServers = [];
        }

        (window as any).QuickAccessBar = () => {
            const [pinned, setPinned] = React.useState(VencordSettings.pinnedServers);

            React.useEffect(() => {
                const listener = () => setPinned([...VencordSettings.pinnedServers]);
                window.addEventListener("vc-server-pin-update", listener);
                return () => window.removeEventListener("vc-server-pin-update", listener);
            }, []);

            if (!pinned || pinned.length === 0) return null;

            return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px" }}>
                    {pinned.map((id: string) => {
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

        (window as any).PinContextMenuItem = ({ guildId }: { guildId: string }) => {
            if (!guildId) return null;
            const isPinned = VencordSettings.pinnedServers.includes(guildId);

            const handleTogglePin = () => {
                if (isPinned) {
                    VencordSettings.pinnedServers = VencordSettings.pinnedServers.filter((id: string) => id !== guildId);
                } else {
                    VencordSettings.pinnedServers = [...VencordSettings.pinnedServers, guildId];
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
