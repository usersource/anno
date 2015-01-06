var API_ROOT = "http://localhost:8081/_ah/api";

var API_URL = {
    "account.dashboard.authenticate" : {
        "root" : "account",
        "version" : "1.0",
        "path" : "account/dashboard/authenticate",
        "method" : "POST"
    }
};

function call_server(api_name, data, authenticated, callback) {
    var api_data = API_URL[api_name],
        url = API_ROOT + "/" + api_data.root + "/" + api_data.version + "/" + api_data.path;

    $.ajax({
        url : url,
        type : api_data.method,
        data : JSON.stringify(data),
        dataType : 'json',
        success : callback
    });
}

function save_user_access_token(access_token) {
}
