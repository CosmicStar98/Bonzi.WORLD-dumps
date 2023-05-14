(function () {
  'use strict';
  angular.module('app.directives')
    .directive('backgroundVideo', BackgroundVideoDirective);

  function BackgroundVideoDirective() {
    return {
      link: function (scope, element) {
        var videoElem = document.createElement('video');
        if (!videoElem.canPlayType) {
          // Cannot play videos. :(
          return false;
        }
        videoElem.muted = true;
        videoElem.loop = true;
        videoElem.preload = true;
        videoElem.playsinline = true;
        videoElem.autoplay = true;
        videoElem.poster = '/dist/img/background/background-video-1.webp';
        videoElem.addEventListener('canplay', function () {
          element.addClass('playing');
        });
        function addSource(src, type) {
          var source = document.createElement('source');
          source.src = src;
          source.type = type;
          videoElem.appendChild(source);
        }
        addSource('/media/video/background-video-1.mp4', 'video/mp4');
        addSource('/media/video/background-video-1.webm', 'video/webm');

        element.append(videoElem);
      }
    };
  }
})();
