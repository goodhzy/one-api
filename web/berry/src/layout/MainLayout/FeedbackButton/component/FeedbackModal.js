import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    OutlinedInput,
    TextField,
    Button,
    InputLabel,
    Grid,
    FormControl,
    FormHelperText,
    ImageList,
    ImageListItem,
    ImageListItemBar, IconButton
} from "@mui/material";
import { Formik } from "formik";
import { showError, showSuccess } from "utils/common";
import {styled, useTheme} from "@mui/material/styles";
import * as Yup from "yup";
import { API } from "utils/api";
import EmailModal from "../../../../views/Profile/component/EmailModal";
import { IconTrash } from '@tabler/icons-react';

const validationSchema = Yup.object().shape({
    title: Yup.string().required("标题不能为空"),
    content: Yup.string().required("内容不能为空"),
});



const FeedbackModal = ({open,handleClose})=>{
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [images,setImages] = useState([])
    const [uploadFile,setUploadFile] = useState([])

    useEffect(() => {
        if (!open) {
            setImages([]);
            setUploadFile([]);
        }
    }, [open]);

    const handleImageUpload = (event) => {
        const files = event.target.files;
        if (images.length + files.length > 2) {
            showError('最多只能上传2张图片');
            return;
        }
        const newImages = [];
        for (let i = 0; i < files.length; i++) {
            setUploadFile((prevFile)=>[...prevFile,files[i]])
            const file = files[i];
            const reader = new FileReader();
            reader.onloadend = () => {
                newImages.push(reader.result);
                if (newImages.length === files.length) {
                    setImages((prevImages) => [...prevImages, ...newImages]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        setUploadFile((prevFile)=>prevFile.filter((_, i) => i !== index))
    };

    const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
        setLoading(true);
        setSubmitting(true);
        let imagesList = []
        if(uploadFile){
            for (let i =0;i<uploadFile.length;i++){
                const res= await API.post('/api/upload',{
                    file:uploadFile[i]
                },{ headers: {
                        'Content-Type': 'multipart/form-data',
                }})
                const {success, message, data} = res.data
                if(success){
                    imagesList.push(data.id)
                }else {
                    showError(message)
                }
            }

        }
        const res = await API.post(
            `/api/feedback`,{
                title:values.title,
                content:values.content,
                images:imagesList
            }
        );
        const { success, message } = res.data;
        if (success) {
            showSuccess("意见反馈成！");
            setSubmitting(false);
            setStatus({ success: true });
            handleClose();
        } else {
            showError(message);
            setErrors({ submit: message });
        }
        setLoading(false);
    };

    const HiddenInput = styled('input')({
        display:"none"
    })


    return(
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>意见反馈</DialogTitle>
            <DialogContent>
                <Grid container direction="column" alignItems="center">
                    <Formik
                        initialValues={{
                            title: "",
                            content: "",
                        }}
                        enableReinitialize
                        validationSchema={validationSchema}
                        onSubmit={submit}
                    >
                        {({
                            errors,
                            touched,
                            handleBlur,
                            handleChange,
                            handleSubmit,
                            values
                        })=>(
                            <form noValidate onSubmit={handleSubmit}>
                                <FormControl
                                    fullWidth
                                    error={Boolean(touched.title && errors.title)}
                                    sx={{ ...theme.typography.customInput }}
                                >
                                    <InputLabel htmlFor="title">标题</InputLabel>
                                    <OutlinedInput
                                        id="title"
                                        type="text"
                                        value={values.title}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                    />
                                    {touched.title && errors.title && (
                                        <FormHelperText error id="helper-title">
                                            {errors.title}
                                        </FormHelperText>
                                    )}
                                </FormControl>
                                <FormControl
                                    fullWidth
                                    error={Boolean(touched.content && errors.content)}
                                    sx={{ ...theme.typography.customInput }}
                                >
                                    {/*<InputLabel htmlFor="content">内容</InputLabel>*/}
                                    <TextField
                                        placeholder="内容"
                                        id="content"
                                        type="text"
                                        value={values.content}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        multiline
                                        rows={4}
                                        inputProps={{}}
                                        variant="outlined"
                                    />
                                    {touched.content && errors.content && (
                                        <FormHelperText error id="helper-content">
                                            {errors.content}
                                        </FormHelperText>
                                    )}
                                </FormControl>
                                <Button variant="contained" color="primary" component="label">
                                    上传图片
                                    <HiddenInput accept='image/*' type="file" onChange={handleImageUpload}/>
                                </Button>

                                    <ImageList style={{display:"flex",flexFlow:"wrap", gap: '16px'}}>
                                        {images.map((item,index)=>(
                                            <ImageListItem
                                                key={index}
                                                style={{height:'200px',width:'200px'}}
                                            >
                                                <img src={item} alt={index} style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }} />
                                                <ImageListItemBar position='bottom' actionIcon={
                                                    <IconButton onClick={()=>handleDelete(index)}>
                                                        <IconTrash size={40}/>
                                                    </IconButton>
                                                }></ImageListItemBar>
                                            </ImageListItem>
                                        ))}
                                    </ImageList>


                                <DialogActions>
                                    <Button onClick={handleClose}>取消</Button>
                                    <Button
                                        disableElevation
                                        disabled={loading}
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                    >
                                        提交
                                    </Button>
                                </DialogActions>
                            </form>
                        )}
                    </Formik>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}

export default FeedbackModal

EmailModal.PropTypes={
    open:PropTypes.bool,
    handleClose:PropTypes.func
}