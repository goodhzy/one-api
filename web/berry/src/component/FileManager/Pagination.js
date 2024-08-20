import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "@mui/material/Pagination";
import { setPagination } from "../../store/viewUpdate/action";
import AutoHidden from "../Dial/AutoHidden";
import statusHelper from "../../utils/page";
import { useLocation } from "react-router-dom";
import CustomPaginationItem from "./PaginationItem";

export default function PaginationFooter() {
    const dispatch = useDispatch();
    const files = useSelector((state) => state.explorer.fileList);
    const folders = useSelector((state) => state.explorer.dirList);
    const pagination = useSelector((state) => state.viewUpdate.pagination);
    const loading = useSelector((state) => state.viewUpdate.navigatorLoading);
    const location = useLocation();

    const SetPagination = useCallback((p) => dispatch(setPagination(p)), [
        dispatch,
    ]);

    const handleChange = (event, value) => {
        SetPagination({ ...pagination, page: value });
    };

    const count = useMemo(
      () => Math.ceil((files.length + folders.length) / pagination.size),
      [files, folders, pagination.size]
    );

    const isMobile = statusHelper.isMobile();
    const isSharePage = statusHelper.isSharePage(location.pathname);

    if (count > 1 && !loading) {
        return (
          <>
              {!isMobile && !isSharePage && (
                <div style={{ marginTop: 80 }} />
              )}
              <AutoHidden
                enable
                element={
                    isMobile || isSharePage
                      ? null
                      : document.querySelector("#explorer-container")
                }
              >
                  <div
                    style={{
                        position: "fixed",
                        bottom: 23,
                        background: "#fff",
                        borderRadius: 24,
                        boxShadow:
                          "0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12)",
                        padding: "8px 4px",
                        marginLeft: 20,
                    }}
                  >
                      <Pagination
                        renderItem={(item) => (
                          <CustomPaginationItem
                            count={count}
                            isMobile={isMobile}
                            {...item}
                          />
                        )}
                        color="secondary"
                        count={count}
                        page={pagination.page}
                        onChange={handleChange}
                      />
                  </div>
              </AutoHidden>
          </>
        );
    }
    return <div></div>;
}
