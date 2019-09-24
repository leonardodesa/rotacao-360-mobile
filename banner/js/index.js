'use strict';

(function () {

  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var data = window.APP_DATA;
  var idData = -1;
  var i = 0;
  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var enabled = false;
  var toggleElement = document.getElementById('toggleDeviceOrientation');

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);
  var scene, geometry, limiter, view;
  // device orientation
  var deviceOrientationControlMethod = new DeviceOrientationControlMethod();
  var controls = viewer.controls();

  // Create scenes.
  var scenes = data.scenes.map(function (data) {
    var urlPrefix = "assets";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    geometry = new Marzipano.CubeGeometry(data.levels);

    limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100 * Math.PI / 180, 120 * Math.PI / 180);
    view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function (hotspot, i) {
      var idHotspot = data.infoHotspots[i].id;
      var element = createLinkHotspotElement(hotspot, idHotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots.
    data.infoHotspots.forEach(function (hotspot, i) {
      var idHotspot = data.infoHotspots[i].id;
      var element = createInfoHotspotElement(hotspot, idHotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -velocity, friction), true);
  controls.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', velocity, friction), true);
  controls.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', velocity, friction), true);
  controls.registerMethod('inElement', new Marzipano.ElementPressControlMethod(viewInElement, 'zoom', -velocity, friction), true);
  controls.registerMethod('outElement', new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom', velocity, friction), true);

  function createInfoHotspotElement(hotspot, id) {
    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');
    wrapper.setAttribute("id", "hotspot-" + id);
    wrapper.setAttribute("jp-noClick", "");

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');
    header.setAttribute("jp-noClick", "");

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    iconWrapper.setAttribute("jp-noClick", "");
    var icon = document.createElement('img');
    icon.src = 'assets/icons/info.png';
    icon.classList.add('info-hotspot-icon');
    icon.setAttribute("id", "icon-" + id);
    icon.setAttribute("jp-noClick", "");
    iconWrapper.appendChild(icon);

    // Place header and text into wrapper element.
    wrapper.appendChild(header);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.setAttribute("id", "modal-" + id);
    modal.classList.add("modal-wrap");

    var modalImg = document.createElement('img');
    modalImg.classList.add("modal-img");
    modalImg.setAttribute("id", "modal-img-" + id);
    modalImg.src = "assets/thumb-" + id + ".png";

    // close button
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'assets/icons/close.png';
    closeIcon.setAttribute("jp-noClick", "");
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    modal.appendChild(modalImg);
    modal.appendChild(closeWrapper);
    wrapper.appendChild(modal);

    // visible hotspot on click
    var toggle = function () {
      var allWrappers = document.querySelectorAll('.info-hotspot');

      for (var i = 0; i < allWrappers.length; i++) {
        allWrappers[i].setAttribute('class', 'hotspot info-hotspot');
      }
      wrapper.classList.toggle('visible');
    };

    // invisible hotsport close
    var toggleExit = function () {
      wrapper.classList.toggle('visible');
    }

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggleExit);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = ['touchstart', 'touchmove', 'touchend', 'touchcancel',
      'wheel', 'mousewheel'];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function (event) {
        event.stopPropagation();
      });
    }
  }

  // Set up control for enabling/disabling device orientation.
  function enable() {
    deviceOrientationControlMethod.getPitch(function (err, pitch) {
      if (!err) {
        view.setPitch(pitch);
      }
    });
    controls.enableMethod('deviceOrientation');
    enabled = true;
    toggleElement.className = 'enabled';
  }

  function disable() {
    controls.disableMethod('deviceOrientation');
    enabled = false;
    toggleElement.className = '';
  }

  function toggleDevice() {
    if (enabled) {
      disable();
    } else {
      enable();
    }
  }

  function checkPositionCameraAndShowHotspots() {
    var arrayHotspots = APP_DATA.scenes[0].infoHotspots;
    var hotspotsYaw;
    // var hotspotsPitch;

    var viewParams = viewer.view().parameters();
    var yaw = viewParams.yaw.toFixed(2);
    // var pitch = viewParams.pitch.toFixed(2);

    for (var i = 0; i < arrayHotspots.length; i++) {
      hotspotsYaw = arrayHotspots[i].yaw.toFixed(2);
      // hotspotsPitch = arrayHotspots[i].pitch.toFixed(2);

      if (hotspotsYaw == yaw) {
        var idAux = arrayHotspots[i].id;

        if (idData != idAux) {
          idData = idAux;

          var elementShow = document.querySelector('#hotspot-' + arrayHotspots[i].id);

          var allWrappers = document.querySelectorAll('.info-hotspot');

          for (var i = 0; i < allWrappers.length; i++) {
            allWrappers[i].setAttribute('class', 'hotspot info-hotspot');
          }

          elementShow.classList.toggle('visible');
        }
      }
    }
  }

  // show hotspot on deviceOrientation 
  viewer.addEventListener('viewChange', function () {
    checkPositionCameraAndShowHotspots();
  });

  toggleElement.addEventListener('click', toggleDevice);

  controls.registerMethod('deviceOrientation', deviceOrientationControlMethod);

  // show car.
  scene.switchTo();

}());

