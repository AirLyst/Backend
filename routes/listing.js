import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import AWS from 'aws-sdk'

import Listing from '../models/listing'
import User from '../models/user'
// import each from 'promise-each'

const router = express.Router()


import Promise from 'bluebird'

var upload = multer()

const s3 = new AWS.S3()

router.post('/', upload.array('photos'), async (req, res) => {
  const { name, description, brand, condition, userId } = req.body
  let user = await User.findById(userId)
  if(user) {
    const newListing = {
      name,
      description,
      brand,
      condition,
      user // Put the user in the listing
    }

    let listing = await Listing.create(newListing)

    listing.photos = await Promise.all(req.files.map(async (image, key) => {
       const buffer = await sharp(image.buffer).resize(200, 200).toBuffer()
       await s3.putObject({ Body: buffer, Bucket: `gearhubbucket1/${user.id}/listings/${listing.id}`, Key: `photo${key}.png`}).promise()
       return `https://s3.amazonaws.com/gearhubbucket1/${user.id}/listings/${listing.id}/photo${key}.png`
    }));

    listing = await listing.save()
    user.listings.push(listing)
    await user.save()
    return res.json(listing)
  } else return res.status(403).json( { errors: 'Must be a registered user to post '}) // Only get here if front-end issue
})

export default router
