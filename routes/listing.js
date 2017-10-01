import express from 'express'
import multer from 'multer'
import sharp from 'sharp'
import AWS from 'aws-sdk'
import moment from 'moment'

import Listing from '../models/listing'
import User from '../models/user'

const router = express.Router()

var upload = multer()

const s3 = new AWS.S3()

router.post('/recents', (req, res) => {
  const { quantity } = req.body
  const lastDay = moment().subtract(24, 'hours').toDate()
  Listing.find({ "createdAt": { "$gte": lastDay} })
  .then(data => {
    if(!quantity || quantity.length > data.length)
      res.send(data.slice(data.length - 12, data.length))
    else
      res.send(data.slice(data.length - quantity, data.length))
  })
  .catch(err => {
    res.send({ error: `DB Error: ${err.message}`})
  })
})

router.post('/id', (req, res) => {
  const { id } = req.body
  if(id){
    Listing.find({ "_id": id})
    .then(data => res.send(data[0]))
  } else {
    return res.status(500).json( { errors: { form: 'Invalid listing ID' } } )
  }
})

router.post('/', upload.array('photos'), (req, res) => {
  let parsedData = JSON.parse(req.body.data)
  parsedData.photoDescription = JSON.parse(parsedData.photoDescription)
  const { 
    name, 
    description, 
    photoDescription,
    brand, 
    condition, 
    userId, 
    photos, 
    size, 
    category, 
    price } = parsedData
  console.log(parsedData)
  User.findById(userId)
  .then(user => {
    if(user) {
      const newListing = {
        name,
        description,
        brand,
        condition,
        size,
        category,
        price,
        user, // Put the user in the listing
      }
      Listing.create(newListing)
      .then(listing => {
       const promiseMap = req.files.map((image, key) => {
         return new Promise((resolve, reject) => {
           sharp(image.buffer).resize(400).toBuffer().then(data => {
             const params = { 
              Body: data,
              Bucket: `gearhubbucket1/${listing.id}`, 
              Key: `photo${key}.png`,
              ACL: 'public-read'
            }
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
