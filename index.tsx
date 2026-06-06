import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

const NavigationUtils = (window as any).Vencord?.Webpack?.findByProps("transitionTo", "selectGuild");
const GuildStore = (window as any).Vencord?.Webpack?.findByProps("getGuild", "getGuilds");

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Adds fast server shortcuts to your layout via the plugin settings page configuration.",
    authors: [{ name: "Orbeez", id: 0n }],

    settings: {
        pinnedServers: {
            description: "Server IDs separated by commas (e.g., 1234567, 89101112)",
            type: "string",
            default: ""
        }
    } as any,

    // ZERO file modifications to completely eliminate the pitch-black app loading crashes
    patches: [],

    start() {
        // Safe asynchronous injection interval helper
        const injectInterval = setInterval(() => {
            // Find Discord's top right toolbar elements completely safely through the native DOM
            const toolbar = document.querySelector('[class*="toolbar_"]');
            if (!toolbar || document.getElementById("vc-quick-access-container")) return;

            const container = document.createElement("div");
            container.id = "vc-quick-access-container";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.gap = "8px";
            container.style.marginRight = "12px";

            // Safely place it before the search icon container
            toolbar.insertBefore(container, toolbar.firstChild);

            const pluginData = (window as any).VencordPlugins?.ServerQuickAccess?.settings?.pinnedServers || "";
            const pinnedIds = pluginData.split(",").map((id: string) => id.trim()).filter(Boolean);
            if (pinnedIds.length === 0) return;

            pinnedIds.forEach((id: string) => {
                const guild = GuildStore?.getGuild(id);
                if (!guild) return;

                const iconUrl = guild.getIconURL?.() || `https://ui-avatars.com/api/?name=${encodeURIComponent(guild.name)}&background=36393f&color=fff`;

                const shortcutButton = document.createElement("div");
                shortcutButton.title = guild.name;
                shortcutButton.style.width = "26px";
                shortcutButton.style.height = "26px";
                shortcutButton.style.borderRadius = "50%";
                shortcutButton.style.overflow = "hidden";
                shortcutButton.style.cursor = "pointer";
                shortcutButton.style.transition = "transform 0.15s ease-in-out, border-radius 0.15s ease-in-out";

                shortcutButton.onmouseenter = () => {
                    shortcutButton.style.transform = "scale(1.15)";
                    shortcutButton.style.borderRadius = "35%";
                };
                shortcutButton.onmouseleave = () => {
                    shortcutButton.style.transform = "scale(1.0)";
                    shortcutButton.style.borderRadius = "50%";
                };
                shortcutButton.onclick = () => NavigationUtils?.selectGuild(id);

                const elementImage = document.createElement("img");
                elementImage.src = iconUrl;
                elementImage.alt = guild.name;
                elementImage.style.width = "100%";
                elementImage.style.height = "100%";
                elementImage.style.objectFit = "cover";

                shortcutButton.appendChild(elementImage);
                container.appendChild(shortcutButton);
            });

            const barSeparator = document.createElement("div");
            barSeparator.style.width = "1px";
            barSeparator.style.height = "16px";
            barSeparator.style.backgroundColor = "var(--background-modifier-accent)";
            barSeparator.style.margin = "0 4px";
            container.appendChild(barSeparator);
        }, 1500);

        (window as any).vcQuickAccessTimer = injectInterval;
    },

    stop() {
        if ((window as any).vcQuickAccessTimer) {
            clearInterval((window as any).vcQuickAccessTimer);
            delete (window as any).vcQuickAccessTimer;
        }
        document.getElementById("vc-quick-access-container")?.remove();
    }
});
