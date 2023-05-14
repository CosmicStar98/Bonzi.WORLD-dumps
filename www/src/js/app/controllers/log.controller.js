(function () {
  'use strict';
  angular.module('app.controllers')
    .controller('chatInputCtrl', ChatInputController)
    .controller('chatLogCtrl', ChatLogController);
  ChatInputController.$inject = ['$rootScope', '$scope', '$log', '$compile', '$http', '$timeout', '$interval', '$window', 'socket'];
  function ChatInputController($rootScope, $scope, $log, $compile, $http, $timeout, $interval, $window, socket) {
    var vm = this;
    vm.chatInput = '';
    $('#chat_message').completer({
      source: [
        {
          command: '/name [name]',
          prefix: '/name ',
          description: 'Change your name',
        },
        {
          command: '/gif [text]',
          prefix: '/gif ',
          description: 'Post a random gif to the room (Giphy)',
        },
        {
          command: '/speed [speed]',
          prefix: '/speed ',
          description: 'Change your voice\'s speed',
        },
        {
          command: '/pitch [pitch]',
          prefix: '/pitch ',
          description: 'Change your voice\'s pitch',
        },
        {
          command: '/color [color]',
          prefix: '/color ',
          description: 'Change your BonziBUDDY\'s color!',
        },
        {
          command: '/youtube [video ID]',
          prefix: '/youtube ',
          description: 'Play a YouTube video',
        },
        {
          command: '/asshole [name]',
          prefix: '/asshole ',
          description: 'Call someone an asshole',
        },
        {
          command: '/owo [name]',
          prefix: '/owo ',
          description: 'owo, wat dis?',
        },
        {
          command: '/joke',
          prefix: '/joke',
          description: 'Tell a horribly written joke',
        },
        {
          command: '/fact',
          prefix: '/fact',
          description: 'Tell a horribly written "fact"',
        },
        {
          command: '/backflip',
          prefix: '/backflip',
          description: 'DO A BACKFLIP',
        },
        {
          command: '/triggered',
          prefix: '/triggered',
          description: 'The best copypasta',
        },
        {
          command: '/linux',
          prefix: '/linux',
          description: 'I\'d just like to interject for a moment',
        },
        {
          command: '/pawn',
          prefix: '/pawn',
          description: 'Hi, my name is BonziBUDDY, and this is my website',
        },
        {
          command: '/vaporwave',
          prefix: '/vaporwave',
          description: 'ＡＥＳＴＨＥＴＩＣ',
        },
        {
          command: '/unvaporwave',
          prefix: '/unvaporwave',
          description: 'ＡＥＳＴＨＥＴＩＣ ＩＳ ＫＩＬＬ',
        }
      ],
      position: 'top',
      suggest: true,
      onEnter: function () {
        var out = String(vm.chatInput);
        window.sendInput(out);
        vm.chatInput = '';
      }
    });
  }
  ChatLogController.$inject = ['$rootScope', '$scope', '$log', '$compile', '$http', '$timeout', '$interval', '$window', 'socket'];
  function ChatLogController($rootScope, $scope, $log, $compile, $http, $timeout, $interval, $window, socket) {
    var vm = this;
    vm.messages = [];
    vm.wrapClasses = ['chat-log'];
    vm.enabled = true;
    vm.initialized = false;
    vm.disconnectMessageShown = false;
    vm.status = {
      class: [],
      latency: null,
      connected: (window.socket && window.socket.connected) || false,
      message: 'Inactive',
      refreshing: false,
      minimized: false,
      glued: true,
      sapi: window.sapi || false,
      muted: false,
      backgroundMuted: false
    };

    $rootScope.socketConnected = vm.status.connected;

    if (localStorage) {
      var tempSapi = localStorage.getItem('sapi');
      if (typeof tempSapi === 'string' && tempSapi === 'false') {
        vm.status.sapi = false;
      } else if (typeof tempSapi === 'boolean' && !tempSapi) {
        vm.status.sapi = false;
      }
      window.sapi = vm.status.sapi;

      var tempMuted = localStorage.getItem('muted');
      if (typeof tempMuted === 'string' && tempMuted === 'true') {
        vm.status.muted = true;
      } else if (typeof tempMuted === 'boolean' && tempMuted) {
        vm.status.muted = true;
      }

      var tempBackgroundMuted = localStorage.getItem('bgmuted');
      if (typeof tempBackgroundMuted === 'string' && tempBackgroundMuted === 'true') {
        vm.status.backgroundMuted = true;
      } else if (typeof tempBackgroundMuted === 'boolean' && tempBackgroundMuted) {
        vm.status.backgroundMuted = true;
      }

      window.muteAudio = vm.status.muted;
      window.backgroundMuted = vm.status.backgroundMuted;
    }

    $rootScope.muteAudio = vm.status.muted;
    $rootScope.backgroundMuted = vm.status.backgroundMuted;

    $scope.options = {
      enabled: true,
      maxMessageCount: 125
    };
    $scope._connectionEstablished = false;

    $scope.msgQueue = async.cargoQueue(function (messages, callback) {
      do {
        $scope.addChatMessage(messages.shift());
      } while (messages.length > 0);
      callback();
    }, 1, 10);

    vm.initialize = initialize;
    vm.displayTime = displayTime;
    vm.getBonziHEXColor = getBonziHEXColor;
    vm.getMessageClasses = getMessageClasses;
    vm.getMessageNameIcon = getMessageNameIcon;
    vm.getMessageNameIconTitle = getMessageNameIconTitle;
    $scope.checkMessagesLength = checkMessagesLength;
    $scope.getBonziHEXColor = getBonziHEXColor;
    $scope.stringToColour = stringToColour;
    $scope.addChatMessage = addChatMessage;
    $scope.removeChatMessage = removeChatMessage;
    $scope.generateRandomId = generateRandomId;
    $scope.addEventMessage = addEventMessage;
    $scope.updateSAPIGlobal = updateSAPIGlobal;
    $scope.updateMuteGlobal = updateMuteGlobal;
    $scope.announceMuteChange = announceMuteChange;
    $scope.announceSAPIChange = announceSAPIChange;
    $scope.orderByDate = orderByDate;
    vm.orderByDate = orderByDate;
    vm.control = {
      minimize: minimizeLog,
      maximize: maximizeLog,
      toggle: toggleLog
    };

    vm.muteCtrl = {
      mute: mute,
      unmute: unmute,
      toggle: toggleMute
    };
    vm.backgroundMuteCtrl = {
      mute: function () {
        vm.status.backgroundMuted = true;
        $rootScope.backgroundMuted = true;
        window.backgroundMuted = true;
        if (localStorage) {
          localStorage.setItem('bgmuted', true);
        }
        $rootScope.$broadcast('background:mute');
      },
      unmute: function () {
        vm.status.backgroundMuted = false;
        $rootScope.backgroundMuted = false;
        window.backgroundMuted = false;
        if (localStorage) {
          localStorage.setItem('bgmuted', false);
        }

        $rootScope.$broadcast('background:unmute');
      }
    };
    vm.sapiCtrl = {
      disable: disableSAPI,
      enable: enableSAPI,
      toggle: toggleSAPI
    };
    vm.glueCtrl = {
      toggle: toggleGlue,
      glue: reglueScroll,
      unglue: unglueScroll
    };

    function generateRandomId(length) {
      length = length || 24;
      return String(`${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`).substring(0, 24);
    }
    function updateSAPIGlobal() {
      window.sapi = vm.status.sapi;
      if (localStorage) {
        localStorage.setItem('sapi', vm.status.sapi);
      }

      $scope.announceSAPIChange();
    }
    function enableSAPI() {
      vm.status.sapi = true;
      $scope.updateSAPIGlobal();
    }
    function disableSAPI() {
      vm.status.sapi = false;
      $scope.updateSAPIGlobal();
    }
    function toggleSAPI() {
      vm.status.sapi = !vm.status.sapi;
      $scope.updateSAPIGlobal();
    }
    function updateMuteGlobal() {
      window.muteAudio = vm.status.muted;
      $rootScope.muteAudio = vm.status.muted;
      if (localStorage) {
        localStorage.setItem('muted', vm.status.muted);
      }

      $scope.announceMuteChange();
    }
    function mute() {
      vm.status.muted = true;
      $scope.updateMuteGlobal();
    }
    function unmute() {
      vm.status.muted = false;
      $scope.updateMuteGlobal();
    }
    function toggleMute() {
      vm.status.muted = !vm.status.muted;
      $scope.updateMuteGlobal();
    }

    function minimizeLog() {
      vm.status.minimized = true;
      $scope.$emit('cl:minimized', vm.status.minimized);
    }
    function maximizeLog() {
      vm.status.minimized = false;
      $scope.$emit('cl:maximized', vm.status.minimized);
    }
    function toggleLog() {
      vm.status.minimized = !vm.status.minimized;
      if (vm.status.minimized) {
        $scope.$emit('cl:minimized', vm.status.minimized);
      } else {
      $scope.$emit('cl:maximized', vm.status.minimized);
      }
    }

    function toggleGlue() {
      vm.status.glued = !vm.status.glued;
    }
    function reglueScroll() {
      vm.status.glued = true;
    }
    function unglueScroll() {
      vm.status.glued = false;
    }

    function getMessageNameIcon(message) {
      if (!message) {
        return '';
      }

      if (message.admin) {
        return 'fas fa-check-circle bzw-admin-icon';
      }

      return '';
    }
    function getMessageNameIconTitle(message) {
      if (!message) {
        return '';
      }

      if (message.admin) {
        return 'Administrator';
      }

      return '';
    }
    function getMessageClasses(message) {
      if (!message) {
        return;
      }

      var classes = [];
      if (message.admin) {
        classes.push('bonzi-admin');
      }

      if (message.type === 'text' || message.bonzi) {
        classes.push('bonzi-message');
        if (message.bonzi && message.bonzi.color) {
          classes.push(`bonzi-${message.bonzi.color}`);
        }
      }

      if (message.type === 'event') {
        classes.push('bonzi-event');
      }

      if (message.source) {
        classes.push(`bonzi-event-${message.source}`);
      }

      return classes;
    }

    function displayTime(date) {
      if (!date) {
        return 'Unknown';
      }

      return moment(date).format('HH:mm:ss');
    }

    function getBonziHEXColor(color) {
      let hex = '#AB47BC';
      if (!color) {
        return;
      }

      switch (color) {
        case 'pink':
          hex = '#EC407A';
          break;
        case 'blue':
          hex = '#2196F3';
          break;
        case 'red':
          hex = '#f44336';
          break;
        case 'brown':
          hex = '#795548';
          break;
        case 'green':
          hex = '#4CAF50';
          break;
        case 'black':
          hex = '#9E9E9E';
          break;
      }

      return hex;
    }

    function checkMessagesLength() {
      if (!vm || !vm.messages || vm.messages.length === 0) {
        return;
      }

      if (vm.messages.length > $scope.options.maxMessageCount) {
        do {
          vm.messages.shift();
        } while (vm.messages.length > $scope.options.maxMessageCount);
      }
    }

    function addChatMessage(payload, args) {
      if (!payload) {
        return;
      }

      var text = (payload.body || payload.text).replace(/(^&gt;)/gim, '>');

      args = args || {};

      payload.type = payload.type || 'text';
      payload.body = text;
      payload.text = text;
      if (payload && (payload.bonzi || payload._bonzi)) {
        payload._bonzi = payload._bonzi || (payload.bonzi && _.get(window.bonzis, payload.bonzi.guid)) || null;
        if (payload.bonzi) {
          payload.style = {
            'color': $scope.getBonziHEXColor(payload.bonzi.color) || $scope.stringToColour(payload.bonzi.uuid)
          };
        }
      }

      payload.args = args;

      vm.messages.push(payload);
      $scope.checkMessagesLength();
    }

    function removeChatMessage(id) {
      if (!id) {
        return;
      }

      var index = _.findIndex(vm.messages, ['id', id]);
      if (index >= 0) {
        vm.messages.splice(index, 1);
      }
    }
    function addEventMessage(payload) {
      if (!payload) {
        return;
      }

      if (payload.message || (payload.type && payload.type === 'text')) {
        return $scope.addChatMessage(payload);
      }

      payload._id = payload._id || payload.id || $scope.generateRandomId();
      payload.id = payload._id;
      payload.type = payload.type || 'event';
      payload.source = payload.source || 'unknown';
      payload.style = payload.style || {};
      if (payload.noFilter) {
        payload.noFilter = true;
      } else {
        payload.noFilter = false;
      }

      payload.timestamp = (payload.timestamp && moment(payload.timestamp)) || moment();
      payload.text = payload.text || payload.body;
      vm.messages.push(payload);
      $scope.checkMessagesLength();
    }

    function announceSAPIChange() {
      var t = vm.status.sapi ? 'SAPI has been enabled.' : 'Sound has been disabled.';
      $scope.addEventMessage({
        type: 'event',
        source: 'client',
        event: vm.status.sapi ? 'enabled' : 'disabled',
        text: t
      });
    }
    function announceMuteChange() {
      var t = vm.status.muted ? 'Sound has been muted.' : 'Sound has been unmuted.';
      $rootScope.$broadcast('mute:changed', {muted: vm.status.muted});
      $scope.addEventMessage({
        type: 'event',
        source: 'client',
        event: vm.status.muted ? 'muted' : 'unmuted',
        text: t
      });
    }

    socket.on('talk', function (data) {
      $scope.msgQueue.push(data);
    });
    $scope._serverRebooting = false;
    socket.on('connect', () => {
      clearTimeout($scope.disconnectTO);
      vm.status.connected = (window.socket && window.socket.connected) || false;
      $rootScope.socketConnected = vm.status.connected;
      $scope._connectionEstablished = true;
      $scope._serverRebooting = false;
      if ($scope.disconnectMessageShown) {
        $scope.addEventMessage({
          type: 'event',
          source: 'socket',
          event: 'connect',
          text: $scope._connectionEstablished ? 'Reconnected.' : 'Connected.'
        });
      }

      $scope.disconnectMessageShown = false;
    });
    socket.on('disconnect', () => {
      vm.status.connected = (window.socket && window.socket.connected) || false;
      $rootScope.socketConnected = vm.status.connected;
      $scope.disconnectTO = setTimeout(function () {
        if ((window.socket && window.socket.connected) || vm.status.connected) {
          return;
        }

        $scope.addEventMessage({
          type: 'event',
          source: 'socket',
          event: 'disconnect',
          text: 'Disconnected - attempting to reconnect..'
        });

        $scope.disconnectMessageShown = true;
      }, 20000);
    });
    socket.on('bzw-s-rebooting', data => {
      if ($scope._serverRebooting) {
        return;
      }

      $scope._serverRebooting = true;
      // $scope.addEventMessage({
      //   type: 'event',
      //   source: 'server',
      //   event: 'reboot',
      //   text: 'BonziWORLD server is rebooting..'
      // });
    });
    socket.on('bzw-s-message', data => {
      if (!data) {
        return;
      }
      try {
        if (data.socket !== window.socket.id) {
          $log.info('Not a real server broadcast.');
          Sentry.captureMessage('Fake server message generated: emitted socket id does not match.');
          return;
        }

        $scope.addEventMessage({
          type: 'broadcast',
          source: 'admin',
          event: 'message',
          text: data.text
        });
      } catch (err) {
        // Nothing.
      }
    });
    socket.on('youtube', data => {
      var pl = {
        type: 'media',
        subtype: 'youtube',
        guid: data.guid,
        body: data.display,
        text: data.display,
        html: data.html,
        bonzi: data.bonzi || _.get(window.bonzis, data.guid) || null,
        timestamp: (data.timestamp && moment(data.timestamp)) || moment()
      };

      $scope.addChatMessage(pl, {
        html: true
      });
    });
    // socket.on('image', data => {
    //   var pl = {
    //     type: 'media',
    //     subtype: 'youtube',
    //     guid: data.guid,
    //     body: data.display,
    //     text: data.display,
    //     html: data.html,
    //     bonzi: data.bonzi || _.get(window.bonzis, data.guid) || null,
    //     timestamp: (data.timestamp && moment(data.timestamp)) || moment()
    //   };

    //   $scope.addChatMessage(pl, {
    //     html: true
    //   });
    // });
    socket.on('bzw-m-removed', data => {
      $scope.removeChatMessage(data);
    });
    socket.on('bzw-o-banned', data => {
      if (!data || !data.bonzi) {
        return;
      }

      $scope.addEventMessage({
        type: 'event',
        source: 'admin',
        event: 'other',
        text: `${data.bonzi.name} has been banned for ${data.length} minutes. (${data.reason || 'no reason specified'})`
      });
    });
    socket.on('bzw-o-kicked', data => {
      if (!data || !data.bonzi) {
        return;
      }

      $scope.addEventMessage({
        type: 'event',
        source: 'admin',
        event: 'other',
        text: `${data.bonzi.name} has been kicked. (${data.reason || 'no reason specified'})`
      });
    });

    $rootScope.$on('log:max', function (event, data) {
      vm.control.maximize();
    });
    $rootScope.$on('log:min', function (event, data) {
      vm.control.minimize();
    });
    $rootScope.$on('log:toggle', function (event, data) {
      vm.control.toggle();
    });
    $rootScope.$on('log:addmessage', function (event, data) {
      $scope.addEventMessage(data);
    });

    socket.on('ratelimit', () => {
      $scope.addEventMessage({
        type: 'event',
        source: 'server',
        event: 'ratelimit',
        text: 'You have reached the rate limit - please try again in a few seconds.'
      });
    });
    socket.on('commandFail', data => {
      if (data && data.message) {
        $scope.addEventMessage({
          type: 'event',
          source: 'server',
          event: 'commandfail',
          text: data.message
        });
      }
    });

    socket.on('pong', function (latency) {
      vm.status.latency = latency;
      vm.status.connected = (window.socket && window.socket.connected) || false;
      $rootScope.socketConnected = vm.status.connected;
    });

    function orderByDate(message) {
      return new Date(message.timestamp);
    }

    function stringToColour(str) {
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      var colour = '#';
      for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
      }
      return colour;
    }
    function initialize () {
      if (vm.initialized) {
        return;
      }

      vm.initialized = true;
      $scope.addEventMessage({
        type: 'event',
        source: 'BonziWORLD',
        event: 'welcome',
        text: `<span class="log-welcome">Welcome to BonziWORLD v${window.bzw.version} (${window.bzw.release.substring(0, 8)})!</span>`,
        noFilter: true
      });
      if (window && window.discord && window.discord.enabled && window.discord.defaultInvite && window.discord.defaultInvite.length > 0) {
        $scope.addEventMessage({
          type: 'event',
          source: 'BonziWORLD',
          event: 'discord',
          text: `<span class="log-discord">Bonzi.World now has a Discord! Join at: <a class="discord-link log-discord-link" href="${window.discord.defaultInvite}" target="_blank">${window.discord.defaultInvite}</a>.</span>`,
          noFilter: true
        });
      }
    }

    vm.initialize();
  }
})();
