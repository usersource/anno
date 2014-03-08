var annoApp = angular.module('annoApp', ['ngRoute', 'AnnoServices', 'AnnoConstantsModule'])

    .config(["$routeProvider","$locationProvider", function($routeProvider, $locationProvider) {
        $routeProvider.when('/anno/:annoId', {
            templateUrl: 'partials/viewAnno.html',
            controller: "ViewAnnoCtrl"
        });

        $routeProvider.when('/annoIdNeeded', {
            templateUrl: 'partials/annoIdNeeded.html',
            controller2: "ViewAnnoCtrl"
        });

        $routeProvider.otherwise({redirectTo: '/annoIdNeeded'});

        // $locationProvider.html5Mode(true); configure html5 to get links working on jsfiddle
        // $locationProvider.hashPrefix('!');
    }]);

function byId(id)
{
    return document.getElementById(id);
}