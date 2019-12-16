//###---ArrayToTable---###
// Convert an input Array into an HTML table
async function createTable(tableID,destination,canAddRemove,canEdit,hide) {
    //get data from server
    var tableData = CSVToArray(await httpAsyncPost('req='+ tableID))
    var table = document.createElement('table');
    table.setAttribute("class","genTable");
    table.setAttribute("id",tableID);
    var tableBody = document.createElement('tbody');
    for(var i = 0; i<tableData.length;i++){
      if(tableData[i][2]=='T'){
        var row = document.createElement('tr');
        row.setAttribute("class","genTr");
        for(var j = 3;j<tableData[i].length;j++){
          var leave = false;
          //Handle the "hide"
          if (typeof(hide) !=='undefined'){
            for (k=0;k<hide.length;k++){
              if(j==hide[k]+3){
                leave=true;
              }
            }
          }
          if (leave==true){
            continue;
          }
          var header = document.createElement('th');
          header.setAttribute("class","genTh");
          header.setAttribute("id",tableData[i][1] + ":" + tableData[i][0] + ':' + j);
          header.appendChild(document.createTextNode(tableData[i][j]));
          row.appendChild(header);
        }
        if (canAddRemove == true){
          //Button for adding a column
          var btn_new_col = document.createElement('button');
          btn_new_col.innerText = "+";
          btn_new_col.setAttribute("class","genBtnNew");
          btn_new_col.onclick = async function(event){//Add one column to data
            await httpAsyncPost("new="+"C:"+tableData[0][1]);
            socket.emit('refresh', tableData[0][1]);
            refreshUI(tableData[0][1]);
          }
          row.appendChild(btn_new_col);
        }
      }else{
        var row = document.createElement('tr');
        row.setAttribute("class","genTr");
        for(var j = 3;j<tableData[i].length;j++){
          var leave = false;
          //Handle the "hide"
          if (typeof(hide) !=='undefined'){
            for (k=0;k<hide.length;k++){
              if(j==hide[k]+3){
                leave=true;
              }
            }
          }
          if (leave==true){
            continue;
          }
          var cell = document.createElement('td');
          cell.setAttribute("class","genTd");
          cell.setAttribute("id",tableData[i][1] + ":" + tableData[i][0] + ':' + j);
          cell.appendChild(document.createTextNode(tableData[i][j]));
          row.appendChild(cell);
        }
        if (canAddRemove == true){
          //Button for deleting a line
          var btn_del_line = document.createElement('button');
          btn_del_line.innerText = "x";
          btn_del_line.setAttribute("class","genBtnDel");
          btn_del_line.setAttribute("id",tableData[i][1]+":"+tableData[i][0]);
          btn_del_line.onclick = async function(event){//Erase one column to data
            await httpAsyncPost("del="+"L:"+event.target.id);
            socket.emit('refresh', tableData[0][1]);
            refreshUI(tableData[0][1]);
          }
          row.appendChild(btn_del_line);
        }
      }
      tableBody.appendChild(row);
    }
    table.appendChild(tableBody);
    
    if (canAddRemove == true){
      //Button for adding a line
      var btn_new_line = document.createElement('button');
      btn_new_line.innerText = "+";
      btn_new_line.setAttribute("class","genBtnNew");
      btn_new_line.setAttribute("id",tableData[0][1]);
      btn_new_line.onclick = async function(event){//Add one column to data
        await httpAsyncPost("new="+"L:"+event.target.id);
        socket.emit('refresh', tableData[0][1]);
        refreshUI(tableData[0][1]);
      }
      table.appendChild(btn_new_line);
    }
    //Sort the table
    table.onclick = function(event) {
      let target = event.target; // where was the click?
      switch(target.tagName){
        case 'TH': 
        var col = target.cellIndex;
        var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
        switching = true;
        dir = "asc"; 
        //Make a loop that will continue until no switching has been done
        while (switching) {
          switching = false;
          rows = table.getElementsByTagName("TR");
          for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[col];
            y = rows[i + 1].getElementsByTagName("TD")[col];
            x= x.innerHTML.toLowerCase()
            y = y.innerHTML.toLowerCase()
            if(x.indexOf("/") != -1){//Si est une date alors on convertis
              x=convertDate(x);
              y=convertDate(y);
            }
            if(!isNaN(x) && x!=''){//Si est un nombre alors on convertis
              x=+x;
              y=+y;
            }
            if (dir == "asc") {
              if (x > y) {
                shouldSwitch = true;
                break;
              }
            } else if (dir == "desc") {
              if (x < y) {
                shouldSwitch = true;
                break;
              }
            }
          }
          if (shouldSwitch) {
            //If a switch has been marked, make the switch and mark that a switch has been done
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount ++; 
          } else {
            //If no switching has been done AND the direction is "asc", set the direction to "desc" and run the while loop again
            if (switchcount == 0 && dir == "asc") {
              dir = "desc";
              switching = true;
            }
          }
        }
        break;
      }
      function convertDate(d) {
        var p = d.split("/");
        return +(p[2]+p[1]+p[0]);
      }
    };
  
    if (canEdit == true){
      table.ondblclick = function(event) {
        event.stopPropagation()
        let target = event.target; // where was the click?
        var tarContent = target.innerHTML;
        var targetTag = target.tagName;
        if (targetTag != "TD" && targetTag != "TH"){
          return;
        }
        var targetIndex = target.cellIndex;
        var targetTableID = target.id.split(':')[0];
        //Modify clicked value
        //We replace the text with input area
        var inputArea = document.createElement('input');
        //inputArea properties
        inputArea.setAttribute("class","genInput");
        inputArea.value = target.innerHTML;
        inputArea.id = target.id;
        //Cancel modification on focus out
        inputArea.onblur = function(event){
          target.innerHTML = '';
          target.appendChild(document.createTextNode(tarContent));
        }
        inputArea.onkeyup = async function(event) {
          // Cancel the default action, if needed
          event.preventDefault();
          // Number 13 is the "Enter" key on the keyboard
          if (event.keyCode === 13) {
            let target = event.target; // where was the click?
            var value = target.value;
            if (value.indexOf(";")!=-1){
              value = value.replace(/;/g,",");
            }
            //If we modify a TH target into '' then column is erased
            if (targetTag == "TH" && value == ""){
              //send request for data modification
              await httpAsyncPost("del="+"C:"+targetTableID+":"+ targetIndex);
              socket.emit('refresh', targetTableID);
            }else{
              //send request for data modification
              await httpAsyncPost("mod="+target.id+":"+value);
              socket.emit('refresh', targetTableID);
            }
            //Refresh all component that hole the tabId reference
            refreshUI(targetTableID);
          }
        };
        target.innerHTML = '';
        target.appendChild(inputArea);
        inputArea.focus();
      };
    }
    document.getElementById(destination).appendChild(table);
    tabElmt.push(["table",tableID,destination,canAddRemove,canEdit,hide]);//Save the table declaration
  }