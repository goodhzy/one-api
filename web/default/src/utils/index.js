/**
 * 获取文件本地路径
 * @param file
 * @returns {null}
 */
export const getObjectURL = (file) => {
  let url = null;
  if (window.createObjectURL !== undefined) { // basic
    url = window.createObjectURL(file);
  } else if (window.URL !== undefined) { // mozilla(firefox)
    url = window.URL.createObjectURL(file);
  } else if (window.webkitURL !== undefined) { // webkit or chrome
    url = window.webkitURL.createObjectURL(file);
  }
  return url;
};

/*
  * 获取图片信息
 */
export const getImageInfo = (image) => {
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