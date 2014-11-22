'use strict';

/* Directives */

angular.module('app.directives', [])// directives
    // this directive is a helper for browsers that can't seem to get % height correct.  this will watch for page
    .directive('resizeHandler', ['$window', '$log', function ($window, $log) {
        $log = $log.getInstance('resize');
        $log.debug("using resize");

        return {
            restrict: 'A',
            transclude: false,
            replace: false,
            scope: false,
            controller: ["$scope", function ($scope) {
                // nothing needed here atm
            }],
            link: function ($scope, $element, $attrs) {
                var callback = $scope.$eval($attrs.resizeHandler);
                $log.debug("using callback", callback);

                $scope.$watch(function () {
                    return { 'h': $element.height(), 'w': $element.width() };
                }, function (newValue, oldValue) {
                    // call handler
                    callback(newValue.w, newValue.h);
                }, true);

                $element.bind('resize', function () {
                    $scope.$apply();
                });

                $scope.$on('$destroy', function() {
                    //$log.debug("cleaning up old scope");
                    $element.unbind('resize');
                    $element = null;
                });
            }
        }
    }]).directive('scrollListener', function($window, $log) {
        $log = $log.getInstance('copybutton');

        return {
            restrict: 'A',
            transclude: false,
            replace: false,
            require: '?ngBind',
            scope: false,
            link: function($scope, $element, $attrs) {
                $log.debug('html scrollListener', $element, $scope, $attrs);
                $element.on('scroll', function() {
                    //$log.debug('html scrolling', $element);
                    if ($attrs.onScroll) {
                        var fn = $scope.$eval($attrs.onScroll);
                        fn($element);
                    }
                });

                var cancelWatch = $scope.$watch(function($scope) {
                    return $element[0].scrollHeight;
                }, function() {
                    //$log.debug('changed', $element);
                    if ($attrs.onOverflow) {
                        var fn = $scope.$eval($attrs.onOverflow);
                        fn($element);
                    }
                });

                $scope.$on('$destroy', function() {
                    cancelWatch();
                    cancelWatch = null;
                });
            }
        };
    }).directive('focusOn', function($timeout) {
        return function(scope, elem, attr) {
            scope.$on('focusOn', function(e, name) {
                if(name === attr.focusOn) {
                    console.log('focusing', name, 'elem', elem[0]);
                    $timeout(function() {
                        elem[0].focus();
                    }, 0);
                }
            });
        };
    }).directive('ngModelOnblur', function() {
        return {
            priority: 1,
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attr, ngModelCtrl) {
                if (attr.type === 'radio' || attr.type === 'checkbox') {
                    return;
                }
                elm.off('input keydown change');
                elm.on('blur', function() {
                    scope.$apply(function() {
                        ngModelCtrl.$setViewValue(elm.val());
                    });         
                });
            }
        };
    }).directive('limitTo', [function () {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var limit = parseInt(attrs.limitTo);
                angular.element(elem).on('keydown', function (evt) {
                    var key = (evt.keyCode || evt.charCode);
                    if (this.value.length === limit && key !== 8) {
                        return false;
                    }
                });
            }
        }
    // only allow numbers between 1 & 99. no less than 1, no great than 99.
    }]).directive('oneToNinetyNine', ['$log','$timeout', function ($log, $timeout) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function($scope, elem, attrs, ngModelCtrl) {
                if (!ngModelCtrl) {
                    return;
                }
                // actual number check
                function runCheck(val) {
                    var fixed;
                    if (val < 1) {
                        fixed = 1;
                    } else if (val > 99) {
                        fixed = 99;
                    } else {
                        fixed = val;
                    }
                    ngModelCtrl.$setViewValue(fixed);
                    ngModelCtrl.$render();
                }
                // watch for changes to number
                angular.element(elem).on('input keydown change', function (evt) {
                    var val = this.value;
                    if (val === '' || val === null) {
                        $timeout(function() {
                            runCheck(val);
                        }, 1000);
                    } else {
                        runCheck(val);
                    }
                });
            }
        }
    // strip anything but numbers
    }]).directive('numbersOnly', ['$log', function ($log) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function($scope, elem, attrs, ngModelCtrl) {
                if (!ngModelCtrl) {
                    return;
                }
                // watch for changes to number
                angular.element(elem).on('input keydown change', function (evt) {
                    var nums, val = this.value;
                    $log.debug('Directives: numbersOnly: val:', val);
                    nums = val.replace(/[^0-9]/g, '');
                    $log.debug('Directives: numbersOnly: fixed:', nums);
                    ngModelCtrl.$setViewValue(nums);
                    ngModelCtrl.$render();
                });
            }
        }
    }]);

