const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 100 });

const cache = (duration) => {
  return (req, res, next) => {
    const key = '__express-cache__' + req.originalUrl || req.url;

    //1: Check if cache exists
    const cachedRes = myCache.get(key);

    //2a) Cache exists, return cached response
    if (cachedRes) {
      console.log(typeof cachedRes);
      return res.send(cachedRes);
    }

    //2b) Cache doesn't exist. Setup res.send so it will cache response

    res.sendResponse = res.send;
    res.send = (body) => {
      //res.send gets called twice if body is json. First time around it serializes json then calls itself.
      //To prevent cache running twice (and caching serialized version), using res.locals to keep track.
      if (!res.locals.isCached) {
        myCache.set(key, body, duration);
        res.locals.isCached = true;
      }
      res.sendResponse(body);
    };

    //3: Call next middleware to continue on the request as normal.
    next();
  };
};

module.exports = cache;
