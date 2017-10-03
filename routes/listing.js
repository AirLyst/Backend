import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import AWS from 'aws-sdk'
import moment from 'moment'
import Promise from 'bluebird'

import Listing from '../models/listing'
import User from '../models/user'

const router = express.Router()

const upload = multer()

const s3 = new AWS.S3()

router.post('/', upload.array('photos'), async (req, res) => {
  const { name, description, brand, condition, size, category, price, userId } = req.body
  const photoDescription = JSON.parse(req.body.photoDescription)

  const user = await User.findById(userId)
  if (user) {
    const newListing = {
      name,
      description,
      photoDescription,
      brand,
      condition,
      size,
      price,
      category,
      user // Put the user in the listing
    }

    let listing = await Listing.create(newListing)

    listing.photos = await Promise.all(req.files.map(async (image, key) => {
      const buffer = await sharp(image.buffer).resize(200, 200).toBuffer()
      await s3.putObject({
        Body: buffer,
        Bucket: `gearhubbucket1/${user.id}/listings/${listing.id}`,
        Key: `photo${key}.png`,
        ACL: 'public-read'
      }).promise()
      return `https://s3.amazonaws.com/gearhubbucket1/${user.id}/listings/${listing.id}/photo${key}.png`
    }))
    listing = await listing.save()
    user.listings.push(listing)
    await user.save()
    return res.json(listing)
  }
  return res.status(403).json({ errors: 'Must be a registered user to post' }) // Only get here if front-end issue
})

router.post('/recents', async (req, res) => {
  const { quantity } = req.body
  const lastDay = moment().subtract(24, 'hours').toDate()
  const listings = await Listing.find({ createdAt: { $gte: lastDay } })

  if (listings) {
    if (!quantity || quantity.length > listings.length) {
      res.send(listings.slice(listings.length - 12, listings.length))
    } else res.send(listings.slice(listings.length - quantity))
  }
})

router.post('/id', async (req, res) => {
  const { _id } = req.body
  if (_id) {
    const listing = await Listing.findOne({ _id })
    return res.send(listing)
  }
  return res.status(500).json({ errors: { form: 'Invalid listing ID' } })
})

export default router
