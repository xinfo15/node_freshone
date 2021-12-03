const phpUrlParams = (str) => {
  const arr = str.split('/')

  console.log(arr)
  const res = {}
  for (let i = 0; i + 1 < arr.length; i += 2) {
    res[arr[i]] = arr[i + 1]
  }
  return res
}

module.exports = {
  phpUrlParams,
}
