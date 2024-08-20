import axios from "axios";
import {
  HTTPError,
  RequestCanceledError,
  TransformResponseError,
} from "../errors";

export const { CancelToken } = axios;
export { CancelTokenSource } from "axios";

const baseConfig = {
  transformResponse: [
    (response) => {
      try {
        return JSON.parse(response);
      } catch (e) {
        throw new TransformResponseError(response, e);
      }
    },
  ],
};

const cdBackendConfig = {
  ...baseConfig,
  baseURL: "/api/v3",
  withCredentials: true,
};

export function request(url, config) {
  return axios
    .request({ ...baseConfig, ...config, url })
    .catch((err) => {
      if (axios.isCancel(err)) {
        throw new RequestCanceledError();
      }

      if (err instanceof TransformResponseError) {
        throw err;
      }

      throw new HTTPError(err, url);
    });
}

export function requestAPI(url, config) {
  return request(url, { ...cdBackendConfig, ...config });
}
