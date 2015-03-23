'use strict';

Dashboard.config(function($httpProvider) {
    $httpProvider.defaults.headers.common = { 'Content-Type' : 'application/json;charset=utf-8' };
});

Dashboard.config(function($routeProvider, $locationProvider) {
    var $cookies;
    angular.injector(['ngCookies']).invoke(function(_$cookies_) {
        $cookies = _$cookies_;
    });

    $routeProvider.when('/dashboard/:teamHash?/:teamName?/login', {
        templateUrl: '/dashboard/partials/login.html',
        controller: 'Login'
    }).when('/dashboard/:teamHash?/:teamName?/feed', {
        templateUrl: '/dashboard/partials/feed.html',
        controller: 'Feed'
    }).when('/dashboard/:teamHash?/:teamName?', {
        redirectTo: function(params, current_url) {
            var action_page = angular.equals($cookies.authenticated, "true") ? '/feed' : '/login';
            return current_url + action_page;
        }
    }).otherwise({
        redirectTo: '/dashboard'
    });

    $locationProvider.html5Mode({ enabled: true, requireBase: false });
});

Dashboard.run(function($rootScope, $location) {
    var $cookies;
    angular.injector(['ngCookies']).invoke(function(_$cookies_) {
        $cookies = _$cookies_;
    });

    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        var redirectTo;

        if (angular.equals($cookies.authenticated, "true")) {
            if (next.templateUrl === "/dashboard/partials/login.html") {
                redirectTo = "feed";
            }
        } else {
            redirectTo = "login";
        }

        if (angular.isDefined(redirectTo)) {
            if (next.params.hasOwnProperty("teamHash") && next.params.hasOwnProperty("teamName")) {
                $location.path("/dashboard/" + next.params.teamHash + "/" + next.params.teamName + "/" + redirectTo);
            } else  {
                $location.path("/dashboard/" + redirectTo);
            }
        }
    });
});
