export const compressImage = (url, maxSize) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const image = new Image();
          image.onload = () => {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let width = image.width;
            let height = image.height;
            let quality = 0.5;
            let dataUrl;

            do {
              canvas.width = width;
              canvas.height = height;
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
              ctx?.drawImage(image, 0, 0, width, height);
              dataUrl = canvas.toDataURL('image/webp', quality);
              console.log(dataUrl.length);
              console.log('-----------------------------------------');
              if (dataUrl.length < maxSize) break;

              if (quality > 0.5) {
                // Prioritize quality reduction
                quality -= 0.1;
              } else {
                // Then reduce the size
                width *= 0.9;
                height *= 0.9;
              }
            } while (dataUrl.length > maxSize);

            resolve(dataUrl);
          };
          image.onerror = reject;
          image.src = readerEvent.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
};

const getImageInfo = (image) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin="anonymous"
    img.src = image;
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        imgEle: img
      });
    };
  });
};

const getMax = (...arr) => {
  return Math.max(...arr);
};

export const handleIdentify = async (imgList) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let scale = 1;
  const front_image = await getImageInfo(imgList[0]);
  const back_image = await getImageInfo(imgList[1]);
  console.log(front_image, back_image);
  console.log('-----------------------------------------');
  const max_width = getMax(front_image.width, back_image.width);
  const max_height = getMax(front_image.height, back_image.height);
  if (max_width > 1000 || max_height > 1000) {
    scale = 1000 / getMax(max_width, max_height);
  }
  canvas.width = max_width * 2 * scale;
  canvas.height = max_height * scale;
  ctx.drawImage(front_image.imgEle, 0, 0, front_image.width * scale, front_image.height * scale);
  ctx.drawImage(back_image.imgEle, front_image.width * scale, 0, back_image.width * scale, back_image.height * scale);
  //合成图
  return {
    url: canvas.toDataURL('image/webp', 0.4),
    width: canvas.width,
    height: canvas.height
  };
};

// 获取文件名称, 如file.png获取file
export const getFileName = (name) => {
  return name.split('.')[0];
}