import React, { useState } from 'react';
import { useRef } from 'react';
import { getObjectURL } from '../../utils';
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


const Picture = () => {
  const imageMergeRef = useRef();
  const [imageList, setImageList] = useState([]);
  const onFileChange = (event) => {
    const files = [...event.target.files];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      file.url = getObjectURL(file);
    }
    setImageList(getNewFileList(files));
  };
  const mergePicture = () => {
    imageMergeRef.current?.merge(imageList);
  }
  return (
    <>
      <input type='file' multiple onChange={onFileChange} />
      <Button onClick={mergePicture}>合成图片</Button>
      <ImageTable imageList={imageList} />
      <ImageMerge ref={imageMergeRef} setImageList={setImageList} />
    </>
  );
};


export default Picture;
