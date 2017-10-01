export default function serverError(err, res) {
  return res.json({ errors: { form: err.message } })
}
