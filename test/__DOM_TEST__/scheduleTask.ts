import { scheduleTask } from '@deb'


const
    reactBtn = document.createElement('button'),
    taskArr = Array.from({ length: 200000 }).map((_, i) => genTask(i + 1)),
    onEnd = () => console.log('end')

reactBtn.textContent = 'React任务调度器方式执行'
document.body.appendChild(reactBtn)


let stop = false
reactBtn.onclick = () => {
    scheduleTask(taskArr, onEnd, () => {
        return stop
    })

    /** 停止调度测试 */
    setTimeout(() => {
        stop = true
    }, 500);
}


function genTask(item: number) {
    return () => {
        const el = document.createElement('div')
        el.textContent = item + ''
        document.body.appendChild(el)
    }
}

