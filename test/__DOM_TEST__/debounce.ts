import {
    throttle,
    debounce
} from '@deb'


const throttleInput = document.createElement('input'),
    debounceInput = document.createElement('input')

throttleInput.style.display = 'block'
debounceInput.style.display = 'block'
debounceInput.style.marginTop = '10px'
document.body.append(throttleInput, debounceInput, document.createElement('hr'))


const throttleP = document.createElement('p'),
    throttleSpan = document.createElement('span'),
    debounceP = document.createElement('p'),
    debounceSpan = document.createElement('span')

throttleSpan.innerText = '节流'
debounceSpan.innerText = '防抖'
throttleP.style.margin = '10px'
debounceP.style.margin = '10px'

document.body.append(
    throttleSpan, throttleP,
    debounceSpan, debounceP,
)


/**
 * 写两个 p 元素，里面的文字
 * 随着输入框内容改变，用上节流和防抖函数
 */
throttleInput.oninput = throttle(() => {
    throttleP.innerText = throttleInput.value
}, 500)

debounceInput.oninput = debounce(() => {
    debounceP.innerText = debounceInput.value
}, 500)