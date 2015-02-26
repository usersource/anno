'use strict';

Dashboard.directive('imgonload', ['$parse', function ($parse) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.bind("load", function(event) {
                var fn = $parse(attrs["imgonload"]);
                scope.$apply(function() {
                    fn(scope, {$event : event});
                });
            });
        }
    };
}]);

Dashboard.directive('onScroll', ['$parse', function ($parse) {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            element.bind("scroll", function(event) {
                var fn = $parse(attrs["onScroll"]);
                scope.$apply(function() {
                    fn(scope, {$event : event});
                });
            });
        }
    };
}]);
