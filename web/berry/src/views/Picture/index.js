import { useState, useEffect } from 'react';
import { Card,LinearProgress,Toolbar,Container,Button,Stack  } from '@mui/material';
import { styled } from '@mui/material/styles';
import {LoadingButton } from '@mui/lab'
import { DragDropContext,Droppable,Draggable } from 'react-beautiful-dnd'
import { IconUpload,IconAxe } from '@tabler/icons-react';


export default function Picture() {
  const [loading, setLoading] = useState(false);

  const onDragEnd = () =>{
    console.log(1111);
  }

  const addPic = (event) =>{
    // const files = [...event.target.files];
    // for (let i = 0; i < files.length; i++) {
    //   const file = files[i];
    //   file.url = getObjectURL(file);
    // }
    // setImageList(getNewFileList(files));
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
      <Card>
        <Toolbar  sx={{
          height: 100,
          display: 'flex',
          justifyContent: 'space-between',
          p: (theme) => theme.spacing(0, 1, 0, 3)
        }}>
          <Container>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId='picture'>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <Draggable draggableId='picture' index={0}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} >
                          xxx
                        </div>
                      )}
                    </Draggable>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Container>
        </Toolbar>

        {loading && <LinearProgress />}
        <Stack
          direction='row'
          spacing={10}
          padding={'24px'}
        >
          <Button variant="contained" component="label" startIcon={<IconUpload/>}>
            图片上传
            <VisuallyHiddenInput type='file' multiple onChange={addPic}></VisuallyHiddenInput>
          </Button>
          <LoadingButton loading={loading} variant="contained" startIcon={<IconAxe/>}>
            合成图片
          </LoadingButton>
        </Stack>



      </Card>
    </>
  )
}