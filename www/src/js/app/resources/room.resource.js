(function () {
  angular.module('app.resources')
    .factory('Room', RoomFactory);
  RoomFactory.$inject = ['$rootScope', '$http', '$resource'];
  function RoomFactory($rootScope, $http, $resource) {
    var Room = $resource('/api/v1/rooms/:id/',
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

    return Room;
  }
})();
