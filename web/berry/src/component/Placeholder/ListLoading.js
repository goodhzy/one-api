import React from "react";
import { BulletList } from "react-content-loader";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";

// 使用 sx 代替 makeStyles
const MyLoader = (props) => (
  <BulletList
    backgroundColor={props.dark ? "#333" : "#f5f6f7"}
    foregroundColor={props.dark ? "#636363" : "#eee"}
    className={props.className}
  />
);

function ListLoading() {
    const theme = useTheme();

    return (
      <Box
        sx={{
            width: "100%",
            // padding: 40,
            // [theme.breakpoints.down("md")]: {
            //     width: "100%",
            //     padding: 10
            // }
        }}
      >
          <MyLoader
            dark={theme.palette.mode === "dark"}
          />
      </Box>
    );
}

export default ListLoading;
