window.onload = function() {
var width = 800;
var height = 600;
var video = document.querySelector('video');
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;

[].slice.call(document.querySelectorAll('video, img, canvas')).forEach(function(node) {
  node.style.width = (node.width = width) + 'px';
  node.style.height = (node.height = height) + 'px';
});

function summarise_item(item) {
	let result = {};
  result.doi = item.DOI;
  result.authors = (item.author || []).length > 0 ? item.author[0].family : '';
  result.title = (item.title || []).join(' ');
  return result;
};

function get_publication_details(title) {
	return;
	if (title.length < 1) {
    return;
  }
	fetch('https://api.crossref.org/works?query='+encodeURIComponent(title)).then( response => response.json() ).then( json => {
  	console.log(json.message.items.map(summarise_item)[0]);
  });
};

function snapshot() {
  if(!localMediaStream) return;
  ctx.drawImage(video, 0, 0, width, height);
  //document.querySelector('img').src = canvas.toDataURL('image/webp');
  //document.querySelector('img').src
  Tesseract.recognize(video)
         .progress(function  (p) { document.getElementById('progress').textContent = parseInt(100*p.progress)+'%'  })
         .then(function (result) {
         		console.log('result', result);
            texts = result.lines.filter( line => line.confidence > 80).map( line => line.text ).join('\n').replace(/[\n\s]+/,' ');
            document.getElementById('detected').textContent = texts;
            get_publication_details(texts);
          })
}

function getUserMedia(options, success, error) {
  var getUserMedia = 'getUserMedia webkitGetUserMedia mozGetUserMedia msGetUserMedia oGetUserMedia'.split(' ').reduce(function(found, name) {
    return found || (typeof(navigator[name]) === 'function' && name);
  }, false);
  
  if(getUserMedia) return navigator[getUserMedia](options, success, error);
  
  throw new Error('This browser has no support to navigator.getUserMedia.');
}

function handleError() {
  document.body.innerHTML = 'There was an error, check the developer tools console';
  console.error(arguments);
}

try {
  getUserMedia({video: true}, function(stream) {
    var button = document.querySelector('button');
    button.style.display = 'block';
    button.onclick = snapshot;
    video.src = window.URL.createObjectURL(stream);
    localMediaStream = stream;
  }, handleError);
} catch(e) {
  handleError(e)
}
}