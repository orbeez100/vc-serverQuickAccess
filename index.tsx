import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Webpack, byProps } from "@webpack";
import React from "react";

// Safe lookups using the standard Webpack search engine
const NavigationUtils = Webpack.getModule(byProps("transitionTo", "selectGuild"));

const QUICK_SERVERS = [
    { id: "123456789012345678", name: "Dev Server", iconUrl: "https://i.imgur.com/your-image.png" },
    { id: "876543210987654321", name: "Main Project", iconUrl: "https://i.imgur.com/your-image2.png" }
];

export default definePlugin({
    name: "ServerQuickAccess",
    description: "Adds instant server shortcuts to the top right header bar next to search.",
    authors: [{ name: "Orbeez", id: 0n }],

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
        window.QuickAccessBar = () => {
            return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "12px" }}>
                    {QUICK_SERVERS.map(server => (
                        <div
                            key={server.id}
                            title={server.name}
                            onClick={() => NavigationUtils?.selectGuild(server.id)}
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
                            <img src={server.iconUrl} alt={server.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    ))}
                    <div style={{ width: "1px", height: "16px", backgroundColor: "var(--background-modifier-accent)", margin: "0 4px" }} />
                </div>
            );
        };
    },

    stop() {
        if (window.QuickAccessBar) delete window.QuickAccessBar;
    }
});
