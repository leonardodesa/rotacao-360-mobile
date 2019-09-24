"use strict";
var Premium = Premium || {};

Premium.creative = {
  init: function () {
    /* START OF CUSTOM JS */

    switch (document.body.id) {
      case "body_top":
        // top panel code here
        break;

      case "body_main":
        var creative = window.top.document.getElementsByClassName("jpx-mt-ad")[0];
        var index;
        var play = false;
        var percentVisible;

        TweenMax.to('.move-interaction', .6, { opacity: 1, ease: Power2.easeOut });
        TweenMax.fromTo('#move-device', 1, { rotation: -3 }, { rotation: 3, ease: Power2.easeInOut, yoyo: true, repeat: -1 });

        function scrollHandler() {
          percentVisible = getPercentageVisibility();
          if (percentVisible > 250 && !play) {
            play = true;
          }
        }

        function removeInstructionInit() {
          if (play) {
            TweenMax.to('.move-interaction, .shape-black, #move-device', .6, { opacity: 0, delay:2, ease: Power2.easeIn });
          }
        }

        function getPercentageVisibility() {
          var creativeHeight = creative.offsetHeight;
          var topBarRect = window.top.document.getElementsByClassName("jpx-mt-strip-label")[2].getBoundingClientRect();
          var bottomBarRect = window.top.document.getElementsByClassName("jpx-mt-strip-label")[1].getBoundingClientRect();
          var dist = bottomBarRect.top - topBarRect.bottom;
          return dist < 0 ? 0 : Math.round(dist / creativeHeight * 100);
        }

        (window.top.document.getElementById("scrollEl") ||
          window.top).addEventListener("scroll", scrollHandler);

        window.top.addEventListener('touchstart', removeInstructionInit, false);
        window.addEventListener('touchstart', removeInstructionInit, false);
        window.top.addEventListener('mousemove', removeInstructionInit, false);

        break;

      case "body_bottom":
        break;
    }

    /* END OF CUSTOM JS */
  }
};
