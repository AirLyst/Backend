import Validator from 'validator'

export default function validateInput(data) {
  const errors = {}
  let isValid = true

  if (Validator.isEmpty(data.username)) {
    errors.username = 'This field is required'
  }
  if (Validator.isEmpty(data.password)) {
    errors.password = 'This field is required'
  }

  if (errors.password || errors.username) {
    isValid = false
  }

  return {
    errors,
    isValid
  }
}
