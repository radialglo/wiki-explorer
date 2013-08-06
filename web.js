
var express = require('express'),
    app = express(),
    qs = require('querystring')
    http = require('http');

var WIKI = {
   // english
   // http://stackoverflow.com/questions/9580226/nodejs-httprequest-with-data-getting-error-getaddrinfo-enoent?lq=1
   host: 'en.wikipedia.org',
   endpoint: '/w/api.php?',
   file_endpoint: '/wiki/',
   actions: {
     QUERY: 'query'
   },
   list: {
     GEOSEARCH: 'geosearch'
   }
};

app.use(express.logger());
app.use(express.static(__dirname + '/public'));
app.get('/', function(request, response) {
});


// change route
app.get('/test', function(request, response) {
  //response.send('Hello World!');
  // TODO: set user agent for wikipedia
  var geo_params = qs.stringify({
    action : WIKI.actions.QUERY,
    format: 'json',
    list: WIKI.list.GEOSEARCH,
    // lat , lon
    gscoord: '37.776115|-122.412768',
    // search radius in meters
    // max is 10,000
    gsradius: '10000',
    // max number of pages to return
    // beware that exlimit is 20 
    gslimit: '100',
    // additional coordinate properties to return
    gsprop: ['type','name','dim','country','region','globe'].join('|')

  });

  var img_params = {
      action : WIKI.actions.QUERY,
      format: 'json',
      prop: 'images',
      imlimit: '500' 
  };

  var options = {
      host: WIKI.host,
      port: 80,
      path: WIKI.endpoint + geo_params,
      method: 'GET'
  // TODO: set user agent for wikipedia
  }

  var img_info_params = {
      action : WIKI.actions.QUERY,
      format: 'json',
      prop: 'imageinfo',
      iilimit: '500', 
      iiprop: ['url','size','dimensions'].join('|')
  };

 console.log(options);

  var req = http.request(options, function(res) {
    console.log('Recieved response');
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      //console.log('BODY: ' + chunk);
      //TODO move handler to on end
      var data = JSON.parse(chunk).query.geosearch;
      //console.log(data);
      var pageids = [],
          length = data.length;
      for(var i = 0; i < length; i++) {
        var result = data[i];
        pageids.push(result.pageid);
      }

      console.log(pageids.join("|"));
      // now make request for images
      img_params.pageids = pageids.join("|");
      img_params = qs.stringify(img_params);
      var img_options = {
          host: WIKI.host,
          port: 80,
          path: WIKI.endpoint + img_params,
          method: 'GET'
      // TODO: set user agent for wikipedia
      };
      // query images names;
      var req_2 = http.request(img_options, function(res) {
        var body = '';
        res.on('data', function (chunk) {
          console.log('RESPONSE 2');
          body += chunk;
        });
        res.on('end', function () {
          var response_body = '';
          var data = JSON.parse(body).query.pages;
              console.log('BODY: ' + body);

          var files = [];
          for(var page in data) {

            if(data.hasOwnProperty(page)) {
              var images = data[page].images,
                  length = (images && images.length) ? images.length : 0;
              //for(var i = 0; i < length; i++) {
                 //console.log(images[i]);
              if(length > 0) {
                 files.push(images[0].title);
               }
                 //response_body += '<img src="http://' + WIKI.host + WIKI.file_endpoint + images[i].title +'">';
              //}

            }
          }

          //response.send(response_body);
          console.log(files.length);
          img_info_params.titles = files.join("|");
          img_info_params = qs.stringify(img_info_params);

          //response.send("Hello World")
          var img_info_options = {
              host: WIKI.host,
              port: 80,
              path: WIKI.endpoint + img_info_params,
              method: 'GET'
          // TODO: set user agent for wikipedia
          };


          console.log("Done with images");
            var req_3 = http.request(img_info_options, function(res) {
              var body = '';
              res.on('data', function (chunk) {
                console.log('RESPONSE 2');
                body += chunk;
              });
              res.on('end', function () {
                var response_body = '<html><head><style type="text/css">img {width: 200px;}</style></head>';
                var data = JSON.parse(body).query.pages;
                    console.log('BODY: ' + body);
                for(var page in data) {

                  if(data.hasOwnProperty(page)) {
                    var images = data[page].imageinfo,
                        length = (images && images.length) ? images.length : 0;
                    //for(var i = 0; i < length; i++) {
                       //console.log(images[i]);
                       if(length > 0) {
                          //files.push(images[0].title);
                          response_body += '<img src="' + images[0].url +'">';
                       }
                    //}

                  }
                }

                //response.send(response_body);
                response_body += '</body></html>';
                response.send(response_body);

                console.log("Done with image info");
              })
            });
            req_3.end();
        })
      });
      req_2.end();
    }); //finish request

  }).on('error',function(e){
   console.log("Error: \n" + e.message); 
   console.log( e.stack );
  });
  // close request
  req.end();


});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
