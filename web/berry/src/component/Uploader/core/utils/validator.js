import { FileValidateError } from "../errors";

// Validators
const checkers = [
    function checkExt(file, policy) {
        if (policy.allowedSuffix && policy.allowedSuffix.length > 0) {
            const ext = file?.name.split(".").pop();
            if (ext === null || !ext || !policy.allowedSuffix.includes(ext)) {
                throw new FileValidateError(
                  "File suffix not allowed in policy.",
                  "suffix",
                  policy
                );
            }
        }
    },

    function checkSize(file, policy) {
        if (policy.maxSize > 0) {
            if (file.size > policy.maxSize) {
                throw new FileValidateError(
                  "File size exceeds maximum limit.",
                  "size",
                  policy
                );
            }
        }
    },
];

/* Execute each Validator
   Returns Error on failure
 */
export function validate(file, policy) {
    checkers.forEach((c) => c(file, policy));
}
