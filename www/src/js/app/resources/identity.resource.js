(function () {
  angular.module('app.resources')
    .factory('Identity', IdentityResource);
  IdentityResource.$inject = ['$rootScope', '$http', '$resource'];
  function IdentityResource($rootScope, $http, $resource) {
    var Identity = $resource('/api/v1/identity/:type/',
      {
        type: 'user'
      },
      {
        get: {
          method: 'GET',
          interceptor: {
            response: getInterceptor
          }
        },
        refresh: {
          method: 'GET',
          interceptor: {
            response: getInterceptor
          }
          // Cache: false
        }
      }
    );
    function getInterceptor(response) {
      var instance = response.resource;
      if (!instance || !instance.id) {
        return instance;
      }

      // Return the instance
      return instance;
    }

    angular.extend(Identity.prototype, {
      logout: logout
    });
    function logout(callback) {
      console.log('Logging out.');
      function done(err, result) {
        if (typeof callback === 'function') {
          callback(err, result);
        }

        return result;
      }

      $http.post('/api/v1/logout/')
        .then(response => {
          done(null, response.data);
        }, err => {
          done(err);
        });
    }

    return Identity;
  }
})();
