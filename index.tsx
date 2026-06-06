import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

const getPinnedList = (plugin: any) => {
    const raw = plugin?.settings?.pinnedServers;
    if (!raw) return [];
    return raw.split(",").map((id: string) => id.trim()).filter(Boolean);
};

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Adds server shortcuts next to search bar safely. Manage server IDs inside plugin settings!",
    authors: [{ name: "Orbeez", id: 0n }],

    settings: {
        pinnedServers: {
            description: "Enter Server IDs separated by commas (e.g. 123456789, 987654321)",
            type: "string",
            default: ""
        }
    } as any,

    // Completely empty to prevent pitch-black screen layout rendering crashes
    patches: [],

    start() {
        const self = (window as any).VencordPlugins?.ServerQuickAccess;

        // Custom element rendering tracking
        const renderQuickAccess = () => {
            // Find the search/toolbar container element directly in the actual DOM tree
            const toolbar = document.querySelector('[class*="toolbar_"]');
            if (!toolbar || document.getElementById("vc-quick-access-container")) return;

            const container = document.createElement("div");
            container.id = "vc-quick-access-container";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.gap = "8px";
            container.style.marginRight = "12px";

            // Safe fallback container mounting
            toolbar.insertBefore(container, toolbar.firstChild);

            const pinnedIds = getPinnedList(self);
            if (pinnedIds.length === 0) return;

            // Generate the inner nodes safely using vanilla elements to avoid version mismatches
            pinnedIds.forEach((id: string) => {
                const guild = GuildStore?.getGuild(id);
                if (!guild) return;

                const iconUrl = guild.getIconURL?.() || `https://ui-avatars.com/api/?name=${encodeURIComponent(guild.name)}&background=36393f&color=fff`;

                const btn = document.createElement("div");
                btn.title = guild.name;
                btn.style.width = "26px";
                btn.style.height = "26px";
                btn.style.borderRadius = "50%";
                btn.style.overflow = "hidden";
                btn.style.cursor = "pointer";
                btn.style.transition = "transform 0.15s ease-in-out, border-radius 0.15s ease-in-out";

                btn.onmouseenter = () => {
                    btn.style.transform = "scale(1.15)";
                    btn.style.borderRadius = "35%";
                };
                btn.onmouseleave = () => {
                    btn.style.transform = "scale(1.0)";
                    btn.style.borderRadius = "50%";
                };
                btn.onclick = () => NavigationUtils?.selectGuild(id);

                const img = document.createElement("img");
                img.src = iconUrl;
                img.alt = guild.name;
                img.style.width = "100__PERCENT__";
                img.style.height = "100__PERCENT__";
                img.style.objectFit = "cover";

                btn.appendChild(img);
                container.appendChild(btn);
            });

            // Add a clean visual separator line
            const separator = document.createElement("div");
            separator.style.width = "1px";
            separator.style.height = "16px";
            separator.style.backgroundColor = "var(--background-modifier-accent)";
            separator.style.margin = "0 4px";
            container.appendChild(separator);
        };

        // Mutation Observer to inject components safely when switching channels/servers
        const observer = new MutationObserver(() => renderQuickAccess());
        observer.observe(document.body, { childList: true, subtree: true });
        (window as any).vcQuickAccessObserver = observer;

        // Run initial lookups
        renderQuickAccess();
    },

    stop() {
        const observer = (window as any).vcQuickAccessObserver;
        if (observer) {
            observer.disconnect();
            delete (window as any).vcQuickAccessObserver;
        }
        document.getElementById("vc-quick-access-container")?.remove();
    }
});
