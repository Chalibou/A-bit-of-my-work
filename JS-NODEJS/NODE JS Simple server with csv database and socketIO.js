var http = require('http');  
var url = require('url');  
var fs = require('fs');
var qs = require('querystring');
var io = require('./node_modules/socket.io');

global.db;
//Load DB in server memory

global.db = JSON.parse(fs.readFileSync("./Ressources/db/database.json"));

//Save the current database in database-save
fs.copyFile("./Ressources/db/database.json", "./Ressources/db/database-save.json", (err) => {
    if (err) throw err;
});

//setTimeout(recordDb,240000);

function recordDb(){
    fs.writeFile("./Ressources/db/database.json", JSON.stringify(global.db), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
    //setTimeout(recordDb,240000);
}

//Start server

var server = http.createServer(function(request, response) {  
    
    var path = url.parse(request.url).pathname;
    switch (path.split('.')[1]) {  
    case '/':  
        response.writeHead(200, {  
            'Content-Type': 'text/plain'  
        });  
        response.write("Bienvenu chez moi !");  
        response.end();  
    break;  
    case 'html':  
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write(error);  
                response.end();  
            } else {  
                response.writeHead(200, {  
                    'Content-Type': 'text/html'  
                });  
                response.write(data);  
                response.end();  
            }  
        });  
    break; 
    case 'css':  
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write(error);  
                response.end();  
            } else {  
                response.writeHead(200, {  
                    'Content-Type': 'text/css'  
                });  
                response.write(data);  
                response.end();  
            }  
        });  
    break;
    case 'js':  
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write(error);  
                response.end();  
            } else {  
                response.writeHead(200, {  
                    'Content-Type': 'text/js'  
                });  
                response.write(data);  
                response.end();  
            }  
        });  
    break;
    case 'png':  
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write(error);  
                response.end();  
            } else {  
                response.writeHead(200, {  
                    'Content-Type': 'image/png'  
                });  
                response.write(data);  
                response.end();  
            }  
        });  
    break;
    case 'csv':  
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write(error);  
                response.end();  
            } else {  
                response.setHeader("Access-Control-Allow-Origin", "*");
                //Allows CORS request
                response.writeHead(200, {  
                    'Content-Type': 'text/html'  
                });
                response.write(data);  
                response.end();  
            }  
        });  
    break;
    case 'json'://To prepare DB change from CSV to JSON
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write(error);  
                response.end();  
            } else {  
                response.setHeader("Access-Control-Allow-Origin", "*");
                //Allows CORS request
                response.writeHead(200, {  
                    'Content-Type': 'text/html'  
                });
                response.write(JSON.stringify(data));  
                response.end();  
            }  
        });  
    break;
    //POST method management
    //response to post method is handled by the handlePostRequest function
    case 'post':
        var body = '';
        request.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
            //Data is within "body"
            //Format id "[Type of action]=[parameter]&[parameter]&[parameter]..."
        });
        request.on('end', () => {
            response.setHeader("Access-Control-Allow-Origin", "*");
            //Allows CORS request
            response.writeHead(200, {  
                'Content-Type': 'text/html'  
            });
            //Handle the body content
            response.write(handlePostRequest(body));  
            response.end(); 
        });
    break;
    default:  
        response.writeHead(404);  
        response.write("opps this doesn't exist - 404");  
        response.end();  
        break;  
    }
    
    function handlePostRequest(request){
        let response = "";
        console.log("NOUVELLE REQUETTE POST :::: " + request);
        //Format of response is :
        var reqType = request.split("=")[0]; //get;set;new;del
        var reqTargetType = request.split("=")[1]; //project;object;property
        var reqMessage = request.split("=")[2]; //Content of the message

        switch(reqType){
            case "get":
                switch(reqTargetType){
				case "data":
					//return specified data
					console.log(global.db.Data[reqMessage]);
					response = JSON.stringify(global.db.Data[reqMessage]);
				break;
				case "projects":
					//return all the projects
					response = JSON.stringify(global.db.projects);
				break;
				case "project-list":
					//return a list of all projects
					var list = [];
					for(proj in global.db.projects){
						list.push(proj);
					}
					response = JSON.stringify(list);
				break;
				case "project":
					//then reqMessage is just the name of the project
					response = JSON.stringify(global.db.projects[reqMessage]);
				break;
				case "objects":
					//then reqMessage is projName;ObjectName
					//if projName is "all" then return all instance of object
					var reqProjName = reqMessage.split(";")[0];
					var reqObjName = reqMessage.split(";")[1];
					if (reqProjName == "all"){
						//Return all instances from all projects
						var result = {};
						for(proj in global.db.projects){
							if(global.db.projects[proj].hasOwnProperty(reqObjName)){
								result = {...result,...global.db.projects[proj][reqObjName]};
							}
							response = JSON.stringify(result);
						}
					}else{
						//Return all instances from the project "reqProjName"
						if(global.db.projects[reqProjName].hasOwnProperty(reqObjName)){
							response = JSON.stringify(global.db.projects[reqProjName][reqObjName]);
						}
					}
				break;
				case "object":
					//Return one specific instance of an object
					var reqProjName = reqMessage.split(";")[0];
					var reqObjName = reqMessage.split(";")[1];
					var reqObjId = reqMessage.split(";")[2];
					response = JSON.stringify(global.db.projects[reqProjName][reqObjName][reqObjId]);
				break;
				case "parameter":
					//Return a specific value from an object parameter
					var reqProjName = reqMessage.split(";")[0];
					var reqObjName = reqMessage.split(";")[1];
					var reqObjId = reqMessage.split(";")[2];
					var reqObjParameter = reqMessage.split(";")[3];
					response = global.db.projects[reqProjName][reqObjName][reqObjId][reqObjParameter];
				break;
                }
            break;
            case "set":
			switch(reqTargetType){
				case "project":
					//then reqMessage is ProjName;ProjContent a Project object (string form)
					if(global.db.projects.hasOwnProperty(projName)){
						var projName = reqMessage.split(";")[0];
						var new_project = JSON.parse(reqMessage.split(";")[1]);
						global.db.projects[projName] = new_project;
					}
				break;
				case "object":
					//set one specific instance of an object
					var reqProjName = reqMessage.split(";")[0];
					var reqObjName = reqMessage.split(";")[1];
					var reqObjId = reqMessage.split(";")[2];
					var reqObjContent = JSON.parse(reqMessage.split(";")[3]);
					if(global.db.projects[reqProjName][reqObjName].hasOwnProperty(reqObjId)){
						global.db.projects[reqProjName][reqObjName][reqObjId] = reqObjContent;
					}
				break;
				case "parameter":
					//set a specific value from an object parameter
					var reqProjName = reqMessage.split(";")[0];
					var reqObjName = reqMessage.split(";")[1];
					var reqObjId = reqMessage.split(";")[2];
					var reqObjParameter = reqMessage.split(";")[3];
					var reqObjContent = reqMessage.split(";")[4];
					if(global.db.projects[reqProjName][reqObjName][reqObjId].hasOwnProperty(reqObjParameter)){
						global.db.projects[reqProjName][reqObjName][reqObjId][reqObjParameter] = reqObjContent;
					}
				break;
			}
            break;	
            case "new":
			switch(reqTargetType){
				case "data":
					//then reqMessage is ProjName;ProjContent a Project object (string form)
					global.db.data[reqMessage] = [];
				break;
				case "project":
					//then reqMessage is ProjName;ProjContent a Project object (string form)
					var projName = reqMessage.split(";")[0];
					var new_project = JSON.parse(reqMessage.split(";")[1]);
					global.db.projects[projName] = new_project;
				break;
				case "object":
					//create one specific instance of an object
						var reqProjName = reqMessage.split(";")[0];
						var reqObjName = reqMessage.split(";")[1];
						var reqObjContent = JSON.parse(reqMessage.split(";")[2]);
						global.db.projects[reqProjName][reqObjName][reqObjContent.id] = reqObjContent;
				break;
			}
            break;
            case "del":
			switch(reqTargetType){
                case "data":
					//then reqMessage is ProjName;ProjContent a Project object (string form)
					delete global.db.data[reqMessage];
				break;
				case "project":
					//then reqMessage is ProjName;ProjContent a Project object (string form)
					delete global.db.projects[reqMessage];
				break;
				case "object":
					//create one specific instance of an object
						var reqProjName = reqMessage.split(";")[0];
						var reqObjName = reqMessage.split(";")[1];
						var reqObjId = reqMessage.split(";")[2];
						delete global.db.projects[reqProjName][reqObjName][reqObjId];
				break;
			}
            break;
        }
        return response;
    }
});

var allClients = [];
// Chargement de socket.io
io = io.listen(server);
// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    console.log('Nouvelle connexion de : ' + socket.handshake.address);
    allClients.push(socket);
    socket.on('message', function (message) {
        console.log("Message client : " + message);
    });
    socket.on('refresh', function (message) {
        console.log("Refresh : " + message);
        socket.broadcast.emit('refresh',message);
    });
    socket.on('disconnect', function () {
        console.log('Log out de : ' + socket.handshake.address);
        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
	});
	socket.on('saveDb', function (message) {
        recordDb();
    });
});

server.listen(8080); 



//###Server methods###

//###---Random hexa picker---###
// Picks a random hexa number on 4 digits
function getRandomHexa() {
  var letters = '0123456789ABCDEF';
  var value = '';
  for (var i = 0; i < 4; i++) {
    value += letters[Math.floor(Math.random() * 16)];
  }
  return value;
}
