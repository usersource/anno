function call_server(api_name, data, authenticated, callback) {
    var api_data = API_URL[api_name],
        url = API_ROOT + "/" + api_data.root + "/" + api_data.version + "/" + api_data.path;

    // $.ajax({
    //     url : url,
    //     type : api_data.method,
    //     data : JSON.stringify(data),
    //     dataType : 'json',
    //     success : callback
    // });
}

// function authenticate_dashboard() {
//               var login_data = {
//                   "user_email" : $("#login_email").val(),
//                   "password" : $("#login_password").val(),
//                   "team_key" : $("#login_team_key").val()
//               };

//               call_server("account.dashboard.authenticate", login_data, false, function(resp) {
//                   console.log(resp);
//                   if (resp.authenticated) {
//                       save_user_data(resp);
//                       window.location = "index.html";
//                   }
//               });
//           }