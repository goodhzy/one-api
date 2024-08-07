import { Card,LinearProgress } from '@mui/material';
import { DragDropContext } from 'react-beautiful-dnd'

export default function Picture() {

  return(
    <>
      <Card>
        <DragDropContext>
          <div>111</div>
          <div>111</div>
          <div>111</div>
          <div>111</div>
        </DragDropContext>
      </Card>
    </>
  )
}