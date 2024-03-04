import {
    blobToBase64,
    compressImg,
    getImg
} from '@jl-org/tool'


const input = document.createElement('input')
input.type = 'file'
document.body.appendChild(input)

input.addEventListener('change', async (e) => {
    const file = input.files![0]
    console.log(file)

    const src = await blobToBase64(file)
    console.log(src)
    console.log('------------------------------------------------------------')

    const img = await getImg(src) as HTMLImageElement
    const blob = await compressImg(img, 'base64', .1)
    console.log(blob)

    const img2 = await getImg(blob) as HTMLImageElement
    document.body.appendChild(img2)
})