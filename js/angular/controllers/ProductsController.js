angular.module('app.controllers.products')
    .controller('ProductsController', function ($sce, HashKeyCopier, Cart, Categories, Products, Search, $scope, $rootScope, $routeParams, $q, $location, $timeout, $window, $log, $modal, $document, BreadcrumbsHelper) {
        $log.debug("ProductsController");

        $rootScope.page = "All Products";
        $rootScope.section = "store";

        $scope.errorMessage = '';
        $scope.loading = true;

        // set the navigation to all products
        $log.debug("ProductsController(): clearing breadcrumbs & setting All Project nav item");
        BreadcrumbsHelper.setPath(null, null);
        $rootScope.navStatic = '1';

        $log.debug("ProductsController(): routeParams", $routeParams);
        $log.debug("ProductsController(): routeParams.category", $routeParams.category);
        $log.debug("ProductsController(): routeParams.search", $routeParams.search);
        $scope.categoryId = $routeParams.category;
        $scope.category = null;

        Search.search($routeParams.search);

        $scope.quantities = {};

        $scope.addToCart = function(product) {
            $log.debug("ProductsController(): adding product", product);
            var qty = $scope.quantities[product.itemnumber];
            if (qty == null) {
                qty = 1;
            }
            $log.debug("ProductsController(): adding product", product, qty);
            var p = angular.copy(product);
            p.quantity = qty;
            Cart.addToCart(p);
        };

        /*==== SEARCH ====*/
        $scope.searchFunction = function(product) {
            //$log.debug("searching product", product);

            // no search string, match everything
            var query = Search.getQuery();
            if (S(query).isEmpty()) {
                return true;
            }

            if (!S(product.itemnumber).isEmpty() &&
                (S(product.productname).toLowerCase().indexOf(S(query).toLowerCase())!=-1 ||
                 S(product.itemnumber).toLowerCase().indexOf(S(query).toLowerCase())!=-1))
            {
                //$log.debug("found product");
                return true;
            } else if (!S(product.groupid).isEmpty()) {
                //$log.debug("searching product group");

                var products = product.productskus.productdetail;
                if (products == null) {
                    //$log.debug("no sub-products for group");
                    return false;
                }

                //$log.debug("have sub-products", products.length);

                for (var i=0; i < products.length; i++) {
                    product = products[i];
                    //$log.debug("searching sub-product", product);
                    if (!S(product.itemnumber).isEmpty() &&
                        (S(product.productname).toLowerCase().indexOf(S(query).toLowerCase())!=-1 ||
                         S(product.itemnumber).toLowerCase().indexOf(S(query).toLowerCase())!=-1))
                    {
                        return true;
                    }
                }
            }
            return false;
        };

        /*=== LOAD DATA ====*/

        var categoriesLoadedPromise = $q.defer();
        var loadCategory = function() {
            $log.debug("ProductsController(): loadCategory(): loading category", $scope.categoryId);
            Categories.get({"categoryId": $scope.categoryId, "recurse": true}, function(category, status, headers) {
                $scope.category = category;

                $log.debug("ProductsController(): loaded category", category);

                $rootScope.page = category.name;
                categoriesLoadedPromise.resolve(category);
            }, function(data, status, headers) {
                $log.error("error loading category", data, status);
                //Hide loader
                $scope.loading = false;
                // Set Error message
                $scope.errorMessage = "An error occurred while retrieving category data. Please refresh the page to try again, or contact your system administrator if the error persists.";

            });
        };
        if ($scope.categoryId) {
            loadCategory();
        }

        var loadProducts = function () {
            //var start = new Date().getTime();
            Products.query({"categoryId": $scope.categoryId}, function(products, responseHeaders) {
                $log.debug("ProductsController(): got products", products);
                // We do this here to eliminate the flickering.  When Products.query returns initially,
                // it returns an empty array, which is then populated after the response is obtained from the server.
                // This causes the table to first be emptied, then re-updated with the new data.
                if(products.length>0) {
                    if ($scope.products) {
                        // update the objects, not just replace, else we'll yoink the whole DOM
                        $scope.products = HashKeyCopier.copyHashKeys($scope.products, products, ["id"]);
                        //$log.debug("ProductsController(): updating objects", $scope.objects);
                    } else {
                        $scope.products = products;
                        //$log.debug("ProductsController(): initializing objects");
                    }
                } else {
                    $scope.products = '';
                }

                var path = BreadcrumbsHelper.setPath($scope.category, null, null);
                $log.debug("ProductsController(): path", path);

                $scope.loading = false;
            }, function (data) {
                //$log.debug('refreshProducts(): groupName=' + groupName + ' failure', data);
                if (data.status == 401) {
                    // Looks like our session expired.
                    return;
                }

                //Hide loader
                $scope.loading = false;
                // Set Error message
                $scope.errorMessage = "An error occurred while retrieving object list. Please refresh the page to try again, or contact your system administrator if the error persists.";
            });
        };

        if ($scope.categoryId) {
            categoriesLoadedPromise.promise.then(function(category) {
                $log.debug("ProductsController(): loading products after category loaded");
                // kick off the first refresh
                loadProducts();
            });
        } else {
            $log.debug("ProductsController(): loading products");
            loadProducts();
        }

        function cleanup() {
        }

        /*==== CLEANUP ====*/
        $scope.$on('$destroy', function() {
            cleanup();
        });
    });
