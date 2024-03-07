import { defineConfig } from 'vitepress'


/** https://vitepress.dev/reference/site-config */
export default defineConfig({
    title: '@jl-org/tool',
    description: "this is @jl-org/tool api website",
    lang: "zh-CN",
    themeConfig: {
        /** 这里根路径指的是 /docs */
        nav: [
            { text: "Home", link: "/type-doc/modules.md" },
            { text: "Animate", link: "/type-doc/modules/animation.md" },
        ],

        sidebar: [
            {
                text: "目录",
                items: [
                    {
                        text: "animation",
                        link: "/type-doc/modules/animation.md",
                    },
                    {
                        text: "canvas",
                        link: "/type-doc/modules/canvas.md",
                    },
                    {
                        text: "dataStructure",
                        link: "/type-doc/modules/dataStructure.md",
                    },
                    {
                        text: "plugins",
                        link: "/type-doc/modules/plugins.md",
                    },
                    {
                        text: "shared",
                        link: "/type-doc/modules/shared_exportToDoc.md",
                    },
                    {
                        text: "color",
                        link: "/type-doc/modules/tools_color.md",
                    },
                    {
                        text: "domTools",
                        link: "/type-doc/modules/tools_domTools.md",
                    },
                    {
                        text: "scheduleTask",
                        link: "/type-doc/modules/tools_scheduleTask.md",
                    },
                    {
                        text: "tools",
                        link: "/type-doc/modules/tools_tools.md",
                    },
                    {
                        text: "webApi",
                        link: "/type-doc/modules/webApi.md",
                    },
                ],
            },
        ],


        socialLinks: [
            { icon: "github", link: "https://github.com/vuejs/vitepress" },
        ],
    },
})
