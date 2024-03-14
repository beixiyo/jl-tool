import { Channel, EventBus } from '@/channel'


const eb = new EventBus()

const testFn = (...args: any[]) => console.log('接收不定参数 test', ...args),
    testFn2 = () => console.log('test2'),
    testFn3 = () => console.log('test3'),
    testFn4 = () => console.log('test4')

eb.on('test', testFn)
eb.on('test2', testFn2)
eb.on('test2', testFn3)
eb.on('test2', testFn4)
eb.once('once', () => console.log('once'))

/** 打印 1 2 3 */
eb.emit('test', 1, 2, 3)
/** 仅仅打印一次 once */
eb.emit('once')
eb.emit('once');
split()

/** 打印 test2 test3 test4 */
eb.emit('test2')
split()

/** 单独取消 test2，将打印 test3 test4 */
eb.off('test2', testFn2)
eb.emit('test2')
split()

/** 取消所有 */
eb.off()
eb.emit('test2')


/** ================================================================== */
console.log('测试 Channel ===============================================')

const c = new Channel()

c.add('test', testFn)
c.add('test', testFn2)
c.add('test', testFn3)
c.add('test', testFn4)

/** 将打印 test 到 test4 */
c.trigger('test', 1, 2, 3)
split()

/** 单独删除 test，将打印 test2 到 test4 */
c.del('test', testFn)
c.trigger('test', 1, 2, 3)
split()

/** 全部删除 */
c.del('test')
console.log('删除后')
c.trigger('test', 1, 2, 3)


function split() {
    console.log('='.repeat(80))
}