import React, { useState } from 'react';
import { useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getImageInfo, getObjectURL } from '../../utils';
import ImageTable from './components/ImageTable';
import { Button } from 'semantic-ui-react';
import ImageMerge from './components/ImageMerge';

const getNewFileList = (files) => {
  // 生成二维数组, 每个数组的第一个元素是正面图片, 第二个元素是反面图片
  const newFileList = [];
  for (let i = 0; i < files.length; i += 2) {
    newFileList.push({
      front: files[i],
      back: files[i + 1],
      result: ''
    });
  }
  return newFileList;
};

const getMax = (...arr) => {
  return Math.max(...arr);
};
const Picture = () => {
  const imageMergeRef = useRef();
  const [imageList, setImageList] = useState([]);
  const [mergeStatus, setMergeStatus] = useState(1);
  const onFileChange = (event) => {
    const files = [...event.target.files];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      file.url = getObjectURL(file);
    }
    setImageList(getNewFileList(files));
  };
  const mergePicture = async () => {
    if(imageList.length === 0) {
      return;
    }
    setMergeStatus(2)
    const imageList_temp = [...imageList];
    // const canvas = document.getElementById('canvas');
    // const ctx = canvas.getContext('2d');
    // 创建canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // 缩放比例
    let scale = 1;

    // 固定宽高
    for (let i = 0; i < imageList_temp.length; i++) {
      const image = imageList_temp[i];
      if(image?.front?.url === undefined || image?.back?.url === undefined) {
        continue;
      }
      const front_image = await getImageInfo(image.front.url);
      const back_image = await getImageInfo(image.back.url);
      const max_width = getMax(front_image.width, back_image.width)
      const max_height = getMax(front_image.height, back_image.height);
      canvas.width = max_width * 2 * scale
      canvas.height = max_height * scale;
      ctx.drawImage(front_image.imgEle, 0, 0, front_image.width * scale, front_image.height * scale);
      ctx.drawImage(back_image.imgEle, front_image.width * scale, 0, back_image.width * scale, back_image.height * scale);
      const renderHeight = canvas.height * (300 / canvas.width);
      image.result = {
        url: canvas.toDataURL('image/webp', 0.5),
        width: canvas.width,
        height: canvas.height,
        renderHeight
      }
    }
    setImageList(imageList_temp);
    setMergeStatus(3)
  }


  const fileExport = () => {
    if(imageList.length === 0 || imageList[0].result === undefined) {
      return;
    }
    // 多张图片压缩成zip, 并导出
    const zip = new JSZip();
    const imageList_temp = [...imageList];
    for (let i = 0; i < imageList_temp.length; i++) {
      const image = imageList_temp[i];
      if(image?.result?.url === undefined) {
        continue;
      }
      const base64 = image.result.url.split(',')[1];
      zip.file(`image${i}.png`, base64, { base64: true });
    }
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'images.zip');
    }
    );
  }
  return (
    <>
      <input type='file' multiple onChange={onFileChange} />
      <Button onClick={mergePicture} disabled={mergeStatus === 2} loading={mergeStatus===2}>合成图片 </Button>
      <div style={{padding: '20px', display: 'inline-block'}}>
        {mergeStatus === 1 ? '' : mergeStatus === 2 ? '正在合成中, 请稍后' : '合成完成'}

      </div>
      <Button onClick={fileExport}>下载图片</Button>

      <ImageTable imageList={imageList} />
      <ImageMerge ref={imageMergeRef} setImageList={setImageList} />
    </>
  );
};


export default Picture;
