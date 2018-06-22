'use strict';

var Counters = require('./counters.js');
var UrlEntries = require('./urlEntries.js');
var dns = require('dns');

function getCountAndIncrease (req, res, callback) {
  Counters.findOneAndUpdate({}, {$inc:{'count': 1}},(err, data) => {
      if (err) return;
      if (data) {
        callback(data.count);
      } else {
        var newCounter = new Counters();
        newCounter.save((err) => {
            if (err) return;
            Counters.findOneAndUpdate({}, {$inc:{'count': 1}},(err, data) => {
                if (err) return;
                callback(data.count);
              });
          });
      }
    });
}

var protocolRegExp = /^https?:\/\/(.*)/i;

var hostnameRegExp = /^([a-z0-9\-_]+\.)+[a-z0-9\-_]+/i;

exports.addUrl = function (req, res) {
  
    var url = req.body.url;
    
    if ( url.match(/\/$/i))
      url = url.slice(0,-1);
    
    var protocolMatch = url.match(protocolRegExp);
    if (!protocolMatch) {
      return res.json({"error": "invalid URL"});
    }
    
    var hostAndQuery = protocolMatch[1];

    var hostnameMatch = hostAndQuery.match(hostnameRegExp);
    if (hostnameMatch) {
      dns.lookup(hostnameMatch[0], (err) => {
        if(err) {
          res.json({"error": "invalid Hostname"});
        } else {
          UrlEntries.findOne({"url": url}, (err, storedUrl) => {
              if (err) return;
              if (storedUrl) {
                res.json({"original_url": url, "short_url": storedUrl.index});
              } else {
                getCountAndIncrease(req, res, (cnt) => {
                  var newUrlEntry = new UrlEntries({
                    'url': url,
                    'index': cnt
                  });
                  newUrlEntry.save((err) => {
                    if (err) return;
                    res.json({"original_url": url, "short_url": cnt});
                  });
                });
              }
            });
          }
        });
      } else {
        res.json({"error": "invalid URL"});
      }
    };

exports.processShortUrl = function (req, res) {
    var shurl = req.params.shurl;
    if (!parseInt(shurl,10)) {
      res.json({"error":"Wrong Format"});
      return;
    }
    UrlEntries.findOne({"index": shurl}, (err, data) => {
        if (err) return;
        if (data){
          res.redirect(data.url);
        } else {
          res.json({"error":"No short url found for given input"});
        }
      });
  };
