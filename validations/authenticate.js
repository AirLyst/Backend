import jwt from 'jsonwebtoken'

export default function secureRoutes(req, res, next) {
  const header = req.headers.authorization
  let token
  if (header) token = header.split(' ')[1]
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (err) return res.status(401).json({ errors: 'Failed to authenticate' })
      return next()
    })
  } else res.status(403).json({ errors: 'No tokens specified' })
}
