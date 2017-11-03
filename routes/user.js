// Node Modules
import express from 'express'
import sharp from 'sharp'
import AWS from 'aws-sdk'

// Models
import User from '../models/user'

// Setup express router, AWS
const router = express.Router()
const s3 = new AWS.S3()

router.put('/:id/profile_picture', async (req, res) => {
  const { image } = req.body 
  const user = await User.findById(req.params.id)
  if (user) {
    const buffer = new Buffer(image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const compressedImage = await sharp(buffer).resize(500).toBuffer()
    const uploaded = await s3.putObject({
      Body: compressedImage,
      ContentEncoding: 'base64',
      Bucket: `gearhubbucket1/${user.id}`,
      Key: 'profile_picture.png',
      ACL: 'public-read'
    }).promise().catch(err => res.send({ errors: 'Failed to save profile pic' }))
    
    if (uploaded) {
      user.profile_picture = `https://s3.amazonaws.com/gearhubbucket1/${user.id}/profile_picture.png`
      await user.save()
      return res.send({ data: 'Profile picture saved' })
    }
  }
})

export default router