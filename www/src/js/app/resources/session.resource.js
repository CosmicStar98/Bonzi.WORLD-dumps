(function () {
  angular.module('app.resources')
    .factory('Session', SessionResource);
  SessionResource.$inject = ['$rootScope', '$http', '$resource'];
  function SessionResource($rootScope, $http, $resource) {
    var baseURL = '/api/v1/session/';
    var Session = $resource(baseURL,
      {},
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

    angular.extend(Session.prototype, {
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

    return Session;
  }
})();
