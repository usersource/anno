var annoApp = angular.module('annoApp', ['ngRoute', 'AnnoServices', 'AnnoConstantsModule'])

    .config(["$routeProvider","$locationProvider", function($routeProvider, $locationProvider) {
        $routeProvider.when('/team/:teamId/', {
            templateUrl: 'partials/viewTeamActivity.html',
            controller: "ViewTeamActivityCtrl"
        });

        $routeProvider.when('/team/:teamId/cursor/:cursorId', {
            templateUrl: 'partials/viewTeamActivity.html',
            controller: "ViewTeamActivityCtrl"
        });

        $routeProvider.when('/home/', {
            templateUrl: 'partials/home.html',
            controller: "HomeCtrl"
        });

        $routeProvider.otherwise({redirectTo: '/home'});

        // $locationProvider.html5Mode(true); configure html5 to get links working on jsfiddle
        // $locationProvider.hashPrefix('!');
    }]);

function byId(id)
{
    return document.getElementById(id);
}