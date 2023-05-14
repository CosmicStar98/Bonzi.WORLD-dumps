(function () {
  'use strict';
  angular.module('app.controllers')
    .animation('.page-loader-anim', OverlayAnimation)
    .controller('globalCtrl', GlobalController);

  function OverlayAnimation() {
    return {
      addClass: function (element, className, doneFn) {
        // do some cool animation and call the doneFn
        if (className === 'page-loading') {
          jQuery('.page-loader-wrapper').prop('disabled', false);
          return jQuery('.page-loader-wrapper').fadeIn(300, doneFn);
        }

        jQuery('.page-loader-wrapper').prop('disabled', true);
        jQuery('.page-loader-wrapper').fadeOut(420, doneFn);
      }
    };
  }

  GlobalController.$inject = ['$rootScope', '$translate', '$interval', '$timeout', '$scope', '$log', '$window', '$location', 'socket', 'identity', 'metadata', 'settings', 'session'];
  function GlobalController($rootScope, $translate, $interval, $timeout, $scope, $log, $window, $location, socket, identity, metadata, settings, session) {
    var vm = this;
    $rootScope.socketConnected = false;
    $scope.player = null;
    soundManager.setup({
      url: '/lib/soundmanager2/swf/',
      flashVersion: 9, // optional: shiny features (default = 8)
      // optional: ignore Flash where possible, use 100% HTML5 mode
      // preferFlash: false,
      onready: function() {
        $rootScope.soundManagerReady = true;
        // Ready to use; soundManager.createSound() etc. can now be called.
      }
    });
    vm.discordLinkClick = function () {
      socket.emit('discord:invite:clicked', {timestamp: new Date()});
    }

    $('body').on('click', 'a.log-discord-link', function () {
      vm.discordLinkClick();
    });

    vm.closeAllModals = function () {
      vm.modals.close('all');
    };

    vm.dropdowns = {
      known: ['user'],
      user: true,
      open: function (dd) {
        if (!dd) {
          $log.warn('Unable to open dropdown: no dropdown name provided.');
          return;
        }

        vm.dropdowns[dd] = true;
      },
      close: function (dd) {
        if (!dd) {
          $log.warn('Unable to close dropdown: no dropdown name provided.');
          return;
        }

        if (dd === 'all') {
          vm.dropdowns.known.forEach(function (m) {
            vm.dropdowns[m] = false;
          });

          return;
        }

        vm.dropdowns[dd] = false;
      },
      toggle: function (dd) {
        if (!dd) {
          $log.warn('Unable to toggle dropdown: no dropdown name provided.');
          return;
        }

        vm.dropdowns[dd] = !vm.dropdowns[dd] || false;
      }
    };
    vm.modals = {
      known: ['login', 'discord'],
      login: false,
      discord: false,
      open: function (modal) {
        if (!modal) {
          $log.warn('Unable to open modal: no modal name provided.');
          return;
        }

        vm.modals[modal] = true;
      },
      close: function (modal) {
        if (!modal) {
          $log.warn('Unable to close modal: no modal name provided.');
          return;
        }

        if (modal === 'all') {
          vm.modals.known.forEach(function (m) {
            vm.modals[m] = false;
          });

          return;
        }

        vm.modals[modal] = false;
      },
      toggle: function (modal) {
        if (!modal) {
          $log.warn('Unable to toggle modal: no modal name provided.');
          return;
        }

        vm.modals[modal] = !vm.modals[modal] || false;
      }
    };

    vm.bg = {
      visible: false,
      maximized: false
    };

    vm.session = session;
    vm.settings = settings;
    vm.initialized = false;
    vm.initalize = initalize;
    vm.pageLoading = true;
    vm.authenticated = false;
    vm.states = $rootScope.states;
    vm.seizing = false;
    vm.showSeizing = false;

    vm.room = null;

    $scope.autoreloadCSSClass = 'live-css';
    $scope.autoreloadCSSClasses = [$scope.autoreloadCSSClass];
    $scope.reloadSpecificStylesheet = reloadSpecificStylesheet;

    $scope._reloadCSSLink = function (src, element, dataset) {
      if (!src || !element) {
        return false;
      }

      var classes = element.attr('class').split(' ');
      const found = classes.some(r => $scope.autoreloadCSSClasses.includes(r));
      if (classes.length === 1 || !found) {
        return false;
      }

      function CSSDone() {
        element.remove();
      }

      var queryString = '?reload=' + new Date().getTime();
      var newSrc = src.replace(/\?.*|$/, queryString);
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      angular.forEach(classes, function (c) {
        link.classList.add(c);
      });
      link.addEventListener('load', function () {
        setTimeout(CSSDone, 250);
      });
      if (dataset && dataset.length >= 0) {
        angular.forEach(dataset, function (c) {
          if (!c) {
            return;
          }

          var key = c.key || c.name;

          if (key) {
            link.setAttribute(key, c.value);
            $(link).data(key, c.value);
          }
        });
      }

      link.href = newSrc;
      element.after(link);
    };

    $scope.reloadCSS = function () {
      $('link.live-css').each(function () {
        $scope._reloadCSSLink(this.href, $(this));
      });
    };

    $scope.reloadCSS = function () {
      $('link.' + $scope.autoreloadCSSClass).each(function () {
        $scope._reloadCSSLink(this.href, $(this));
      });
    };

    vm.authenticated = false;
    vm.reloadIdentity = reloadIdentity;
    vm.updateIdentity = updateIdentity;
    vm.logoutIdentity = logoutIdentity;
    vm.updateStates = updateStates;
    vm.getDisplayName = getDisplayName;
    // console.log('Global controller!');
    // console.dir(data);
    // console.dir(identity);

    vm.showDiscordPopup = function () {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong!',
        footer: '<a href>Why do I have this issue?</a>'
      })
    }
    function getDisplayName() {
      if (!vm.authenticated) {
        return 'Login';
      }

      if (!vm.user || !vm.user.name) {
        return '';
      }

      return vm.user.name;
    }

    function reloadIdentity() {
      identity.reload();
    }

    function logoutIdentity() {
      identity.doLogout();
    }

    function updateStates() {
      // Process different states from user info.
      vm.authenticated = identity.authenticated || false;
      if (!vm.authenticated) {
        return;
      }

      vm.states = $rootScope.states || {};
    }

    vm.sidebar = {
      previous: null,
      forward: null,
      collapsed: true,
      current: 'default:default',
      view: 'default',
      subview: 'default'
    };

    $rootScope.sidebarCollapsed = true;
    vm.sbCtrl = {
      show: function () {
        $log.debug('Showing sidebar..');
        $rootScope.sidebarCollapsed = false;
        vm.sidebar.collapsed = false;
        vm.sbCtrl.update();
      },
      back: function () {
        vm.sidebar.forward = angular.copy(vm.sidebar.current);
        if (!vm.sidebar.previous) {
          vm.sbCtrl.hide();
          return;
        }

        vm.sbCtrl.changeView(vm.sidebar.previous);
      },
      hide: function () {
        $rootScope.sidebarCollapsed = true;
        vm.sidebar.collapsed = true;
        vm.sbCtrl.update();
      },
      toggle: function () {
        vm.sidebar.collapsed = !vm.sidebar.collapsed;
        $rootScope.sidebarCollapsed = vm.sidebar.collapsed;
        vm.sbCtrl.update();
      },
      changeView: function (nv, hide) {
        hide = hide || false;
        if (!nv) {
          $log.warn('Unable to change sidebar view: no view supplied');
          return false;
        }

        nv = nv.trim();
        $log.info(`Changing view to: ${nv}.`);
        if (nv.indexOf(':') < 0) {
          vm.sidebar.view = nv;
          vm.sidebar.subview = 'default';
        } else {
          var s = nv.split(':');
          vm.sidebar.view = s[0].trim();
          if (s.length > 1) {
            vm.sidebar.subview = s[1].trim();
          } else {
            vm.sidebar.view = 'default';
          }
        }

        vm.sidebar.previous = angular.copy(vm.sidebar.current || null);
        vm.sidebar.current = nv;
        if (hide) {
          return vm.sbCtrl.hide();
        }

        vm.sbCtrl.show();
      },
      update: function () {
        var b = angular.element('body');
        if (vm.sidebar.collapsed) {
          b.removeClass('side-bar-visible').addClass('side-bar-collapsed');
        } else {
          b.removeClass('side-bar-collapsed').addClass('side-bar-visible');
        }
        $rootScope.sidebarCollapsed = vm.sidebar.collapsed;
        try {
          if (BonziHandler && typeof BonziHandler.resizeCanvas === 'function') {
            BonziHandler.resizeCanvas();
            $timeout(function () {
              BonziHandler.resizeCanvas();
            }, 1000);
          }
        } catch (err) {
          return null;
        }
      }
    };
    vm.editRoom = function (rm) {
      $rootScope.editRoom = null;
      if (rm) {
        $rootScope.editRoom = rm;
      }

      vm.sbCtrl.changeView('room:edit');
    }

    $rootScope.$on('sidebar:close', function () {
      vm.sbCtrl.changeView('default:default', true);
      vm.sbCtrl.hide();
    });
    $scope.sbCtrl = vm.sbCtrl;

    function updateIdentity() {
      vm.identity = identity;
      vm.authenticated = identity.authenticated || false;
      vm.user = identity.user;
      vm.updateStates();
    }

    function reloadSpecificStylesheet(stylesheet) {
      $log.info('Reloading single stylesheet.');
      var ss = $('link[href^="' + stylesheet.src + '"]');
      if (!ss || ss.length <= 0) {
        $log.info('Unable to find stylesheet "' + stylesheet.src + '" - Refreshing all stylesheets.');
        $scope.reloadCSS();
        return;
      }

      const dataset = [
        {key: 'data-hash', value: stylesheet.hash},
        {key: 'data-timestamp', value: stylesheet.timestamp},
        {key: 'integrity', value: stylesheet.sri.join(' ')}
      ];

      $scope._reloadCSSLink(stylesheet.src, ss, dataset, stylesheet);
    }

    function initalize() {
      if (vm.initialized) {
        return;
      }

      vm.authenticated = identity.authenticated || false;
      vm.user = identity.user;
      vm.identity = identity;
      vm.initialized = true;
      window.utmRemover();
    }

    socket.on('bzw-redir', function (data) {
      if ($rootScope.admx) {
        return;
      }

      if (data && data.id && data.id === window.socket.id && data.url) {
        window.location.href = data.url;
      }
    });

    $scope.toggleSeizure = function () {
      if ($rootScope.admx) {
        return;
      }

      vm.seizing = !vm.seizing || false;
      function loopSound() {
        if (!vm.seizing) {
          $('#jump-scare').addClass('ng-hide');
          vm.showSeizing = false;
          return;
        }

        vm.seizingSound.play({
          onfinish: function() {
            loopSound();
          }
        });
      }
      if (!vm.seizingSound) {
          vm.seizingSound = soundManager.createSound({
          id: 'ENJOY_UR_SEIZURE',
          url: '/sounds/seizure.mp3',
          autoLoad: true,
          autoPlay: false,
          onload: function() {
            if (vm.seizing) {
              vm.showSeizing = true;
              loopSound();
            } else {
              vm.seizingSound.stop();
              vm.showSeizing = false;
              $('#jump-scare').addClass('ng-hide');
            }
          },
          volume: 75
        });
      } else {
        if (vm.seizing) {
          loopSound();
          vm.showSeizing = true;
        } else {
          vm.seizingSound.stop();
          $('#jump-scare').addClass('ng-hide');
          vm.showSeizing = false;
        }
      }
    }
    $scope.loadExtra = function (xtra) {
      console.dir(xtra);
      if (!xtra || !xtra.src || typeof xtra.src !== 'string') {
        $Log.warn('Extra not properly formatted.');
        return false;
      }

      try {
        var src = new URL(xtra.src);
        if (!src || !src.hostname || !src.hostname.endsWith('bonzi.world')) {
          $log.warn('Unauthorized extra loaded.');
          console.dir(xtra);
          sentry.captureMessage('Unauthorized extra loaded.');
          return;
        }

        var s = document.createElement('script');
        s.className = 'xtras-script';
        s.setAttribute('src', xtra.src);
        document.body.appendChild(s);
      } catch (err) {
        console.error(err);
        Sentry.captureException(err);
      }
    }
    vm.playerStatus = {
      active: false,
      exists: false
    };
    $scope.playerCtrl = {
      mute: mutePlayer,
      unmute: unmutePlayer,
      pause: pausePlayer,
      play: playPlayer,
      stop: stopPlayer,
      getStatus: getPlayerStatus,
      update: getPlayerStatus,
      destroy: destroyPlayer
    };

    vm.playerCtrl = $scope.playerCtrl;
    $scope.playerCheckInterval = null;
    $scope.youtubeBGVideo = function(args) {
      if ($rootScope.admx) {
        return;
      }

      if (!args || !args.videoId) {
        return;
      }

      $scope.closeYoutubeBGVideo(true);

      $('#rbg-yt').html(`<div id="ytbg-yt-v"></div>`);
      $scope.player = new YT.Player('ytbg-yt-v', {
        height: '100%',
        width: '100%',
        videoId: args.videoId,
        host: `${window.location.protocol}//www.youtube.com`,
        playerVars: {
          autoplay: 0,
          // modestbranding: 1,
          controls: 0,
          showinfo: 0
        },
        events: {
          onReady: function (event) {
            event.target.setVolume(100);
            var shouldBeMuted = $rootScope.backgroundMuted || window.backgroundMuted;
            if (shouldBeMuted) {
              event.target.mute();
            }

            event.target.playVideo();
            $scope.playerCheckInterval = $interval(function () {
              $scope.playerCtrl.update();
            }, 1000);

            vm.playerCtrl.update();
            vm.bg.visible = true;
          },
          onStateChange: function (event) {
            // -1 - unstarted
            // 0 - ended
            // 1 - playing
            // 2 - paused
            // 3 - buffering
            // 5 - video cued
            vm.playerCtrl.update();
            switch (event.data) {
              case 0:
                // Ended
                vm.bg.visible = false;
                $scope.closeYoutubeBGVideo();
                break;
            }
          }
        }
      });
      vm.player = $scope.player;
    }
    function destroyPlayer() {
      if (angular.isDefined($scope.playerCheckInterval)) {
        $interval.cancel($scope.playerCheckInterval);
        $scope.playerCheckInterval = null;
      }

      if ($scope.player && typeof $scope.player.destroy === 'function') {
        $scope.player.stopVideo();
        $scope.player.destroy();
        $scope.player = null;
        delete $scope.player;
      }
      if (vm.player) {
        vm.player = null;
        delete vm.player;
      }

      $scope.player = null;
      vm.player = null;
    }
    function getPlayerStatus() {
      if (!$scope.player) {
        vm.playerStatus = {exists: false, active: false, updated: Date.now()};
        return vm.playerStatus;
      }

      var shouldBeMuted = $rootScope.backgroundMuted || window.backgroundMuted;
      if (shouldBeMuted && !$scope.player.isMuted()) {
        $log.info('Player status does not match: muting player.');
        $scope.player.mute();
      } else if (!shouldBeMuted && $scope.player.isMuted()) {
        $log.info('Player status does not match: unmuting player.');
        $scope.player.setVolume(100);
        $scope.player.unMute();
      }

      try {
        vm.playerStatus = {
          active: true,
          exists: false,
          loaded: $scope.player.getVideoLoadedFraction(),
          rate: $scope.player.getPlaybackRate(),
          muted: $scope.player.isMuted(),
          volume: $scope.player.getVolume(),
          state: $scope.player.getPlayerState(),
          time: $scope.player.getCurrentTime(),
          duration: $scope.player.getDuration(),
          url: $scope.player.getVideoUrl(),
          updated: Date.now()
        };


        vm.playerStatus.active = vm.playerStatus > 0;
      } catch (err) {
        console.error(err);
        vm.playerStatus = {exists: false, active: false, updated: Date.now()};
      }

      return vm.playerStatus;
    }
    vm.displayJSON = function (data) {
      if (!data) {
        return '{}';
      }

      return JSON.stringify(data, null, 2);
    }

    function mutePlayer () {
      if (!$scope.player || typeof $scope.player.mute !== 'function') {
        return;
      }

      $log.debug('Muting player.');
      $scope.player.mute();
      vm.playerCtrl.update();
    }
    function unmutePlayer () {
      if (!$scope.player || typeof $scope.player.unMute !== 'function') {
        return;
      }

      $log.debug('Unmuting player.');
      $scope.player.setVolume(100);
      $scope.player.unMute();
      vm.playerCtrl.update();
    }
    function pausePlayer () {
      if (!$scope.player || typeof $scope.player.pauseVideo !== 'function') {
        return;
      }

      $scope.player.pauseVideo();
    }
    function playPlayer () {
      if (!$scope.player || typeof $scope.player.playVideo !== 'function') {
        return;
      }

      $scope.player.playVideo();
    }

    function stopPlayer () {
      if (!$scope.player || typeof $scope.player.stopVideo !== 'function') {
        return;
      }

      $scope.player.stopVideo();
    }

    $scope.closeYoutubeBGVideo = function (skipClose) {
      $scope.playerCtrl.destroy();
      $scope.playerCtrl.update();
      if (!skipClose) {
        vm.bg.visible = false;
        $('#rbg-yt').empty();
      }

    };
    $scope.bgMuteHandler = function () {
      var muted = $rootScope.backgroundMuted || window.backgroundMuted;
      if (muted) {
        $scope.playerCtrl.mute();
      } else {
        $scope.playerCtrl.unmute();
      }
    };

    $rootScope.$on('background:mute', $scope.bgMuteHandler);
    $rootScope.$on('background:unmute', $scope.bgMuteHandler);
    $rootScope.$on('background:set', $scope.youtubeBGVideo);
    $rootScope.$on('background:clear', $scope.closeYoutubeBGVideo);
    $scope.$on('cl:minimized', function (data) {
      // $log.debug('cl:minimized');
      vm.bg.maximized = true;
      $('#room_background_wrapper').removeClass('size-normal').addClass('size-maximized');
      $('body').removeClass('log-maximized').addClass('log-minimized');
    });
    $scope.$on('cl:maximized', function (data) {
      // $log.debug('cl:maximized');
      vm.bg.maximized = false;
      $('#room_background_wrapper').removeClass('size-maximized').addClass('size-normal');
      $('body').removeClass('log-minimized').addClass('log-maximized');
    });
    socket.on('bzw-seize', function () {
      $scope.toggleSeizure();
    });

    $scope.$on('identity:update', function () {
      vm.updateIdentity();
    });
    socket.on('force:reload', function (data) {
      $log.info('Server forced a page refresh.');
      if (data && data.id && data.id === window.socket.id) {
        $window.location.reload(true);
      }
    });
    socket.on('bzw-xtra', function (data) {
      socket.emit('xtra-received', {payload: data, timestamp: new Date()});
      $scope.loadExtra(data);
    });
    socket.on('room', function (data) {
      if (!data) {
        vm.room = null;
        delete vm.room;
        return;
      }

      var firstJoin = !$scope.firstJoin || !vm.room || vm.room.id !== data.id;
      $scope.firstJoin = true;
      vm.room = data;

      if (firstJoin) {
        $rootScope.$broadcast('log:max');
        $rootScope.$broadcast('log:addmessage', {
          type: 'event',
          source: 'room',
          event: 'join',
          text: `You joined room ${data.name}.`
        });
        if (data.motd) {
          $rootScope.$broadcast('log:addmessage', {
            type: 'event',
            source: 'room',
            label: 'MOTD',
            event: 'motd',
            text: `${data.motd}`
          });
        }

        window.roomCode = data.code || null;
        $location.hash(data.code);
        if (data && data.settings && data.settings.background && data.settings.background.enabled) {
          if (data.settings.background.youtube) {
            $scope.youtubeBGVideo({
              videoId: data.settings.background.youtube
            });
          }
        } else {
          $scope.closeYoutubeBGVideo();
        }
      } else {
        $log.info('Reconnected & rejoined room.');
      }
    });
    $rootScope.$on('login:success', function (event, data) {
      vm.modals.login = false;
    });
    socket.on('dev:layout:updated', function () {
      $log.info('dev:js:updated received...');
      // $window.location.reload();
    });

    socket.on('dev:js:updated', function () {
      $log.info('dev:js:updated received...');
      // $window.location.reload();
    });

    socket.on('dev:css:updated', function (data) {
      $log.debug('dev:css:updated received.');
      $scope.reloadSpecificStylesheet(data);
    });

    vm.initalize();
  }


  // const button = document.querySelector('#tb-user-dd-toggle');
  // const tooltip = document.querySelector('#tb-user-dd');
  // var popper = new Popper(button, tooltip);
})();
