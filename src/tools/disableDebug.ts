const DEBUG_KEY = '__@@DEBUG@@__'


/**
 * 禁用调试
 * @example
 * ```ts
 * disableDebug({
 *   secret: '^sdf./][Cl32038df%……&*（）——+=',
 * })
 * ```
 */
export function disableDebug(debugOpts: DebugOpts) {
    const {
        secret,
        key = 'd',
        enable = true,
        disableF12 = true,
        disableMenu = true,

        labelText,
        wrapStyleText,
        btnText,
        btnStyleText,
        inputStyleText,
    } = debugOpts

    if (!enable) return

    const isAdmin = localStorage.getItem(DEBUG_KEY) === secret
    if (isAdmin) {
        return
    }

    addEvent(key)
    preventDebug()
    disableDebugAndContextMenu(disableF12, disableMenu)


    /**
     * shift + d 输入密码打开调试
     */
    function addEvent(key: string) {
        window.addEventListener('keydown', e => {
            if (e.shiftKey && e.key.toLocaleLowerCase() === key) {
                createInput()
            }
        })
    }

    /**
     * 输入框解除调试限制
     */
    function createInput() {
        const label = document.createElement('label')
        const input = document.createElement('input')
        input.type = 'password'

        const btn = document.createElement('button')
        btn.innerText = btnText || '确定'
        btnStyleText && (btn.style.cssText = btnStyleText)

        label.innerText = labelText || '你想干什么？'
        label.appendChild(input)
        label.appendChild(btn)

        input.style.cssText = inputStyleText || `
            border: 1px solid #000;
            border-radius: 5px;
        `
        label.style.cssText = wrapStyleText || `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            border: 1px solid #000;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
        `

        btn.addEventListener('click', () => {
            const val = input.value
            if (val === secret) {
                localStorage.setItem(DEBUG_KEY, val)
                location.reload()
            }
            else {
                alert('？')
            }
        })

        document.body.appendChild(label)
    }
}

/**
 * 禁用开发者工具
 * @param disableF12 是否禁用 F12 按键
 * @param disableMenu 是否禁用右键菜单
 */
function disableDebugAndContextMenu(disableF12 = true, disableMenu = true) {
    disableMenu && document.addEventListener('contextmenu', (e) => {
        e.preventDefault() // 阻止右键菜单出现
    })

    disableF12 && document.addEventListener('keydown', (e) => {
        // 检查是否是 F12 键
        if (e.key === 'F12' || e.code === 'F12') {
            e.preventDefault()
        }
        // 检查是否是 Command + Option + I (MacOS 下 Chrome/Firefox 的开发者工具快捷键)
        else if ((e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i')) || (e.metaKey && e.key === 'J' || e.key === 'j')) {
            e.preventDefault()
        }
        // 检查是否是 Command + Shift + C (MacOS 下 Chrome/Firefox 的元素检查快捷键)
        else if (e.metaKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault()
        }
        // 检查是否是 Command + Shift + J (MacOS 下 Chrome/Firefox 的控制台快捷键)
        else if (e.metaKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault()
        }
        // 检查是否是 Command + Alt + C (MacOS 下 Safari 的元素检查快捷键)
        else if (e.metaKey && e.altKey && (e.key === 'C' || e.key === 'c')) {
            e.preventDefault()
        }
        // 检查是否是 Command + Alt + J (MacOS 下 Safari 的控制台快捷键)
        else if (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault()
        }
    })
}

/**
 * 阻止调试
 */
function preventDebug() {
    const debug = new Function('debugger')
    const getOut = () => location.href = 'about:blank'

    let id = setInterval(() => {
        const start = Date.now()
        debug()

        if (Date.now() - start > 10) {
            getOut()
        }

        if (
            outerWidth - innerWidth > 250 ||
            outerHeight - innerHeight > 250
        ) {
            getOut()
        }
    }, 1000)

    return () => {
        clearInterval(id)
    }
}


export type DebugOpts = {
    /**
     * 是否开启禁用调试，你可根据环境变量设置
     * @default true
     */
    enable?: boolean
    secret: string
    /**
     * 开发按键，例如传入 'd'，则按住 shift + d 键，可以输入密码打开调试
     * @default 'd'
     */
    key?: string

    /**
     * 是否禁用 F12 按键
     * @default true
     */
    disableF12?: boolean
    /**
     * 是否禁用右键菜单
     * @default true
     */
    disableMenu?: boolean

    /**
     * 输入框 label 文本
     * @default '你想干什么？'
     */
    labelText?: string
    /**
     * 输入框按钮文本
     * @default '确定'
     */
    btnText?: string
    /**
     * 输入框按钮样式的 style.cssText
     */
    btnStyleText?: string
    /**
     * 外层样式的 style.cssText
     */
    wrapStyleText?: string
    /**
     * input 样式的 style.cssText
     */
    inputStyleText?: string
}