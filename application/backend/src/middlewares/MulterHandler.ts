import { Request, Response, NextFunction } from 'express'
import multer from 'multer'

// Configure Multer
const MulterInstance = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, false)
    }
    cb(null, true)
  },
})

export function uploadSingleFile(req: Request, res: Response, next: NextFunction): void {
  const uploadSingle = MulterInstance.single('file')

  uploadSingle(req, res, (error) => {
    if (error) {
      return next(error) // Pass the error to the error handler
    }
    next() // Proceed to the next middleware if file upload is successful
  })
}
