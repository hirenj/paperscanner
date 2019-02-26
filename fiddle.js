window.onload = function() {
var width = 600;
var height = 800;
var video = document.querySelector('video');
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;

var scriptid = 'GOOGLESCRIPTID';

var searchParams = new URLSearchParams(window.location.search);

scriptid = searchParams.get('scriptid');

var scriptURL = 'https://script.google.com/macros/s/'+scriptid+'/exec';

const form = document.forms['accept_paper']

form.addEventListener('submit', e => {
  e.preventDefault();
  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => console.log('Success!', response))
    .catch(error => console.error('Error!', error.message))
});


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
	if (title.length < 1) {
    document.getElementById('progress').textContent = 'No title detected';
    return;
  }
  console.log(title);
	fetch('https://api.crossref.org/works?query='+encodeURIComponent(title)).then( response => response.json() ).then( json => {
  	console.log(json.message.items.map(summarise_item)[0]);
    document.getElementById('doi').value = json.message.items.map(summarise_item)[0].doi;
    document.getElementById('title').value = json.message.items.map(summarise_item)[0].title;
  });
};

function snapshot() {
  if(!localMediaStream) return;
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  Tesseract.recognize(video)
         .progress(function  (p) { if (p.status !== 'recognizing text') { return; } document.getElementById('progress').textContent = parseInt(100*p.progress)+'%'  })
         .then(function (result) {
            document.getElementById('progress').textContent = '';
         		console.log('result', result);
            texts = result.lines.filter( line => line.confidence > 80).map( line => line.text ).join('\n').replace(/[\n\s]+/,' ');
            document.getElementById('detected').textContent = texts;
            get_publication_details(texts);
          })
}

function handleError() {
  document.body.innerHTML = 'There was an error, check the developer tools console';
  console.error(arguments);
}

function gotStream(stream) {
  var button = document.querySelector('button.scan');
  button.style.display = 'block';
  button.onclick = snapshot;
  video.srcObject = stream;
  video.onloadedmetadata = function(e) {
    canvas.style.height = video.videoHeight;
    canvas.style.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    video.width = video.videoWidth;
    video.height = video.videoHeight;
    video.style.width = video.videoWidth;
    video.style.height = video.videoHeight;
  };
  localMediaStream = stream;
}

function gotDevices(results) {
  var device;
  var videos = results.filter( res => res.kind == 'videoinput');
  try {
    navigator.mediaDevices.getUserMedia({video: { deviceId: { exact: videos[0].deviceId } }}).then(gotStream).catch(handleError);
  } catch(e) {
    handleError(e)
  }
}

navigator.mediaDevices
  .enumerateDevices()
  .then(gotDevices)
  .catch(handleError);

};
