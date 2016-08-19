var Adapter, EnterMessage, EventEmitter, HTTPS, LeaveMessage, Response, Robot, TextMessage, Twitter, TwitterStreaming, oauth, ref,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  slice = [].slice;

ref = require('hubot'), Robot = ref.Robot, Adapter = ref.Adapter, TextMessage = ref.TextMessage, EnterMessage = ref.EnterMessage, LeaveMessage = ref.LeaveMessage, Response = ref.Response;

HTTPS = require('https');

EventEmitter = require('events').EventEmitter;

oauth = require('oauth');

Twitter = (function(superClass) {
  extend(Twitter, superClass);

  function Twitter() {
    return Twitter.__super__.constructor.apply(this, arguments);
  }

  Twitter.prototype.send = function() {
    var strings, user;
    user = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    console.log("Sending strings to user: " + user.screen_name);
    return strings.forEach((function(_this) {
      return function(str) {
        var text, tweetsText;
        text = str;
        tweetsText = str.split('\n');
        return tweetsText.forEach(function(tweetText) {
          return _this.bot.send(user.user.user, tweetText, user.user.status_id);
        });
      };
    })(this));
  };

  Twitter.prototype.reply = function() {
    var strings, user;
    user = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    console.log("Replying");
    return strings.forEach((function(_this) {
      return function(text) {
        return _this.bot.send(user, text);
      };
    })(this));
  };

  Twitter.prototype.command = function() {
    var command, ref1, strings;
    command = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    console.log("Command" + command);
    return (ref1 = this.bot).send.apply(ref1, [command].concat(slice.call(strings)));
  };

  Twitter.prototype.run = function() {
    var bot, options, self;
    self = this;
    options = {
      key: process.env.HUBOT_TWITTER_KEY,
      secret: process.env.HUBOT_TWITTER_SECRET,
      token: process.env.HUBOT_TWITTER_TOKEN,
      tokensecret: process.env.HUBOT_TWITTER_TOKEN_SECRET
    };
    bot = new TwitterStreaming(options);
    this.x = 0;
    bot.tweet(self.robot.name, function(data, err) {
      var msg, reg, tmsg;
      self.x += 1;
      reg = new RegExp('@' + self.robot.name, 'i');
      console.log("received " + data.text + " from " + data.user.screen_name);
      msg = data.text.replace(reg, self.robot.name);
      tmsg = new TextMessage({
        user: data.user.screen_name,
        status_id: data.id_str
      }, msg);
      self.receive(tmsg);
      if (err) {
        return console.log("received error: " + err);
      }
    });
    this.bot = bot;
    return self.emit("connected");
  };

  return Twitter;

})(Adapter);

exports.use = function(robot) {
  return new Twitter(robot);
};

TwitterStreaming = (function(superClass) {
  var self;

  extend(TwitterStreaming, superClass);

  self = TwitterStreaming;

  function TwitterStreaming(options) {
    if ((options.token != null) && (options.secret != null) && (options.key != null) && (options.tokensecret != null)) {
      this.token = options.token;
      this.secret = options.secret;
      this.key = options.key;
      this.domain = 'stream.twitter.com';
      this.tokensecret = options.tokensecret;
      this.consumer = new oauth.OAuth("https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token", this.key, this.secret, "1.0A", "", "HMAC-SHA1");
    } else {
      throw new Error("Not enough parameters provided. I need a key, a secret, a token, a secret token");
    }
  }

  TwitterStreaming.prototype.tweet = function(track, callback) {
    return this.post("/1.1/statuses/filter.json?track=" + track, '', callback);
  };

  TwitterStreaming.prototype.send = function(user, tweetText, in_reply_to_status_id) {
    console.log(user.user.user);
    in_reply_to_status_id = user.user.status_id;
    console.log(in_reply_to_status_id);
    console.log("send twitt to " + user.user.user + " with text " + tweetText);
    return this.consumer.post("https://api.twitter.com/1.1/statuses/update.json", this.token, this.tokensecret, {
      status: "@" + user.user.user + " " + tweetText,
      in_reply_to_status_id: in_reply_to_status_id
    }, 'UTF-8', function(error, data, response) {
      if (error) {
        console.log("twitter send error: " + error + " " + data);
      }
      return console.log("Status " + response.statusCode);
    });
  };

  TwitterStreaming.prototype.get = function(path, callback) {
    return this.request("GET", path, null, callback);
  };

  TwitterStreaming.prototype.post = function(path, body, callback) {
    return this.request("POST", path, body, callback);
  };

  TwitterStreaming.prototype.request = function(method, path, body, callback) {
    var parseResponse, request;
    console.log("https://" + this.domain + path + ", " + this.token + ", " + this.tokensecret + ", null");
    request = this.consumer.get("https://" + this.domain + path, this.token, this.tokensecret, null);
    request.on("response", function(response) {
      response.on("data", function(chunk) {
        return parseResponse(chunk + '', callback);
      });
      response.on("end", function(data) {
        return console.log('end request');
      });
      return response.on("error", function(data) {
        return console.log('error ' + data);
      });
    });
    request.end();
    return parseResponse = function(data, callback) {
      var err, index, json, results;
      results = [];
      while ((index = data.indexOf('\r\n')) > -1) {
        json = data.slice(0, index);
        data = data.slice(index + 2);
        if (json.length > 0) {
          try {
            console.log(json);
            console.log(JSON.parse(json));
            results.push(callback(JSON.parse(json), null));
          } catch (_error) {
            err = _error;
            results.push(console.log(err));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
  };

  return TwitterStreaming;

})(EventEmitter);
