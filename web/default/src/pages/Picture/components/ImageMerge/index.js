import React from 'react';
import { useState, useImperativeHandle, forwardRef } from 'react';
import { getImageInfo } from '../../../../utils';

const getMax = (...arr) => {
  return Math.max(...arr);
};


const ImageMerge = (props, ref) => {
  const { setImageList } = props;
  useImperativeHandle(ref, () => ({
    merge: async (newVal) => {
      const imageList = [...newVal];
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      // 缩放比例
      let scale = 0;
      // 固定宽高
      const width = 1000;
      const height = 1000;
      for (let i = 0; i < imageList.length; i++) {
        const image = imageList[i];
        const front_image = await getImageInfo(image.front.url);
        const back_image = await getImageInfo(image.back.url);
        const max_width = getMax(front_image.width, back_image.width)
        const max_height = getMax(front_image.height, back_image.height);
        scale = max_width / width > max_height / height ? width / max_width : height / max_height;
        canvas.width = max_width * 2 * scale
        canvas.height = max_height * scale;
        console.log(max_width, max_height);
        console.log(scale);
        const front_img = new Image();
        front_img.src = image.front.url;
        const back_img = new Image();
        back_img.src = image.back.url;
        back_img.onload = () => {
          ctx.drawImage(front_img, 0, 0, front_image.width * scale, front_image.height * scale);
          ctx.drawImage(back_img, front_image.width * scale, 0, back_image.width * scale, back_image.height * scale);
          image.result = canvas.toDataURL("image/jpeg", 0.9);
        }
      }
      setImageList(imageList);
    }
  }));

  return (
    <>
      <canvas id='canvas' width='800' height='800'
              style={{ border: '1px solid #000', position: 'absolute', left: '99999px' }}></canvas>
    </>
  );
};

export default React.forwardRef(ImageMerge);