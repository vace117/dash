import axios from 'axios'

export function postServerQuery ({
  restEndpoint,
  query,
  contentType              = 'application/json'
}) {
  return new Promise((resolve, reject) => {
    axios
      .post(restEndpoint, query, {
        headers: { 'Content-Type': contentType }
      })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        reject(error)
      })
  })
}
