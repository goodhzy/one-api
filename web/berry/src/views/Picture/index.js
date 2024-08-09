import { Card,LinearProgress } from '@mui/material';
import { DragDropContext,Droppable,Draggable } from 'react-beautiful-dnd'

export default function Picture() {

  const onDragEnd = () =>{
    console.log(1111);
  }

  return(
    <>
      <Card>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId='picture'>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <Draggable draggableId='picture' index={0}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      xxx
                    </div>
                  )}
                </Draggable>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>
    </>
  )
}