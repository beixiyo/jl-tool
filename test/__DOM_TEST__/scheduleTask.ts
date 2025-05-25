import { genArr } from '@/tools/arrTools'
import { scheduleTask } from '@/tools/scheduleTask'
import { wait } from '@/tools/tools'

const reactBtn = document.createElement('button')
const stopBtn = document.createElement('button')
const taskArr = genArr(20000, genTask)

reactBtn.textContent = 'React任务调度器方式插入 20000 个元素'
stopBtn.textContent = '停止调度'
document.body.append(reactBtn, stopBtn)

let isStop = false
reactBtn.onclick = () => {
  scheduleTask(taskArr, () => isStop).then(console.log)
}

stopBtn.onclick = () => {
  isStop = true
  console.log(isStop)
}

function genTask(item: number) {
  return async () => {
    const el = document.createElement('div')
    el.textContent = `${item}`
    document.body.appendChild(el)
    await wait(2)
    return item
  }
}
