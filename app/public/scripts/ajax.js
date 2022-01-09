
/*
function update() {
  do something.
  setTimeout(update, 1000);
}
update();
*/

function http_get(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(JSON.parse(xhr.responseText));
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
};
/*
var http_get = function() {
  var xhr = new XMLHttpRequest();
  return function(url, callback) {
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        callback(JSON.parse(xhr.responseText));
      }
    };
    xhr.open('GET', url);
    xhr.send();
  };
}();
*/

var to_table = function(rows, columns, table) {
  function htmlEncode(str) {
    return (str == null || str.replace == null) ? str : str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function urlEncode(str) {
    return (str == null || str.replace == null) ? str : str;
  }
  var table_html = [];
  table_html.push("<table class=\"w3-table w3-striped\" style=\"width:1px\">");
  table_html.push("<tr>");
  if (columns.length === 0 && rows.length > 0) {
    columns = Object.keys(rows[0]);
  }
  var lowercase_columns = [];
  for (var j = 0; j < columns.length; j++) {
    lowercase_columns.push(columns[j].toLowerCase());
    if (lowercase_columns[j].endsWith('_url')) {
      table_html.push("<th>" + htmlEncode(columns[j].substring(0, columns[j].length - 4)) + "</th>");
    } else {
      table_html.push("<th>" + htmlEncode(columns[j]) + "</th>");
    }
  }
  table_html.push("</tr>");
  for (var i = 0; i < rows.length; i++) {
    table_html.push("<tr>");
    for (var j = 0; j < columns.length; j++) {
      switch (lowercase_columns[j]) {
        case "image":
          table_html.push("<td nowrap><img src='" + htmlEncode(rows[i][columns[j]]) + "' width='24'/></td>");
          break;
        case "name":
          table_html.push("<td nowrap><b>" + htmlEncode(rows[i][columns[j]]) + "</b></td>");
          break;
        case "url":
          table_html.push("<td nowrap><a href='" + urlEncode(rows[i][columns[j]]) + "'>" + htmlEncode(rows[i][columns[j]]) + "</a></td>");
          break;
        default:
          if (lowercase_columns[j].endsWith('_url')) {
            table_html.push("<td nowrap>" + rows[i][columns[j]] + "</td>");
          } else {
            table_html.push("<td nowrap>" + htmlEncode(rows[i][columns[j]]) + "</td>");
          }
          break;
      }
    }
    table_html.push("</tr>");
  }
  table_html.push("</table>");
  table.innerHTML = table_html.join('');
}
