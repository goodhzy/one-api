import { IconButton ,Tooltip  } from '@mui/material';
import { IconBrandWaze } from '@tabler/icons-react';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import FeedbackModal from "./component/FeedbackModal";

const FeedbackButtonContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    bottom: '5%', // 距离底部20px
    right: '5%', // 距离右侧20px
    zIndex: 1000, // 确保它在其他元素之上
}));

const FeedbackButton = ()=>{
    const [openFeedback, setOpenFeedback] = useState(false);

    return(
        <FeedbackButtonContainer>
            <Tooltip title='反馈问题'>
                <IconButton aria-label="delete" onClick={()=>{
                    setOpenFeedback(true)
                }}>
                    <IconBrandWaze size='50'/>
                </IconButton>
            </Tooltip>

            <FeedbackModal open={openFeedback}  handleClose={() => {
                setOpenFeedback(false);
            }}></FeedbackModal>
        </FeedbackButtonContainer>
    )

}

export default FeedbackButton