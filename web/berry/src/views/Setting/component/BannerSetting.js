import {useState ,useEffect}  from 'react';
import SubCard from 'ui-component/cards/SubCard';
import {
  Stack,
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { IconCloudUpload,IconTrash } from '@tabler/icons-react';
import { styled } from '@mui/material/styles';
import { showError} from 'utils/common';
import { API,ImageUrl } from 'utils/api';

const BannerSetting = ()=>{
  const [bannerList, setBannerList] = useState([])

  const getBannerList = async ()=>{
    const res = await API.get('/api/banner/?p=0')
    const {success, message, data} = res.data
    console.log(data);
    if (success){
      setBannerList(data)
    }else {
      showError(message)
    }
  }

  useEffect(()=>{
    getBannerList().then()
  },[])

  const handleImageUpload = async (event)=>{
    const file = event.target.files[0]
    console.log(event.target.files[0]);
    if(file){
      const res= await API.post('/api/upload',{
        file:file
      },{ headers: {
          'Content-Type': 'multipart/form-data',
        }})
      const {success, message, data} = res.data
      if(success){
        await addBannerImage(data.id)
      }else {
        showError(message)
      }
    }
  }

  const addBannerImage = async (id)=>{
    const res = await API.post('/api/banner',{
      file_id:id,
      is_active:1
    })
    const {success, message, data} = res.data
    console.log(data);
    if (success){
      await getBannerList()
    }else {
      showError(message)
    }
  }

  const handleDelBanner = async (id)=>{
    const res = await API.delete(`/api/banner/${id}`)
    const {success, message, data} = res.data
    console.log(data);
    if (success){
      await getBannerList()
    }else {
      showError(message)
    }
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

  return (
    <>
      <Stack spacing={2}>
        <SubCard title='轮播图设置'>
          <Grid container spacing={{xs:3,sm:2,md:4}}>
            <Grid xs={12}>
              <Button variant="contained" startIcon={<IconCloudUpload/>} component="label" >
                上传轮播图
                <VisuallyHiddenInput  accept="image/*"  type="file" onChange={handleImageUpload}/>
              </Button>
            </Grid>
            <Grid xs={12}>
              <ImageList cols={1} gap={50}>
                {bannerList.map((item)=>(
                  <ImageListItem key={item.id} >
                    <img src={ImageUrl+item.file.file_path} alt={item.id}/>
                    <ImageListItemBar  position='below' actionIcon={
                      <IconButton onClick={() => handleDelBanner(item.id)}>
                      <IconTrash size={40}/>
                      </IconButton>}>
                    </ImageListItemBar>
                  </ImageListItem>
                ))}
              </ImageList>
            </Grid>
          </Grid>
        </SubCard>
      </Stack>
    </>
  )
}

export default BannerSetting