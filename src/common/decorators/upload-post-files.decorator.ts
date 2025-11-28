import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { uploadPostFilesInterceptor } from "../interceptors/upload-post-files.interceptor";

export function UploadPostFiles(fieldsConfig: any) {
    return applyDecorators(
        UseInterceptors(new uploadPostFilesInterceptor(fieldsConfig))
    );
    }