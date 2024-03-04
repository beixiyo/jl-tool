export {
    getType,
    randomStr,
    dayOfYear,
    timeFromDate,
    celsiusToFahrenheit,
    fahrenheitToCelsius,
    dayDiff,
    getRandomNum,
    getSum,
    deepClone,
    deepCompare,
    arrToTree,
    arrToChunk,
    binarySearch,
    toCamel,
    curry,
    padNum,
    padDate,
    getValidDate,
    isLtYear,
    genIcon,
    numFixed,
    filterVals,
    excludeVals,
    filterKeys,
    excludeKeys,
    EventBus
} from '@/tools/tools'

export {
    adaptPx,
    handleCssUnit,
    pxToVw,
    getStyle,
    throttle,
    debounce,
    getSelectedText,
    copyToClipboard,
    isDarkMode,
    isToBottom,
    getAllStyle,
    print,
    judgeImgLoad,
    getImg,
    blobToBase64,
    doubleKeyDown,
    setParentOverflow,
    fullScreen,
    HTMLToStr,
    getWinHeight,
    getWinWidth,
    downloadByData,
    matchProtocol,
    downloadByUrl
} from '@/tools/domTools'

export { scheduleTask } from '@/tools/scheduleTask'

export {
    Recorder,
    Speaker,
    SpeakToTxt,
    openCamera,
    screenCAP
} from '@/webApi'

export {
    getColor,
    getColorArr,
    rgbToHex,
    hexToRGB,
    hexColorToRaw,
    lightenColor,
    colorAddOpacity
} from '@/tools/color'

export {
    MinHeap,
    MaxHeap
} from '@/dataStructure'

export {
    applyAnimation,
    createAnimation,
    createAnimationByTime,
    genTimeFunc,
    ATo
} from '@/animation'

export {
    TimeType,
    KeyCode,
    TreeData,
    OnUpdate,
    AnimationOpt,
    TimeFunc,
    BaseType
} from '@/types'

export {
    Reg,
    isPureNum,
    isArr,
    isBool,
    isNum,
    isObj,
    isStr,
    isSame,
    isFn
} from '@/shared'


export {
    calcCoord,
    createCvs,
    getPixel,
    fillPixel,
    parseImgData,
    cutImg
} from '@/canvas'

export {
    autoUpdate
} from '@/plugins'
