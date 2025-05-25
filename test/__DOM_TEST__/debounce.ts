import {
  debounce,
  throttle,
} from '@/tools/domTools'

const throttleInput = document.createElement('input')
const debounceInput = document.createElement('input')

throttleInput.style.display = 'block'
debounceInput.style.display = 'block'
debounceInput.style.marginTop = '10px'
document.body.append(throttleInput, debounceInput, document.createElement('hr'))

const throttleP = document.createElement('p')
const throttleSpan = document.createElement('span')
const debounceP = document.createElement('p')
const debounceSpan = document.createElement('span')

throttleSpan.textContent = '节流'
debounceSpan.textContent = '防抖'
throttleP.style.margin = '10px'
debounceP.style.margin = '10px'

document.body.append(
  throttleSpan,
  throttleP,
  debounceSpan,
  debounceP,
)

/**
 * 写两个 p 元素，里面的文字
 * 随着输入框内容改变，用上节流和防抖函数
 */
throttleInput.oninput = throttle(() => {
  throttleP.textContent = throttleInput.value
}, 500)

debounceInput.oninput = debounce(() => {
  debounceP.textContent = debounceInput.value
}, 500)
