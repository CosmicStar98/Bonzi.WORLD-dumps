(function () {
  angular.module('app.factories')
    .factory('session', SessionFactory);
  SessionFactory.$inject = ['$rootScope', '$log', '$window', '$timeout', '$interval', 'User', 'Session', 'socket'];
  function SessionFactory($rootScope, $log, $window, $timeout, $interval, User, Session, socket) {
    var session = Session.get({});
    return session;
  }
})();
