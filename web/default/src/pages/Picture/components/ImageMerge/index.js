import React from 'react';
import { useState, useImperativeHandle, forwardRef } from 'react';
import { getImageInfo } from '../../../../utils';




const ImageMerge = (props, ref) => {
  const { setImageList } = props;
  useImperativeHandle(ref, () => ({
    merge: async (newVal) => {

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