import { useState, useEffect } from 'react';
import { Card,LinearProgress,Button,Stack,TableContainer,Table,TableBody,TableCell, TableHead, TableRow  } from '@mui/material';
import { styled } from '@mui/material/styles';
import {LoadingButton } from '@mui/lab'
import JSZip from 'jszip';
import { API } from 'utils/api';
import { saveAs } from 'file-saver';
import { DragDropContext,Droppable,Draggable } from 'react-beautiful-dnd'
import { IconUpload,IconAxe,IconDownload } from '@tabler/icons-react';
import {getImageInfo,getObjectURL} from 'utils/common';

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

export default function Picture() {
  const [loading, setLoading] = useState(false);
  const [fileList,setFileList] = useState([])
  const [imageList,setImageList] = useState([]);
  const [mergeStatus, setMergeStatus] = useState(1);
  const [isOpen,setIsOpen] = useState(false);

  const getDefault = async () => {
    const {data} = await API.get('/api/user/self')
    if(data.data.quota>0){
      setIsOpen(true)
    }
  }

  const onDragEnd = (result) =>{
    console.log(result);
    //编写拖拽逻辑
    const { destination, source } = result;

    // 如果没有目标（即拖拽出了容器），或者位置未改变，直接返回
    if (!destination || destination.index === source.index) {
      return;
    }

    // 创建新的文件列表
    const newFileList = Array.from(fileList);
    const [removed] = newFileList.splice(source.index, 1); // 从原来的位置移除拖拽的项
    newFileList.splice(destination.index, 0, removed); // 插入到目标位置

    // 更新状态
    setFileList(newFileList);
  }

  const addPic = (event) =>{
    const files = [...event.target.files];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      file.url = getObjectURL(file);
    }
    setFileList([...files,...fileList])

    console.log(fileList);
    // setImageList(getNewFileList(files));
  }

  useEffect(()=>{
    setImageList(getNewFileList(fileList))
    console.log(imageList);
    getDefault()
  },[fileList])

  //处理图片
  const mergePicture = async () => {
    if(imageList.length === 0) {
      return;
    }
    setLoading(true);
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
    setLoading(false);
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

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  return(
    <>
      {isOpen && <Card sx={{ userSelect: 'none',width:'100%' }} >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId='picture' direction="horizontal">
            {(provided) => (
              <Stack ref={provided.innerRef} {...provided.droppableProps} direction='row' spacing={3} padding={'20px'} sx={{ overflowX: 'auto',minWidth: '100%',}} >
                {fileList.map((item,index)=>(
                  <Draggable key={index} draggableId={index.toString()} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} >
                        <img src={item.url} alt='' style={{ width:'120px',height:'180px' }} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </DragDropContext>

        {loading && <LinearProgress />}
        <Stack
          direction='row'
          spacing={5}
          padding={'24px'}
        >
          <Button variant="contained" component="label" startIcon={<IconUpload/>}>
            图片上传
            <VisuallyHiddenInput type='file' multiple onChange={addPic}></VisuallyHiddenInput>
          </Button>
          <LoadingButton loading={mergeStatus===2} variant="contained" startIcon={<IconAxe/>} onClick={mergePicture}>
            合成图片
          </LoadingButton>
          <Button variant="contained" onClick={fileExport} startIcon={<IconDownload/>}>下载图片</Button>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>正面</TableCell>
                <TableCell>反面</TableCell>
                <TableCell>合成图片</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {imageList.map((image, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <img src={image?.front?.url} alt='' style={{ width:'120px',height:'180px' }} />
                  </TableCell>
                  <TableCell>
                    <img src={image?.back?.url} alt='' style={{ width:'120px',height:'180px' }} />
                  </TableCell>
                  <TableCell>
                    {
                      image.result && <img src={image.result.url} alt='' style={{ width: '300px', height: image.result.renderHeight + 'px' }} />
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      </Card>}
      {!isOpen && '你没有权限使用'}
    </>
  )
}