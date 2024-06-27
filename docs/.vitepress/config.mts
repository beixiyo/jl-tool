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
                        text: "动画处理",
                        link: "/type-doc/modules/animation.md",
                    },
                    {
                        text: "canvas工具",
                        link: "/type-doc/modules/canvas.md",
                    },
                    {
                        text: "事件分发",
                        link: "/type-doc/modules/channel.md",
                    },
                    
                    {
                        text: "数据结构",
                        link: "/type-doc/modules/dataStructure.md",
                    },
                    {
                        text: "网络工具",
                        link: "/type-doc/modules/net.md",
                    },
                    {
                        text: "Web 插件",
                        link: "/type-doc/modules/plugins.md",
                    },
                    {
                        text: "is 判断",
                        link: "/type-doc/modules/shared.md",
                    },

                    {
                        text: "数组处理",
                        link: "/type-doc/modules/tools_arrTools.md",
                    },
                    {
                        text: "颜色处理",
                        link: "/type-doc/modules/tools_colorTools.md",
                    },

                    {
                        text: "时钟",
                        link: "/type-doc/modules/tools_Clock.md",
                    },
                    {
                        text: "日期处理",
                        link: "/type-doc/modules/tools_dateTools.md",
                    },
                    
                    {
                        text: "DOM 处理",
                        link: "/type-doc/modules/tools_domTools.md",
                    },
                    {
                        text: "文件处理",
                        link: "/type-doc/modules/tools_fileTools.md",
                    },
                    {
                        text: "常用工具",
                        link: "/type-doc/modules/tools_tools.md",
                    },
                    {
                        text: "分时运行函数",
                        link: "/type-doc/modules/tools_scheduleTask.md",
                    },
                    
                    {
                        text: "webApi",
                        link: "/type-doc/modules/webApi.md",
                    },
                ],
            },
        ],


        socialLinks: [
            { icon: "github", link: "https://github.com/beixiyo/jl-tool" },
        ],
    },
})
