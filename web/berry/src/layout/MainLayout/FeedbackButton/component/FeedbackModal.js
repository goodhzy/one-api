import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    OutlinedInput,
    Button,
    InputLabel,
    Grid,
    InputAdornment,
    FormControl,
    FormHelperText,
} from "@mui/material";
import { Formik } from "formik";
import { showError, showSuccess } from "utils/common";
import { useTheme } from "@mui/material/styles";
import * as Yup from "yup";
import { API } from "utils/api";
import EmailModal from "../../../../views/Profile/component/EmailModal";

const validationSchema = Yup.object().shape({
    title: Yup.string().required("标题不能为空"),
    content: Yup.string().required("内容不能为空"),
});

const FeedbackModal = ({open,handleClose})=>{
    const theme = useTheme();
    const [loading, setLoading] = useState(false);


    const submit = async (values, { setErrors, setStatus, setSubmitting }) => {
        setLoading(true);
        setSubmitting(true);
        const res = await API.post(
            `/api/feedback`,{
                title:values.title,
                content:values.content
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