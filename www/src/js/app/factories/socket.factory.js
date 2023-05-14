(function () {
  angular.module('app.factories')
    .factory('socket', SocketFactory);
  SocketFactory.$inject = ['socketFactory'];
  function SocketFactory(socketFactory) {
    var socket = socketFactory({
      ioSocket: window.socket
    });
    socket.forward('error');
    return socket;
  }
})();
