(function () {
  angular.module('app.resources')
    .factory('User', UserFactory);
  UserFactory.$inject = ['$rootScope', '$http', '$resource'];
  function UserFactory($rootScope, $http, $resource) {
    var User = $resource('/api/v1/users/:id/',
      {
        id: '@id'
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
        },
        save: {
          method: 'POST'
        },
        reset: {
          method: 'GET'
        },
        update: {
          method: 'PATCH'
        },
        destroy: {
          method: 'DELETE'
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

    return User;
  }
})();
