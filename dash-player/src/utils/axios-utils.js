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

export function getServerQuery ({
  endpoint,
  parameters = {}
}) {
  return new Promise((resolve, reject) => {
    axios
      .get(endpoint, {
        params: parameters
      })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        reject(error)
      })
  })
}
