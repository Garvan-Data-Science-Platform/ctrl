import { Request, Response, NextFunction } from 'express'
import { FileUploadError } from './ErrorHandler'

// tsoa reads request.files[name] without checking request.files, which multer only sets for a
// multipart body, so an upload without one used to crash inside tsoa. Every upload endpoint names
// its field `file`, so reject a request without it before tsoa runs.
export function requireFile(req: Request, _res: Response, next: NextFunction) {
  const files = req.files
  if (!files || Array.isArray(files) || !files.file?.length) {
    return next(new FileUploadError('No file uploaded'))
  }
  next()
}
