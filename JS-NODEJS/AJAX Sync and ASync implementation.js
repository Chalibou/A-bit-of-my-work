//###---Request server object---###
// Perform AJAX GET request
function httpAsyncGet(theUrl){
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      /*xhr.onreadystatechange = function(){
        console.log(xhr.readyState);
      }*/
      xhr.onload = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            //console.log('Recupération reussie');
            resolve(xhr.response)
          } else {
            reject(xhr.status)
          }
        }
      }
      xhr.ontimeout = function () {
        console.log('xhr timeout');
        reject('timeout');
      }
      //url must be absolute !
      xhr.open('GET', theUrl, true);
      xhr.send();
    })
  }
  // Perform AJAX POST request
  function httpAsyncPost(message){
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      /*xhr.onreadystatechange = function(){
        console.log(xhr.readyState);
      }*/
      xhr.onload = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            //console.log('Message reçu');
            resolve(xhr.response);
          } else {
            reject(xhr.status);
          }
        }
      }
      xhr.ontimeout = function () {
        console.log('xhr timeout');
        reject('timeout');
      }
      xhr.open('POST', "http://10.12.200.65:8080/post.post", true);
      xhr.send(message);
    })
  }

  