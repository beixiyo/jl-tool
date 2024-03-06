import { defineConfig } from 'vitepress'


export default defineConfig({
    title: '@jl-org/tool',
    description: "this is @jl-org/tool api website",
    lang: "zh-CN",
    themeConfig: {
        /** 这里根路径指的是 /doc */
        nav: [
            { text: "animate", link: "/type-doc/modules/animation.md" },
        ],

        /** 侧边栏，根据不同的 nav 来配置专属的侧边栏 */
        sidebar: {
            /** 为 `/type-doc/modules` 路径配置专属的侧边栏 */
            "/type-doc/modules": [
                {
                    text: "Introduction",
                    collapsed: true,
                    items: [
                        {
                            text: "What is canvas?",
                            link: "/type-doc/modules/canvas.md",
                        },
                        {
                            text: "Getting Started",
                            link: "/type-doc/modules/plugins.md",
                        },
                    ],
                },
            ],
        },

        socialLinks: [
            { icon: "github", link: "https://github.com/vuejs/vitepress" },
        ],
    },
})
