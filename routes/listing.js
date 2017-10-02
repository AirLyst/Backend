import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import AWS from 'aws-sdk'

import Listing from '../models/listing'
import User from '../models/user'

const router = express.Router()

var upload = multer()

const s3 = new AWS.S3()

router.post('/', upload.array('photos'), (req, res) => {
  const { name, description, brand, condition, userId } = req.body
  User.findById(userId)
  .then(user => {
    if(user) {
      const newListing = {
        name,
        description,
        brand,
        condition,
        user // Put the user in the listing
      }
      Listing.create(newListing)
      .then(listing => {
       const promiseMap = req.files.map((image, key) => {
         return new Promise((resolve, reject) => {
           sharp(image.buffer).resize(200, 200).toBuffer().then(data => {
             const params = { Body: data, Bucket: `gearhubbucket1/${listing.id}`, Key: `photo${key}.png`}
             s3.putObject(params, (err, data) => {
               if(err){
                 res.send(err)
                 reject(err)
               }
               else {
                 listing.photos.push(`https://s3.amazonaws.com/gearhubbucket1/${listing.id}/photo${key}.png`)
                 resolve('worked')
               }
             })
           })
         })
       })

       Promise.all(promiseMap)
       .then(arrOfResolved => {
         listing.save((err, listing) => {
           user.listings.push(listing)
           user.save((err, user) => {
             return res.json(listing)
           })
         })
       })

      })
      .catch(err => { return res.status(500).json( { errors: { form: 'Server Error listing' } } ) }) // Error in creation
    } else
      return res.status(403).json( { errors: 'Must be a registered user to post '}) // Only get here if front-end issue
  })
  .catch(err => { return res.status(500).json( { errors: { form: 'Server Error user' } } ) }) // Error in lookup
})

export default router
