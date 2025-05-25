import { scheduleTask } from '@/tools/scheduleTask'

const
  reactBtn = document.createElement('button')
const stopBtn = document.createElement('button')
const taskArr = Array.from({ length: 20000 }).map((_, i) => genTask(i + 1))
const onEnd = () => console.log('end')

reactBtn.textContent = 'React任务调度器方式插入 20000 个元素'
stopBtn.textContent = '停止调度'
document.body.append(reactBtn, stopBtn)

let isStop = false
reactBtn.onclick = () => {
  scheduleTask(taskArr, onEnd, () => isStop)
}

stopBtn.onclick = () => {
  isStop = true
}

function genTask(item: number) {
  return () => {
    const el = document.createElement('div')
    el.textContent = `${item}`
    document.body.appendChild(el)
  }
}
