import { setOptionModal } from "../viewUpdate/action";
import i18next from "../../i18n";

export const askForOption = (options, title) => {
  return async (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      const dialog = {
        open: true,
        title: title,
        options: options,
      };
      dispatch(
        setOptionModal({
          ...dialog,
          onClose: () => {
            dispatch(setOptionModal({ ...dialog, open: false }));
            reject(i18next.t("fileManager.userDenied"));
          },
          callback: (option) => {
            resolve(option);
            dispatch(setOptionModal({ ...dialog, open: false }));
          },
        })
      );
    });
  };
};
