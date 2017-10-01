import axios from 'axios'

export async function validateGoogle(token) {
  const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
  const response = await axios.get(url)
  return response
}

export async function validateFacebook(token) {
  const url = `https://graph.facebook.com/me?access_token=${token}`
  const response = await axios.get(url)
  return response
}
