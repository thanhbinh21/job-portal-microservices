import multer from 'multer'

const storage = multer.memoryStorage();

const uploadFile = multer({ storage: storage }).single('file');

export default uploadFile;