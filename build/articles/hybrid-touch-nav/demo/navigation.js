;(function (window, document) {

  function getEl(obj, parent) {
    return obj && obj.nodeType ? obj : (parent && getEl(parent) || document).querySelector(obj);
  }

  var defaultConfig = {
    easingDuration    : 200,
    timingFunction    : 'ease-out',
    navStartDistance  : '-200px',
    mainPushDistance  : '200px',
    handleWidth       : '8%',
    flickThreshold    : 1.4,
    openThreshold     : 0.5
  };

  function Navigation(config) {

    if ('object' != typeof config)
      throw new Error('Navigation expects first parameter to be configuration object');

    var parent = getEl(config.parent);

    if (!parent) {
      throw new Error('Navigation was not supplied with a valid element or selector');
    }

    /**
     * Navigation#elements contains references to the parent and main/nav subcomponents
     * @type {Object}
     */
    this.elements = {
      parent  : parent,
      main    : getEl(config.main, parent),
      nav     : getEl(config.nav, parent)
    };

    if (!this.elements.main || !this.elements.nav) {
      throw new Error('Navigation instance could not find required subcomponents in parent el');
    }

  /**
     * Navigation#config contains the configuration options of the navigation
     * @type {Object}
     */
    this.config = {};

    for (var prop in defaultConfig) {
      this.config[prop] = config[prop] || defaultConfig[prop];
    }

    /**
     * Navigation#state contains information about the current state of the navigation
     * @type {Object}
     */
    this.state = {
      open          : false,
      time          : 0,    // Date at last touchmove event
      x             : 0,    // x position of last touchmove event
      defaultOpen   : null  // Show/hide navigation on next touchend (bool)
    };

    /* ... */

    this.updateParentWidth();
    window.addEventListener('onorientationchange' in window ? 'orientationchange' : 'resize', this.updateParentWidth.bind(this));

    this.close();

    /* ... */

    this.insertHandle(this.elements.main);

  }

  Navigation.prototype.updateParentWidth = function () {
    var parent = this.elements.parent;
    this.parentWidth = parent.innerWidth || parent.clientWidth;
  };

  /* ... */

  Navigation.prototype.open = function () {
    var mainPushTranslate = 'translateX(' + this.config.mainPushDistance + ')',
        navOpenTranslate = 'translateX(0)',
        mainStyle = this.elements.main.style,
        navStyle = this.elements.nav.style;

    this.ease();

    document.addEventListener('backbutton', this.onBackButton, false);

    mainStyle.transform        = mainPushTranslate;
    mainStyle.webkitTransform  = mainPushTranslate;
    navStyle.transform         = navOpenTranslate;
    navStyle.webkitTransform   = navOpenTranslate;

    this.state.open = true;
  };

  Navigation.prototype.close = function () {
    var mainStartTranslate = 'translateX(0)',
        navStartTranslate = 'translateX(' + this.config.navStartDistance + ')',
        mainStyle = this.elements.main.style,
        navStyle = this.elements.nav.style;

    this.ease();

    document.removeEventListener('backbutton', this.onBackButton, false);

    mainStyle.transform        = mainStartTranslate;
    mainStyle.webkitTransform  = mainStartTranslate;
    navStyle.transform         = navStartTranslate;
    navStyle.webkitTransform   = navStartTranslate;

    this.state.open = false;
  };

  Navigation.prototype.ease = function () {
    var easingDuration = this.config.easingDuration,
        timing = this.config.timingFunction + ' all ' + easingDuration + 'ms',
        mainStyle = this.elements.main.style,
        navStyle = this.elements.nav.style;

    mainStyle.transition       = timing;
    mainStyle.webkitTransition = timing;
    navStyle.transition        = timing;
    navStyle.webkitTransition  = timing;

    setTimeout(function() {
      mainStyle.transition       = null;
      mainStyle.webkitTransition = null;
      navStyle.transition        = null;
      navStyle.webkitTransition  = null;
    }, easingDuration);
  };

  Navigation.prototype.onBackButton = function (e) {
    e.preventDefault();
    this.close();
  };

  /* ... */

  Navigation.prototype.insertHandle = function () {
    // Remove any pre-existing handle
    if (this.handle) {
      this.el.main.removeChild(this.handle);
    }

    // Create/configure handle element
    var handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.top = '0';
    handle.style.width = this.config.handleWidth;
    handle.style.height = '100%';

    this.handle = handle;

    /**
     * this.handle now provides access to all of the DOMElement API goodies
     * like event listeners:
     */

    handle.addEventListener('touchmove', this.onTouchMove.bind(this));
    handle.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Ignore touchcancel completely (broken on Android)
    handle.addEventListener('touchcancel', function (e) {
      e.preventDefault();
    });

    this.elements.main.appendChild(handle);
  };

  Navigation.prototype.getMainPushDistance = function () {
    var mainPushDistance = this.config.mainPushDistance;
    return mainPushDistance.indexOf('%') > -1 ?
      parseInt(mainPushDistance) / 100 * this.parentWidth :
      parseInt(mainPushDistance);
  };

  Navigation.prototype.onTouchMove = function (e) {
    e.preventDefault();
    // Create a new date to get current time
    var currentTime = new Date(),
        // Get touch information
        touches = e.touches,
        // Get the current rectangle of the main element
        rect = this.elements.main.getBoundingClientRect(),
        // Get the X position of the touch
        touchX = touches[0].pageX,
        // Determine the distance from the last touch event
        delta = this.state.x - touchX,
        // Calculate the absolute value to determine direction
        absolute = Math.abs(delta),
        // Calculate the velocity of drag
        velocity = absolute / (currentTime - this.state.time),
        mainPushDistance = this.getMainPushDistance();

    // If the drag surpassed the this.config.flickThreshold value,
    // on next touchend:
    //    open the nav if the delta was negative (direction left)
    //    hide the nav if the delta was positive (direction right)
    //    hide the nav if the delta was 0
    if (velocity > this.config.flickThreshold) {
      this.state.defaultOpen = !~(delta && delta / absolute) ? true : false;
    }

    // Update state properties
    this.state.x = touchX;
    this.state.time = currentTime;

    if (
      touchX < mainPushDistance &&
      touchX > 0
    ) {
      // Move the App-main element
      this.elements.main.style.webkitTransform = 'translate3d(' + touchX + 'px, 0, 0)';
      // Move the Nav element
      this.elements.nav.style.webkitTransform = 'translate3d(' + -this.parentWidth / touchX + 'px, 0, 0)';
    }
  };

  Navigation.prototype.onTouchEnd = function () {
    var rect = this.elements.main.getBoundingClientRect(),
        openThreshold = this.config.openThreshold,
        mainPushDistance = this.getMainPushDistance(),
        method;

    if (this.state.defaultOpen === true) {
      this.open();
    } else if (this.state.defaultOpen === false) {
      this.close();
    } else {
      method = this.state.open ?
        rect.left < (1 - openThreshold) * mainPushDistance ? 'close' : 'open':
        rect.left > openThreshold * mainPushDistance ? 'open' : 'close';
      this[method]();
    }

    this.state.defaultOpen = null;
  };

  window.Navigation = Navigation;

}(window, document));