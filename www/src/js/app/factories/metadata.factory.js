(function () {
  angular.module('app.factories')
    .factory('metadata', MetadataFactory);
  MetadataFactory.$inject = ['$rootScope', 'Idle', '$log', '$window', '$timeout', '$interval', 'socket'];
  function MetadataFactory($rootScope, Idle, $log, $window, $timeout, $interval, socket) {
    function Metadata() {
      var self = this;
      self.latency = 0;
      self.telemCounter = 99;
      self.idle = false;
      self.idleStart = null;
    }

    Metadata.prototype.emit = emitMetadata;
    Metadata.prototype.setIdle = setIdle;
    Metadata.prototype.setActive = setActive;
    Metadata.prototype.getTelemetry = getTelemetry;
    Metadata.prototype.updateLatency = updateMetaLatency;


    function setIdle() {
      var self = this;
      if (self.idle && self.idleStart) {
        socket.emit('user:idle', self.idleStart);
        return;
      }

      $log.debug('User is idle.');
      self.idle = true;
      self.idleStart = Date.now();
      socket.emit('user:idle', Date.now());
    }
    function setActive() {
      var self = this;
      $log.debug('User is active.');
      self.idle = false;
      self.idleStart = null;
      socket.emit('user:active', Date.now());
    }

    function getTelemetry() {
      var self = this;
      try {
        var telemetry = angular.copy(window.bzw || {});
        telemetry.uuid = window.uuid;
        telemetry.guid = window.guid;
        telemetry.modules = window._jsModules;
        telemetry.fingerprint = window.fingerprint;
        telemetry.idle = self.idle || false;
        if (self.idle && self.idleStart) {
          telemetry.idleStart = self.idleStart;
        }

        return telemetry;

      } catch (err) {
        Sentry.captureException(err);
        $log.error('Error getting telemetry.');
        $log.error(err);
      }

      return null;
    }

    function emitMetadata() {
      var self = this;
      self.telemCounter++;
      if (self.telemCounter > 2 && window.socket.connected) {
        self.telemCounter = 0;
        var t = self.getTelemetry();
        t.z = window.generateTSString();
        socket.emit('telemetry', t);
      }

      if (!self.latency) {
        return;
      }

      socket.emit('metadata', self);
    }
    function updateMetaLatency(latency) {
      var self = this;
      self.latency = latency || 0;
    }

    const metadata = new Metadata();
    $interval(function () {
      metadata.emit();
    }, 10000);
    $timeout(function () {
      metadata.emit();
    }, 5000);
    $rootScope.$on('IdleStart', function() {
      // the user appears to have gone idle
      metadata.setIdle();
    });
    $rootScope.$on('IdleEnd', function() {
      // the user appears to have gone idle
      metadata.setActive();
    });
    $rootScope.$on('IdleTimeout', function() {
      // the user appears to have gone idle
      metadata.setIdle();
    });
    socket.on('pong', function (lat) {
      metadata.updateLatency(lat);
    });
    return metadata;
  }
})();
