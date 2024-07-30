import {MODEL} from 'utils/preset';
import {getOpenaiMsg} from 'utils/common';


const getImageInfo = (image)=>{
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        imgEle: img
      });
    };
  });
}

const getMax = (...arr) => {
  return Math.max(...arr);
};

const handleIdentify = async (imgList)=>{
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let scale = 1;
    const front_image = await getImageInfo(imgList[0]);
    const back_image = await getImageInfo(imgList[1]);
    const max_width = getMax(front_image.width, back_image.width)
    const max_height = getMax(front_image.height, back_image.height);
    if(max_width > 1000 || max_height > 1000){
      scale = 1000 / getMax(max_width, max_height)
    }
    canvas.width = max_width * 2 * scale
    canvas.height = max_height * scale;
    ctx.drawImage(front_image.imgEle, 0, 0, front_image.width * scale, front_image.height * scale);
    ctx.drawImage(back_image.imgEle, front_image.width * scale, 0, back_image.width * scale, back_image.height * scale);
    //合成图
    return {
      url: canvas.toDataURL('image/webp', 0.4),
      width: canvas.width,
      height: canvas.height,
    }
  }


export default handleIdentify
