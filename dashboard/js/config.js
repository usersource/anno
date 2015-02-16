'use strict';

Dashboard.config(function($routeProvider, $locationProvider) {
    $routeProvider.
        when('/dashboard/login/:teamHash?/:teamName?', {
            templateUrl: '/dashboard/partials/login.html',
            controller: 'Login'
        }).
        when('/feed/:teamHash?/:teamName?', {
            templateUrl: 'partials/feed.html',
            controller: 'Feed'
        }).
        otherwise({
            redirectTo: '/dashboard/login'
        });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
});
