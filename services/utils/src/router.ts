import express from 'express'
import cloudinary from 'cloudinary'
const router = express.Router()

router.post("/upload", async(req, res) => {
    try{
       const {buffer, pulic_id} = req.body;
    }
    
    catch(err){
        res.status(500).json({error: "Upload failed"})
    }
}
);

export default router  