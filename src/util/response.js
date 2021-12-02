const SUCCESS = 0
const COMMEN_ERROR = 1
const MISSING_PARAM = 2
const MISSING_TOKEN = 3

const success = (data = [], msg = 'success') => {
  return {
    code: SUCCESS,
    msg,
    data,
  }
}

const error = (code = COMMEN_ERROR, msg = 'error') => {
  return {
    code,
    msg,
    data: [],
  }
}

module.exports = {
  COMMEN_ERROR,
  MISSING_PARAM,
  MISSING_TOKEN,
  success,
  error,
}
