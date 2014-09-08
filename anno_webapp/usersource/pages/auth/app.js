var annoApp = angular.module('annoApp', ['ngRoute', 'AnnoServices', 'AnnoConstantsModule'])

    .config(["$routeProvider","$locationProvider", function($routeProvider, $locationProvider) {
        $routeProvider.when('/callback/:callback*', {
        	templateUrl: "partials/login.html",
            controller: "AnnoLoginCtrl"
        }).otherwise(
        	{redirectTo: "/callback/"}
        );

        // $locationProvider.html5Mode(true); // configure html5 to get links working on jsfiddle
        // $locationProvider.hashPrefix('!');
    }]);

function byId(id)
{
    return document.getElementById(id);
}