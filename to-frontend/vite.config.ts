import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true, //abilitare pwa in dev
            },
            manifest: {
                "theme_color": "#ffffff",
                "background_color": "#0066cc",
                "icons": [
                    {
                        "purpose": "maskable",
                        "sizes": "512x512",
                        "src": "logo_tagliandonline_mask-icon_blu_bianco_512.png",
                        "type": "image/png"
                    },
                    {
                        "purpose": "any",
                        "sizes": "512x512",
                        "src": "logo_tagliandonline_mask-icon_blu_bianco_512.png",
                        "type": "image/png"
                    },
                    {
                        "src": "logo_tagliandonline_mask-icon_blu_bianco_192.png",
                        "sizes": "192x192",
                        "type": "image/png"
                    },
                    {
                        "sizes": "64x64",
                        "src": "logo_tagliandonline_mask-icon_blu_bianco_64.png",
                        "type": "image/png"
                    }
                ],
                "orientation": "any",
                "display": "standalone",
                "lang": "it-IT",
                "short_name": "TO",
                "name": "TagliandOnline",
                "description": "Tagliandi, permessi, domande, direttamente da web"
            },
            workbox: {
                navigateFallback: '/index.html',
                runtimeCaching: [
                    //CacheFirst per font, immagini e json statici con 5 giorni di validità
                    {
                        urlPattern: /\.(png|svg|ico|ttf|json)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-font-cache',
                            expiration: {maxEntries: 50, maxAgeSeconds: 5 * 24 * 60 * 60}
                        }
                    },
                    //NetworkFirst per le pagine HTML per 5 giorni
                    {
                        urlPattern: ({request}) => request.destination === 'document',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'document-cache',
                            expiration: {maxEntries: 50, maxAgeSeconds: 5 * 24 * 60 * 60}
                        }
                    },
                    //StaleWhileRevalidate per css e js per 5 giorni
                    {
                        urlPattern: ({request}) => request.destination === 'script' || request.destination === 'style',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'css-js-cache',
                            expiration: {maxEntries: 50, maxAgeSeconds: 5 * 24 * 60 * 60}
                        }
                    },
                    //NetworkFirst per le chiamate API (fa vedere comunque l'ultimo stato se non c'è la rete max 1 ora)
                    {
                        urlPattern: ({request}) => request.url.includes("api"),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'maps-res-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 1 * 60 * 60 }
                        }
                    },
                ]

            },
            includeAssets: [
                "to-frontend/public/apple-touch-icon.png",
                "to-frontend/public/logo_82.png",
                "to-frontend/public/logo_tagliandonline.svg",
                "to-frontend/public/logo_tagliandonline_bianco.svg",
                "to-frontend/public/logo_tagliandonline_blu_bianco.svg",
                "to-frontend/public/logo_tagliandonline_mask-icon_blu_bianco.svg",
                "to-frontend/public/logo_tagliandonline_mask-icon_blu_bianco_192.png",
                "to-frontend/public/logo_tagliandonline_mask-icon_blu_bianco_512.png",
                "to-frontend/public/logo_tagliandonline_blu_bianco_48.ico",
                "to-frontend/public/logo_tagliandonline_mask-icon_blu_bianco_64.png"
            ]
        })
    ],
})
