let compare = (a, b) => {
  if (a.freq >= b.freq) {
    return -1
  }
  else return 1
}

exports.compare = (a, b) => {
  if (a.freq >= b.freq) {
    return -1
  }
  else return 1
}

exports.mongoSearch = async (collection, obj) => {
  let query = obj.query;
  let qArry = query.split(' ');
  let urls = [];
  console.log(qArry)
  for (let i = 0; i < qArry.length; i++) {
    let result = await collection.findOne({ "keyword": qArry[i].toLowerCase() })
    if (result === null) continue;
    let tempUrls = new Map()
    for (let urlIdx = 0; urlIdx < result.url.length; urlIdx++) {
      tempUrls[result.url[urlIdx].address] = result.url[urlIdx].freq;
    }
    for (let idx = 0; idx < urls.length; idx++) {
      if (tempUrls.has(urls[idx].address)) {
        if (urls[idx].freq > tempUrls[urls[idx].address]) {
          urls[idx].freq = tempUrls[urls[idx].address]
        }
        tempUrls.delete(urls[idx].address)
      }
      else {
        urls[idx].freq = 0;
      }
    }
    for (let [key, value] of Object.entries(tempUrls)) {
      urls.push({ "address": key, "freq": value })
    }
  }
  urls.sort(compare)
  console.log(urls)
  return urls
}